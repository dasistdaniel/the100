import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { build } from './build.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};
const port = Number(process.env.PORT) || 4173;

let distDir;
try {
  ({ distDir } = await build());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

http
  .createServer(async (request, response) => {
    try {
      const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (urlPath === '/') await build();
      const relative = urlPath === '/' ? 'index.html' : path.normalize(urlPath).replace(/^[\\/]+/, '');
      const file = path.join(distDir, relative);
      if (!file.startsWith(distDir + path.sep)) throw Object.assign(new Error('forbidden'), { code: 'EACCES' });
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch (error) {
      const badRequest = error instanceof URIError;
      const notFound = error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EISDIR';
      response.writeHead(badRequest ? 400 : notFound ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(badRequest ? 'Bad request' : notFound ? 'Not found' : `Build failed:\n${error.message}`);
    }
  })
  .listen(port, () => console.log(`Dev server: http://localhost:${port}/ (rebuilds when you reload)`));
