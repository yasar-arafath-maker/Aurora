const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://127.0.0.1:4173');
  let pathname = parsedUrl.pathname;
  if (pathname === '/') pathname = '/lenskart-ar.html';
  const filePath = path.join(dir, pathname);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

const PORT = 4173;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`================================================================`);
  console.log(`LENSKART 3D AR STUDIO — INSTANT VIRTUAL TRY-ON ENGINE`);
  console.log(`================================================================`);
  console.log(`• Try-On Studio : http://127.0.0.1:${PORT}/lenskart-ar.html`);
  console.log(`• SolarFit AR   : http://127.0.0.1:${PORT}/solarfit-ar.html`);
  console.log(`================================================================`);
});
