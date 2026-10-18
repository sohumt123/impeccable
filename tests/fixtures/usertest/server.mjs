// Static server for the usertest fixture shop, plus its one API route.
// node tests/fixtures/usertest/server.mjs [port]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shop');
const port = Number(process.argv[2]) || 4791;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
let orders = 1041;

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/order') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { ship } = JSON.parse(body || '{}');
      // Planted P8: express orders fail server-side.
      if (ship === 'express') {
        res.writeHead(500, { 'content-type': 'application/json' });
        return res.end('{"error":"carrier quote unavailable"}');
      }
      orders += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: `FN-${orders}` }));
    });
    return;
  }
  // Driver lab only: a slow response, for the loading-state test.
  if (req.url === '/api/slow') {
    return setTimeout(() => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"times":["9:00 AM"]}'); }, 1200);
  }
  const file = path.join(root, req.url === '/' ? 'index.html' : path.normalize(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`fixture shop on http://127.0.0.1:${port}/`));
