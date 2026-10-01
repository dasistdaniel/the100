import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadGames } from '../scripts/lib/load-games.js';

const md = (title) => `---\ntitle: ${title}\ndate: 2026-03-14\nrepo: https://github.com/a/${title}\n---\nText\n`;

async function tempGames(setup) {
  const dir = await mkdtemp(path.join(tmpdir(), 'the100-games-'));
  await setup(dir);
  return dir;
}

test('returns an empty list when the folder does not exist', async () => {
  assert.deepEqual(await loadGames(path.join(tmpdir(), 'the100-does-not-exist')), []);
});

test('loads games sorted by number and detects screenshots', async () => {
  const dir = await tempGames(async (root) => {
    await mkdir(path.join(root, '002-b'));
    await writeFile(path.join(root, '002-b', 'index.md'), md('B'));
    await mkdir(path.join(root, '001-a'));
    await writeFile(path.join(root, '001-a', 'index.md'), md('A'));
    await writeFile(path.join(root, '001-a', 'screenshot.png'), 'x');
  });
  try {
    const games = await loadGames(dir);
    assert.deepEqual(games.map((g) => g.folder), ['001-a', '002-b']);
    assert.equal(games[0].hasScreenshot, true);
    assert.equal(games[1].hasScreenshot, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('ignores stray files but fails on a game folder without index.md', async () => {
  const dir = await tempGames(async (root) => {
    await writeFile(path.join(root, '.DS_Store'), 'x');
    await writeFile(path.join(root, 'README.md'), 'x');
  });
  try {
    assert.deepEqual(await loadGames(dir), []);
    await mkdir(path.join(dir, '003-c'));
    await assert.rejects(loadGames(dir), /games\/003-c: index\.md is missing/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('fails on duplicate numbers', async () => {
  const dir = await tempGames(async (root) => {
    for (const name of ['007-a', '007-b']) {
      await mkdir(path.join(root, name));
      await writeFile(path.join(root, name, 'index.md'), md(name.slice(4)));
    }
  });
  try {
    await assert.rejects(loadGames(dir), /Duplicate game number 007/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
