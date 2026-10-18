// Harbor Clinic front end: hash routes for home, booking (4 steps) and managing a booking.
const app = document.getElementById('app');
const live = document.getElementById('live');
const toastEl = document.getElementById('toast');

const VISITS = [
  ['awv', 'Annual Wellness Visit'],
  ['prev', 'Preventive exam'],
  ['sick', 'New concern / sick visit'],
  ['fu', 'Follow-up visit'],
];
const CLINICIANS = [
  ['md', 'Physician (MD/DO)'],
  ['np', 'Nurse practitioner'],
  ['pa', 'Physician assistant'],
];
const STEP_NAMES = ['Visit type', 'Date and time', 'Your details', 'Review'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const labelOf = (list, v) => (list.find(([k]) => k === v) || [, ''])[1];
const pad = (n) => String(n).padStart(2, '0');
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAYS[dt.getDay()]}, ${MONTHS[m - 1]} ${d}`;
}
function timeLabel(t) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}
function announce(msg) {
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 50);
}
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000);
}

// ---------- booking state ----------
const STORE = 'harbor-booking';
function loadState() {
  try { return { step: 1, visit: '', clinician: '', date: '', time: '', ...JSON.parse(sessionStorage.getItem(STORE) || '{}'), patient: null }; }
  catch { return { step: 1, visit: '', clinician: '', date: '', time: '', patient: null }; }
}
let state = loadState();
function saveState() {
  const { step, visit, clinician, date, time } = state;
  try { sessionStorage.setItem(STORE, JSON.stringify({ step, visit, clinician, date, time })); } catch {}
}
function resetState() {
  state = { step: 1, visit: '', clinician: '', date: '', time: '', patient: null };
  try { sessionStorage.removeItem(STORE); } catch {}
}

// ---------- routes ----------
function route() {
  const r = location.hash.replace(/^#/, '') || '/';
  if (r.startsWith('/book')) return renderBook(false);
  if (r.startsWith('/manage')) return renderManage();
  return renderHome();
}
window.addEventListener('hashchange', route);

function renderHome() {
  document.title = 'Harbor Clinic';
  app.innerHTML = `
    <h1>Care close to home</h1>
    <p class="lede">Primary care for adults and families on the waterfront. Same-week appointments with physicians, nurse practitioners and physician assistants.</p>
    <div class="hero">
      <section class="tile">
        <h2>Book a visit</h2>
        <p>Check-ups, sick visits and follow-ups. Takes about three minutes.</p>
        <a class="btn" href="#/book">Book a visit</a>
      </section>
      <section class="tile">
        <h2>Manage a booking</h2>
        <p>Look up an appointment with your booking reference to cancel it.</p>
        <a class="btn ghost" href="#/manage">Find my booking</a>
      </section>
    </div>`;
}

// ---------- booking flow ----------
function stepper() {
  return `<ol class="steps">${STEP_NAMES.map((n, i) => {
    const s = i + 1;
    const attrs = s === state.step ? ' aria-current="step"' : s < state.step ? ' class="done"' : '';
    return `<li${attrs}>${s}. ${n}</li>`;
  }).join('')}</ol>`;
}

function goStep(n) {
  state.step = n;
  saveState();
  renderBook(true);
}

function renderBook(moveFocus) {
  document.title = `Book a visit: ${STEP_NAMES[state.step - 1]} | Harbor Clinic`;
  const body = [null, step1, step2, step3, step4][state.step]();
  app.innerHTML = `<p class="lede">Step ${state.step} of 4</p>${stepper()}${body.html}`;
  body.wire();
  if (moveFocus) {
    const h = app.querySelector('h1');
    h.setAttribute('tabindex', '-1');
    h.focus();
    announce(`Step ${state.step} of 4: ${STEP_NAMES[state.step - 1]}`);
  }
}

function fieldError(input, msg) {
  const id = `${input.id}-err`;
  let p = document.getElementById(id);
  if (!msg) {
    if (p) p.remove();
    input.removeAttribute('aria-invalid');
    return true;
  }
  if (!p) {
    p = document.createElement('p');
    p.className = 'field-error';
    p.id = id;
    input.insertAdjacentElement('afterend', p);
  }
  p.textContent = msg;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', [input.dataset.hint, id].filter(Boolean).join(' '));
  return false;
}

function step1() {
  return {
    html: `
      <h1>What kind of visit do you need?</h1>
      <div class="card">
        <label for="visit">Type of visit</label>
        <select id="visit">
          <option value="">Choose a visit type</option>
          ${VISITS.map(([v, l]) => `<option value="${v}"${state.visit === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
        <details>
          <summary>Which visit type do I need?</summary>
          <dl>
            <dt>Annual Wellness Visit</dt><dd>A yearly prevention-planning visit offered under Medicare Part B for eligible members.</dd>
            <dt>Preventive exam</dt><dd>A routine head-to-toe check-up for adults, with screenings and vaccines as needed.</dd>
            <dt>New concern / sick visit</dt><dd>For a new symptom, illness or injury.</dd>
            <dt>Follow-up visit</dt><dd>To review results or an ongoing condition with your clinician.</dd>
          </dl>
        </details>
        <label for="clinician">Who would you like to see?</label>
        <select id="clinician">
          <option value="">Choose a clinician type</option>
          ${CLINICIANS.map(([v, l]) => `<option value="${v}"${state.clinician === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
        <div class="actions">
          <a href="#/" class="btn ghost">Cancel</a>
          <button type="button" id="next">Continue</button>
        </div>
      </div>`,
    wire() {
      const visit = app.querySelector('#visit');
      const clin = app.querySelector('#clinician');
      app.querySelector('#next').addEventListener('click', () => {
        const a = fieldError(visit, visit.value ? '' : 'Choose a visit type.');
        const b = fieldError(clin, clin.value ? '' : 'Choose who you would like to see.');
        if (!a || !b) {
          (a ? clin : visit).focus();
          return;
        }
        if (clin.value !== state.clinician) state.time = '';
        state.visit = visit.value;
        state.clinician = clin.value;
        goStep(2);
      });
    },
  };
}

function step2() {
  return {
    html: `
      <h1>Pick a date and time</h1>
      <div class="card times-card">
        <label for="date">Date <span class="hint" id="date-hint">We're open Monday to Friday.</span></label>
        <input type="date" id="date" min="${todayIso()}" value="${state.date}" aria-describedby="date-hint" data-hint="date-hint">
        <h2 id="times-heading" style="margin-top:22px">${state.date ? `Available times for ${dayLabel(state.date)}` : 'Available times'}</h2>
        <p class="times-note" id="times-note">${state.date ? '' : 'Choose a date to see open times.'}</p>
        <hc-slot-picker id="picker" label="Available times"></hc-slot-picker>
        <div class="actions">
          <button type="button" class="ghost" id="back">Back</button>
          <button type="button" id="next">Continue</button>
        </div>
      </div>`,
    wire() {
      const date = app.querySelector('#date');
      const heading = app.querySelector('#times-heading');
      const note = app.querySelector('#times-note');
      const picker = app.querySelector('#picker');
      let req = 0;
      async function load() {
        const mine = ++req;
        heading.textContent = `Available times for ${dayLabel(state.date)}`;
        note.textContent = 'No appointments available on this date.';
        picker.slots = [];
        let data;
        try {
          const res = await fetch(`/api/slots?date=${state.date}&clinician=${state.clinician}`);
          data = await res.json();
        } catch {
          data = { closed: true, message: "We couldn't load times. Check your connection and try again." };
        }
        if (mine !== req) return;
        if (data.closed || data.error) {
          note.textContent = data.message || data.error;
          return;
        }
        if (!data.slots.length) return;
        note.textContent = `With ${data.clinician}. Choose a time.`;
        picker.slots = data.slots;
        if (state.time && data.slots.includes(state.time)) picker.choose(state.time);
      }
      picker.addEventListener('slot-select', (e) => {
        state.time = e.detail;
        saveState();
        fieldError(date, '');
      });
      date.addEventListener('change', () => {
        state.date = date.value;
        state.time = '';
        saveState();
        if (state.date) load();
      });
      if (state.date) load();
      app.querySelector('#back').addEventListener('click', () => goStep(1));
      app.querySelector('#next').addEventListener('click', () => {
        if (!state.date) return fieldError(date, 'Choose a date.') || date.focus();
        if (!state.time) {
          fieldError(date, 'Choose a time to continue.');
          announce('Choose a time to continue.');
          return;
        }
        goStep(3);
      });
    },
  };
}

function step3() {
  return {
    html: `
      <h1>Your details</h1>
      <form class="card" id="details" novalidate>
        <label for="first">First name</label>
        <input type="text" id="first" autocomplete="given-name">
        <label for="last">Last name</label>
        <input type="text" id="last" autocomplete="family-name">
        <div class="label" aria-hidden="true">Date of birth</div>
        <input type="text" id="dob" placeholder="MM/DD/YYYY" inputmode="numeric" autocomplete="bday">
        <div class="label" aria-hidden="true">Mobile phone</div>
        <input type="tel" id="phone" autocomplete="tel">
        <label for="email">Email <span class="hint" id="email-hint">We'll send your confirmation here.</span></label>
        <input type="email" id="email" autocomplete="email" aria-describedby="email-hint" data-hint="email-hint">
        <label for="notes">Anything we should know? <span class="hint">Optional</span></label>
        <textarea id="notes"></textarea>
        <div class="actions">
          <button type="button" class="ghost" id="back">Back</button>
          <button type="submit">Continue</button>
        </div>
      </form>`,
    wire() {
      const f = (id) => app.querySelector(`#${id}`);
      f('back').addEventListener('click', () => goStep(2));
      f('details').addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (id) => f(id).value.trim();
        const checks = [
          ['first', v('first') ? '' : 'Enter your first name.'],
          ['last', v('last') ? '' : 'Enter your last name.'],
          ['dob', parseDob(v('dob')) ? '' : 'Enter your date of birth as MM/DD/YYYY, for example 07/04/1990.'],
          ['phone', /^\d{10}$/.test(v('phone')) ? '' : 'Invalid input.'],
          ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')) ? '' : 'Enter an email address like name@example.com.'],
        ];
        let first = null;
        for (const [id, msg] of checks) if (!fieldError(f(id), msg) && !first) first = f(id);
        if (first) {
          const n = checks.filter(([, m]) => m).length;
          announce(`${n} ${n === 1 ? 'field needs' : 'fields need'} attention.`);
          first.focus();
          return;
        }
        state.patient = { first: v('first'), last: v('last'), dob: parseDob(v('dob')), dobText: v('dob'), phone: v('phone'), email: v('email'), notes: f('notes').value };
        goStep(4);
      });
    },
  };
}

