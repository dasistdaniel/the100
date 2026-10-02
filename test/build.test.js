import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build.js';

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const md = (title, extra = '') => `---\ntitle: ${title}\ndate: 2026-03-14\nrepo: https://github.com/a/${title}\n${extra}---\nText\n`;

async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), 'the100-build-'));
  return { root, gamesDir: path.join(root, 'games'), distDir: path.join(root, 'dist') };
}

test('builds index, assets and screenshots', async () => {
  const { root, gamesDir, distDir } = await workspace();
  try {
    await mkdir(path.join(gamesDir, '001-a'), { recursive: true });
    await writeFile(path.join(gamesDir, '001-a', 'index.md'), md('A'));
    await writeFile(path.join(gamesDir, '001-a', 'screenshot.png'), 'not really a png');
    await mkdir(path.join(gamesDir, '002-b'), { recursive: true });
    await writeFile(path.join(gamesDir, '002-b', 'index.md'), md('B', 'play_url: https://example.com/b\n'));

    const result = await build({ siteDir, gamesDir, distDir, buildDate: '2026-10-01' });
    assert.equal(result.count, 2);

    const html = await readFile(path.join(distDir, 'index.html'), 'utf8');
    assert.match(html, /<strong>2 \/ 100<\/strong>/);
    assert.match(html, /Zuletzt gebaut am 2026-10-01/);
    assert.match(html, /games\/001-a\/screenshot\.png/);
    assert.doesNotMatch(html, /\{\{/);
    assert.doesNotMatch(html, /href="\//);
    assert.doesNotMatch(html, /src="\//);

    const css = await readFile(path.join(distDir, 'style.css'), 'utf8');
    assert.match(css, /--bg:#[0-9a-f]{6}/);
    assert.match(css, /\.tile\s*\{/);

    assert.match(html, /<link rel="alternate" type="application\/rss\+xml" title="The 100" href="feed\.xml">/);
    assert.match(html, /<a class="btn" href="feed\.xml">RSS/);
    const feed = await readFile(path.join(distDir, 'feed.xml'), 'utf8');
    assert.match(feed, /<rss version="2\.0"/);
    assert.equal((feed.match(/<item>/g) ?? []).length, 2);
    assert.match(feed, /<link>https:\/\/dasistdaniel\.github\.io\/the100\/#game-002<\/link>/);

    await stat(path.join(distDir, 'app.js'));
    for (const icon of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
      await stat(path.join(distDir, icon));
    }
    assert.match(html, /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/);
    assert.match(html, /<h1[^>]*>[\s\S]*<svg /);
    await stat(path.join(distDir, 'games', '001-a', 'screenshot.png'));
    await assert.rejects(stat(path.join(distDir, 'games', '002-b', 'screenshot.png')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('builds with no games folder and shows 0 / 100 with an empty state', async () => {
  const { root, gamesDir, distDir } = await workspace();
  try {
    const result = await build({ siteDir, gamesDir, distDir, buildDate: '2026-10-01' });
    assert.equal(result.count, 0);
    const html = await readFile(path.join(distDir, 'index.html'), 'utf8');
    assert.match(html, /<strong>0 \/ 100<\/strong>/);
    assert.match(html, /Noch kein Spiel fertig/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('removes stale files from a previous build', async () => {
  const { root, gamesDir, distDir } = await workspace();
  try {
    await mkdir(distDir, { recursive: true });
    await writeFile(path.join(distDir, 'old.txt'), 'x');
    await build({ siteDir, gamesDir, distDir, buildDate: '2026-10-01' });
    await assert.rejects(stat(path.join(distDir, 'old.txt')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails with the game folder named when a game is invalid', async () => {
  const { root, gamesDir, distDir } = await workspace();
  try {
    await mkdir(path.join(gamesDir, '001-a'), { recursive: true });
    await writeFile(path.join(gamesDir, '001-a', 'index.md'), '---\ntitle: A\n---\n');
    await assert.rejects(build({ siteDir, gamesDir, distDir }), /games\/001-a: "date"/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when the palette violates WCAG contrast', async () => {
  const { root, gamesDir, distDir } = await workspace();
  try {
    const badSite = path.join(root, 'site');
    await cp(siteDir, badSite, { recursive: true });
    const palette = JSON.parse(await readFile(path.join(badSite, 'palette.json'), 'utf8'));
    palette.light.text = '#eeeeee';
    await writeFile(path.join(badSite, 'palette.json'), JSON.stringify(palette));
    await assert.rejects(build({ siteDir: badSite, gamesDir, distDir }), /contrast.*light.*text.*bg/is);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
