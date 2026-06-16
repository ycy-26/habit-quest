// Tiny static server for testing the PWA over http://localhost (service workers need http/https, not file://).
// Run:  node serve.js     then open  http://localhost:8000/
const http = require('http'), fs = require('fs'), path = require('path');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.ico': 'image/x-icon'
};
const root = process.cwd(), port = process.env.PORT || 8000;
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/habit-quest.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`Habit Quest → http://localhost:${port}/`));