function parseDob(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [mo, d, y] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d);
  if (dt.getMonth() !== mo - 1 || dt.getDate() !== d || dt > new Date() || y < 1900) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

function step4() {
  if (!state.patient) {
    state.step = 3;
    return step3();
  }
  const p = state.patient;
  return {
    html: `
      <h1>Review and confirm</h1>
      <div class="card">
        <dl class="review">
          <dt>Visit</dt><dd>${esc(labelOf(VISITS, state.visit))} with a ${esc(labelOf(CLINICIANS, state.clinician).toLowerCase())}</dd><dd><button type="button" class="link" data-go="1">Change<span class="sr-only"> visit</span></button></dd>
          <dt>Date and time</dt><dd>${dayLabel(state.date)} at ${timeLabel(state.time)}</dd><dd><button type="button" class="link" data-go="2">Change<span class="sr-only"> date and time</span></button></dd>
          <dt>Patient</dt><dd>${esc(p.first)} ${esc(p.last)}, born ${esc(p.dobText)}</dd><dd><button type="button" class="link" data-go="3">Change<span class="sr-only"> patient details</span></button></dd>
          <dt>Contact</dt><dd>${esc(p.phone)}<br>${esc(p.email)}</dd><dd></dd>
        </dl>
        <p><button type="button" class="link" id="bring">What should I bring?</button></p>
        <div id="submit-error"></div>
        <div class="actions">
          <button type="button" class="ghost" id="back">Back</button>
          <button type="button" id="confirm">Confirm booking</button>
        </div>
      </div>
      <dialog id="bring-dialog" aria-labelledby="bring-title">
        <h2 id="bring-title">What to bring</h2>
        <ul class="plain">
          <li>A photo ID and your insurance card</li>
          <li>A list of medicines you take, including vitamins</li>
          <li>Arrive 10 minutes early to check in</li>
        </ul>
        <form method="dialog"><button>Close</button></form>
      </dialog>`,
    wire() {
      for (const b of app.querySelectorAll('[data-go]')) b.addEventListener('click', () => goStep(Number(b.dataset.go)));
      app.querySelector('#back').addEventListener('click', () => goStep(3));
      app.querySelector('#bring').addEventListener('click', () => app.querySelector('#bring-dialog').showModal());
      const btn = app.querySelector('#confirm');
      const errBox = app.querySelector('#submit-error');
      btn.addEventListener('click', async () => {
        errBox.innerHTML = '';
        btn.disabled = true;
        btn.textContent = 'Booking...';
        let res, data = {};
        try {
          res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ visit: state.visit, clinician: state.clinician, date: state.date, time: state.time, patient: p }),
          });
          data = await res.json().catch(() => ({}));
        } catch {
          res = { ok: false };
          data = { code: 'NETWORK' };
        }
        if (!res.ok) {
          if (data.code) {
            errBox.innerHTML = `<p class="alert" role="alert">Something went wrong (${esc(data.code)}). Please try again.</p>`;
          }
          btn.disabled = false;
          btn.textContent = 'Confirm booking';
          return;
        }
        renderConfirmed(data, p.email);
      });
    },
  };
}

