/**
 * tests/serve.js — DEBUG_1 §3.8
 *
 * 輕量 Node 內建 http static server，serve repo root。
 * 冇 external deps（避免裝 http-server）。
 * 用法：node tests/serve.js [port]  （default 4173）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2] || process.env.PORT || '4173', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8'
};

const BASE_PREFIX = '/ai-learning';

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  // GitHub Pages 部署係 https://ai-lish.github.io/ai-learning/...
  // 本地測試可以兩種寫法都接受：/ai-learning/... 同 /
  if (url === '/') url = '/index.html';
  // Strip /ai-learning prefix if present, so /ai-learning/css/foo.css
  // resolves to <ROOT>/css/foo.css
  if (url.startsWith(BASE_PREFIX + '/')) {
    url = url.slice(BASE_PREFIX.length);
  } else if (url === BASE_PREFIX) {
    url = '/index.html';
  }
  const filePath = path.join(ROOT, url);
  if (!filePath.startsWith(ROOT)) {
    res.statusCode = 403; res.end('forbidden'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404; res.end('not found: ' + url); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('serving ' + ROOT + ' at http://127.0.0.1:' + PORT);
});
