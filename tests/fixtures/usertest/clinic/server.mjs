// Static server for the Harbor Clinic usertest fixture, plus its JSON API.
// node tests/fixtures/usertest/clinic/server.mjs [port]
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.argv[2]) || 4792;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const CLINICIANS = {
  np: { label: 'Nurse practitioner', name: 'Dana Whitfield, NP', times: ['08:30', '09:00', '09:30', '10:30', '11:00', '13:30', '14:00', '15:30'] },
  md: { label: 'Physician (MD/DO)', name: 'Dr. Elena Park', times: ['09:00', '10:00', '11:30', '14:30', '16:00'] },
  pa: { label: 'Physician assistant', name: 'Marcus Bell, PA', times: ['08:00', '08:45', '10:15', '13:00', '15:00'] },
};
const VISITS = {
  awv: 'Annual Wellness Visit',
  prev: 'Preventive exam',
  sick: 'New concern / sick visit',
  fu: 'Follow-up visit',
};

// Each browser session gets its own copy of the booking book, so parallel testers don't collide.
const sessions = new Map();
function seed() {
  return new Map([
    ['HC-4471', { ref: 'HC-4471', last: 'Lee', first: 'Morgan', visit: 'fu', clinician: 'md', date: '2026-11-05', time: '10:00', status: 'booked' }],
  ]);
}
function session(req, res) {
  const m = /(?:^|;\s*)hcsid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  let id = m && m[1];
  if (!id || !sessions.has(id)) {
    id = crypto.randomBytes(8).toString('hex');
    sessions.set(id, { bookings: seed(), next: 5200 });
    res.setHeader('set-cookie', `hcsid=${id}; Path=/; SameSite=Lax`);
  }
  return sessions.get(id);
}

const pad = (n) => String(n).padStart(2, '0');
function parseDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function longDate(iso) {
  return parseDay(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function longTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}
function publicBooking(b) {
  return {
    ref: b.ref,
    name: `${b.first} ${b.last}`,
    visit: VISITS[b.visit],
    clinician: CLINICIANS[b.clinician].label,
    clinicianName: CLINICIANS[b.clinician].name,
    date: b.date,
    time: b.time,
    when: `${longDate(b.date)} at ${longTime(b.time)}`,
    status: b.status,
  };
}
function ageOn(dobIso, onIso) {
  const d = parseDay(dobIso), o = parseDay(onIso);
  let age = o.getUTCFullYear() - d.getUTCFullYear();
  if (o.getUTCMonth() < d.getUTCMonth() || (o.getUTCMonth() === d.getUTCMonth() && o.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

function send(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { resolve(null); }
    });
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(req, res, url) {
  const s = session(req, res);

  if (req.method === 'GET' && url.pathname === '/api/slots') {
    await wait(1400);
    const date = url.searchParams.get('date');
    const kind = url.searchParams.get('clinician');
    const day = parseDay(date);
    if (!day || !CLINICIANS[kind]) return send(res, 400, { error: 'Choose a clinician and a date.' });
    if (date < todayIso()) return send(res, 200, { closed: true, message: 'That date has passed. Pick a date from today onward.' });
    const dow = day.getUTCDay();
    if (dow === 0 || dow === 6) return send(res, 200, { closed: true, message: "We're closed on weekends. Please pick a weekday." });
    const taken = new Set([...s.bookings.values()].filter((b) => b.status === 'booked' && b.date === date && b.clinician === kind).map((b) => b.time));
    return send(res, 200, { closed: false, clinician: CLINICIANS[kind].name, slots: CLINICIANS[kind].times.filter((t) => !taken.has(t)) });
  }

  if (req.method === 'POST' && url.pathname === '/api/bookings') {
    const b = await readJson(req);
    await wait(500);
    if (!b) return send(res, 400, { error: 'bad json' });
    const p = b.patient || {};
    if (!VISITS[b.visit] || !CLINICIANS[b.clinician] || !parseDay(b.date) || !b.time || !p.first || !p.last || !p.dob || !p.phone || !p.email) {
      return send(res, 400, { error: 'missing fields' });
    }
    if (!CLINICIANS[b.clinician].times.includes(b.time)) return send(res, 409, { code: 'E-09', error: 'slot unavailable' });
    if (b.visit === 'awv' && ageOn(p.dob, b.date) < 65) return send(res, 422, { code: 'E-17', error: 'eligibility rule failed' });
    if ((p.notes || '').length > 200) return send(res, 422, { error: 'notes too long' });
    s.next += 1;
    const ref = `HC-${s.next}`;
    const rec = { ref, first: p.first, last: p.last, visit: b.visit, clinician: b.clinician, date: b.date, time: b.time, status: 'booked' };
    s.bookings.set(ref, rec);
    return send(res, 201, publicBooking(rec));
  }

  const one = /^\/api\/bookings\/([^/]+)(\/cancel)?$/.exec(url.pathname);
  if (one) {
    const ref = decodeURIComponent(one[1]).trim().toUpperCase();
    const rec = s.bookings.get(ref);
    if (req.method === 'GET' && !one[2]) {
      await wait(400);
      const last = (url.searchParams.get('last') || '').trim().toLowerCase();
      if (!rec || rec.last.toLowerCase() !== last) return send(res, 404, { error: 'not found' });
      return send(res, 200, publicBooking(rec));
    }
    if (req.method === 'POST' && one[2]) {
      const body = (await readJson(req)) || {};
      await wait(400);
      if (!rec || rec.last.toLowerCase() !== String(body.last || '').trim().toLowerCase()) return send(res, 404, { error: 'not found' });
      rec.status = 'cancelled';
      rec.reason = body.reason || '';
      return send(res, 200, publicBooking(rec));
    }
  }
  return send(res, 404, { error: 'no such route' });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch(() => send(res, 500, { error: 'server error' }));
    return;
  }
  const rel = url.pathname === '/' ? 'index.html' : path.normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('not found');
  }
  if (path.extname(file) === '.html') session(req, res);
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Harbor Clinic fixture on http://127.0.0.1:${port}/`));