function renderConfirmed(b, email) {
  resetState();
  document.title = 'Booked | Harbor Clinic';
  app.innerHTML = `
    <section class="success">
      <h1 tabindex="-1">Your appointment is confirmed</h1>
      <p>Booking reference <strong>${esc(b.ref)}</strong></p>
      <p>${esc(b.visit)} on ${esc(b.when)} with ${esc(b.clinicianName)} (${esc(b.clinician.toLowerCase())}).</p>
      <p>We've emailed the details to ${esc(email)}. Keep your booking reference to change or cancel.</p>
      <p><a href="#/">Back to home</a></p>
    </section>`;
  app.querySelector('h1').focus();
  announce(`Your appointment is confirmed. Booking reference ${b.ref}.`);
}

// ---------- manage ----------
function renderManage() {
  document.title = 'Manage a booking | Harbor Clinic';
  app.innerHTML = `
    <h1>Manage a booking</h1>
    <p class="lede">Find your appointment using the reference from your confirmation email.</p>
    <form class="card" id="find" novalidate>
      <label for="ref">Booking reference <span class="hint" id="ref-hint">Starts with HC-, for example HC-1234</span></label>
      <input type="text" id="ref" autocomplete="off" aria-describedby="ref-hint" data-hint="ref-hint">
      <label for="lname">Last name</label>
      <input type="text" id="lname" autocomplete="family-name">
      <div class="actions"><span></span><button type="submit" id="find-btn">Find booking</button></div>
    </form>
    <div id="result"></div>`;
  const form = app.querySelector('#find');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ref = app.querySelector('#ref');
    const lname = app.querySelector('#lname');
    const ok1 = fieldError(ref, ref.value.trim() ? '' : 'Enter your booking reference.');
    const ok2 = fieldError(lname, lname.value.trim() ? '' : 'Enter the last name on the booking.');
    if (!ok1 || !ok2) return (ok1 ? lname : ref).focus();
    const btn = app.querySelector('#find-btn');
    btn.disabled = true;
    const out = app.querySelector('#result');
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(ref.value.trim())}?last=${encodeURIComponent(lname.value.trim())}`);
      if (res.status === 404) {
        out.innerHTML = `<p class="alert" role="alert">We couldn't find a booking with that reference and last name. Check your confirmation email, or call (555) 010-2200.</p>`;
      } else if (!res.ok) {
        out.innerHTML = `<p class="alert" role="alert">Something went wrong looking up your booking. Please try again.</p>`;
      } else {
        renderBookingCard(out, await res.json(), lname.value.trim());
      }
    } catch {
      out.innerHTML = `<p class="alert" role="alert">We couldn't reach the clinic. Check your connection and try again.</p>`;
    }
    btn.disabled = false;
  });
}

