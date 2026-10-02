import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  decideAction,
  detectImageType,
  downloadImage,
  githubRepoOf,
  matchesFilter,
  parsePreviewArgs,
  pngSize,
} from '../scripts/lib/previews.js';

// A real 1x1 PNG header is enough for size detection; the rest of the file is not decoded here.
function fakePng(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

test('parsePreviewArgs reads flags and game filters', () => {
  assert.deepEqual(parsePreviewArgs([]), { force: false, includeGenerated: false, dryRun: false, only: [] });
  assert.deepEqual(parsePreviewArgs(['--force', '--dry-run', '008', 'wuffel', '--include-generated']), {
    force: true,
    includeGenerated: true,
    dryRun: true,
    only: ['008', 'wuffel'],
  });
  assert.throws(() => parsePreviewArgs(['--nope']), /Unknown option "--nope"/);
});

test('githubRepoOf extracts owner/name from GitHub URLs only', () => {
  assert.equal(githubRepoOf('https://github.com/dasistdaniel/MojiBlast'), 'dasistdaniel/MojiBlast');
  assert.equal(githubRepoOf('https://github.com/dasistdaniel/MojiBlast/'), 'dasistdaniel/MojiBlast');
  assert.equal(githubRepoOf('https://github.com/dasistdaniel/MojiBlast.git'), 'dasistdaniel/MojiBlast');
  assert.equal(githubRepoOf('https://gitlab.com/a/b'), null);
  assert.equal(githubRepoOf('https://github.com/onlyowner'), null);
});

test('matchesFilter accepts number, padded number, slug and folder', () => {
  const game = { number: 8, slug: 'mojiblast', folder: '008-mojiblast' };
  assert.equal(matchesFilter(game, []), true);
  for (const filter of ['8', '008', 'mojiblast', 'MojiBlast', '008-mojiblast']) {
    assert.equal(matchesFilter(game, [filter]), true, filter);
  }
  assert.equal(matchesFilter(game, ['9', 'wuffel']), false);
  assert.equal(matchesFilter(game, ['wuffel', '8']), true);
});

test('decideAction never replaces a screenshot without --force and never uses the generic card unasked', () => {
  const base = { hasScreenshot: false, usesCustom: true, force: false, includeGenerated: false };
  assert.equal(decideAction(base), 'download');
  assert.equal(decideAction({ ...base, hasScreenshot: true }), 'skip-exists');
  assert.equal(decideAction({ ...base, hasScreenshot: true, force: true }), 'download');
  assert.equal(decideAction({ ...base, usesCustom: false }), 'skip-generated');
  assert.equal(decideAction({ ...base, usesCustom: false, includeGenerated: true }), 'download');
  // --force alone must not swap a hand-made screenshot for the generic card
  assert.equal(decideAction({ ...base, usesCustom: false, hasScreenshot: true, force: true }), 'skip-generated');
  // with --include-generated and --force the user asked for it
  assert.equal(decideAction({ ...base, usesCustom: false, hasScreenshot: true, force: true, includeGenerated: true }), 'download');
});

test('pngSize reads width and height from the header, or null for other data', () => {
  assert.deepEqual(pngSize(fakePng(1280, 640)), { width: 1280, height: 640 });
  assert.equal(pngSize(Buffer.from('not a png at all, just text')), null);
  assert.equal(pngSize(Buffer.alloc(4)), null);
});

test('detectImageType recognizes png and jpeg by content, not by name', () => {
  assert.equal(detectImageType(fakePng(1, 1)), 'png');
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'jpeg');
  assert.equal(detectImageType(Buffer.from('<html>')), null);
});

async function withServer(handler, run) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
}

test('downloadImage returns the bytes and follows redirects', async () => {
  const png = fakePng(1280, 640);
  await withServer(
    (request, response) => {
      if (request.url === '/start') {
        response.writeHead(302, { Location: '/image.png' });
        response.end();
      } else {
        response.writeHead(200, { 'Content-Type': 'image/png' });
        response.end(png);
      }
    },
    async (base) => {
      const bytes = await downloadImage(`${base}/start`);
      assert.equal(Buffer.compare(bytes, png), 0);
    },
  );
});

test('downloadImage fails clearly on HTTP errors and non-image answers', async () => {
  await withServer(
    (request, response) => {
      if (request.url === '/missing') {
        response.writeHead(404);
        response.end();
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end('<html>login</html>');
      }
    },
    async (base) => {
      await assert.rejects(downloadImage(`${base}/missing`), /HTTP 404/);
      await assert.rejects(downloadImage(`${base}/page`), /not an image/);
    },
  );
});
