// ════════════════════════════════════════════════════════
//  HOSPITAL OLVIDADO — Servidor Web Local Ultrarrápido
//  Zero-dependencies, Streaming para archivos 3D y WebXR
// ════════════════════════════════════════════════════════

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePorts = [8080, 8081, 8082, 8085, 3000, 5000, 8000];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
};

function createServerOnPort(portIndex = 0) {
  if (portIndex >= candidatePorts.length) {
    console.error('❌ Error: No se encontró ningún puerto disponible.');
    process.exit(1);
  }

  const port = candidatePorts[portIndex];
  const server = http.createServer((req, res) => {
    // Cabeceras CORS y optimizaciones WebGPU / WebXR
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${reqPath}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const totalSize = stats.size;

      // Soporte de HTTP Range (fundamental para audio y streaming de modelos 3D GLB grandes)
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize) {
          res.writeHead(416, {
            'Content-Range': `bytes */${totalSize}`,
          });
          res.end();
          return;
        }

        const chunksize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mime,
        });

        const stream = fs.createReadStream(filePath, { start, end });
        req.on('close', () => stream.destroy());
        stream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': totalSize,
          'Content-Type': mime,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
        });

        const stream = fs.createReadStream(filePath);
        req.on('close', () => stream.destroy());
        stream.pipe(res);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      createServerOnPort(portIndex + 1);
    } else {
      console.error('Error en el servidor:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://127.0.0.1:${port}`;
    console.log('════════════════════════════════════════════════════════');
    console.log('  HOSPITAL OLVIDADO — Servidor Web Local (Node.js)      ');
    console.log('════════════════════════════════════════════════════════');
    console.log(`[OK] Servidor activo en: ${url} (y http://localhost:${port})`);
    console.log(`[OK] Streaming de GLB (68.8 MB) y audio habilitado.`);
    console.log('Abriendo en tu navegador predeterminado...\n');

    // Abrir navegador automáticamente según SO
    const startCmd = process.platform === 'win32' ? `start ${url}` :
                     process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(startCmd, () => {});
  });
}

createServerOnPort(0);