function renderBookingCard(out, b, last) {
  const cancelled = b.status === 'cancelled';
  out.innerHTML = `
    <section class="card" aria-labelledby="bk-title">
      <h2 id="bk-title">Appointment ${esc(b.ref)} <span class="status${cancelled ? ' cancelled' : ''}">${cancelled ? 'Cancelled' : 'Booked'}</span></h2>
      <dl class="review">
        <dt>Patient</dt><dd>${esc(b.name)}</dd><dd></dd>
        <dt>Visit</dt><dd>${esc(b.visit)}</dd><dd></dd>
        <dt>When</dt><dd>${esc(b.when)}</dd><dd></dd>
        <dt>With</dt><dd>${esc(b.clinicianName)}</dd><dd></dd>
      </dl>
      ${cancelled ? '' : `
      <div class="actions">
        <button type="button" class="ghost" id="resched">Reschedule</button>
        <button type="button" class="danger" id="cancel-open">Cancel appointment</button>
      </div>
      <p id="resched-note" hidden>To move this appointment, call the front desk at (555) 010-2200. We'll find a new time with you.</p>`}
    </section>`;
  if (cancelled) return;
  out.querySelector('#resched').addEventListener('click', () => { out.querySelector('#resched-note').hidden = false; });
  out.querySelector('#cancel-open').addEventListener('click', () => openCancel(out, b, last));
}

function openCancel(out, b, last) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `
    <div class="modal" role="dialog" aria-labelledby="cx-title">
      <button type="button" class="close" aria-label="Close">&times;</button>
      <h2 id="cx-title">Cancel appointment</h2>
      <p>${esc(b.visit)} on ${esc(b.when)}.</p>
      <p class="hint">Cancelling less than 24 hours before your visit may incur a $40 fee.</p>
      <label for="reason">Reason for cancelling</label>
      <select id="reason">
        <option value="">Choose a reason</option>
        <option>I'm feeling better</option>
        <option>Schedule conflict</option>
        <option>Booked by mistake</option>
        <option>Other</option>
      </select>
      <div class="actions">
        <button type="button" class="ghost" id="cx-back">Go back</button>
        <button type="button" class="danger" id="cx-go">Continue</button>
      </div>
    </div>`;
  document.body.appendChild(scrim);
  const close = () => scrim.remove();
  scrim.querySelector('.close').addEventListener('click', close);
  scrim.querySelector('#cx-back').addEventListener('click', close);
  scrim.querySelector('#cx-go').addEventListener('click', async () => {
    const reason = scrim.querySelector('#reason');
    if (!fieldError(reason, reason.value ? '' : 'Choose a reason so we can keep our schedule accurate.')) return reason.focus();
    const keep = window.confirm(`Keep your appointment on ${b.when}?`);
    close();
    if (keep) {
      toast('Done! Your request has been processed.');
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(b.ref)}/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ last, reason: reason.value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      out.innerHTML = `
        <section class="success" tabindex="-1">
          <h2>Appointment ${esc(b.ref)} has been cancelled</h2>
          <p>We've emailed a cancellation notice. If you need care, you can <a href="#/book">book a new visit</a> any time.</p>
        </section>`;
      out.querySelector('.success').focus();
      announce(`Appointment ${b.ref} has been cancelled.`);
    } catch {
      out.insertAdjacentHTML('afterbegin', `<p class="alert" role="alert">We couldn't cancel your appointment. Please call (555) 010-2200.</p>`);
    }
  });
}

route();
