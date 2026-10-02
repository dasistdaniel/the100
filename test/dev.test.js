import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'dev.js');
const port = 4297;

function startServer() {
  const child = spawn(process.execPath, [script], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = new Promise((resolve, reject) => {
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('Dev server')) resolve();
    });
    child.once('exit', (code) => reject(new Error(`dev server exited early with code ${code}`)));
  });
  return { child, ready };
}

async function status(pathname) {
  const response = await fetch(`http://localhost:${port}${pathname}`);
  await response.arrayBuffer();
  return response.status;
}

test('dev server sends the right content type for feed and icons', async () => {
  const { child, ready } = startServer();
  try {
    await ready;
    const types = {};
    for (const file of ['/feed.xml', '/favicon.svg', '/favicon.ico', '/site.webmanifest']) {
      const response = await fetch(`http://localhost:${port}${file}`);
      await response.arrayBuffer();
      types[file] = response.headers.get('content-type');
    }
    assert.match(types['/feed.xml'], /^application\/rss\+xml/);
    assert.equal(types['/favicon.svg'], 'image/svg+xml');
    assert.equal(types['/favicon.ico'], 'image/x-icon');
    assert.match(types['/site.webmanifest'], /^application\/manifest\+json/);
  } finally {
    child.removeAllListeners('exit');
    child.kill();
  }
});

test('dev server serves pages, rejects bad URLs and survives them', async () => {
  const { child, ready } = startServer();
  try {
    await ready;
    assert.equal(await status('/'), 200);
    assert.equal(await status('/style.css'), 200);
    assert.equal(await status('/does-not-exist.png'), 404);
    assert.equal(await status('/..%2f..%2fpackage.json'), 404);
    assert.equal(await status('/%'), 400);
    assert.equal(await status('/%E0%A4'), 400);
    assert.equal(await status('/'), 200, 'server still answers after the bad requests');
  } finally {
    child.removeAllListeners('exit');
    child.kill();
  }
});
