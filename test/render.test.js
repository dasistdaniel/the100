import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, renderTile, renderPage, sortForDisplay } from '../scripts/lib/render.js';

const game = (overrides = {}) => ({
  number: 7,
  slug: 'moji',
  folder: '007-moji',
  title: 'MojiBlast',
  date: '2026-03-14',
  repo: 'https://github.com/a/moji',
  playUrl: null,
  tags: [],
  emoji: null,
  body: 'Hello **world**',
  hasScreenshot: false,
  ...overrides,
});

test('renders Markdown', () => {
  assert.match(renderMarkdown('Hello **world**'), /<strong>world<\/strong>/);
});

test('escapes raw HTML and scripts in descriptions', () => {
  const html = renderMarkdown('Hi <script>alert(1)</script> <img src=x onerror=alert(1)>\n\n<div onclick="x()">block</div>');
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /<div/i);
  assert.match(html, /&lt;script&gt;/);
});

test('only http(s) and mailto links survive in descriptions', () => {
  const html = renderMarkdown('[bad](javascript:alert(1)) [ok](https://example.com/x?a=1&b=2) ![pic](https://x.test/a.png)');
  assert.doesNotMatch(html, /javascript:/i);
  assert.match(html, /<a href="https:\/\/example\.com\/x\?a=1&amp;b=2">ok<\/a>/);
  assert.doesNotMatch(html, /<img/i);
});

test('tile shows number, title, date and a Code button but no Spielen button without play_url', () => {
  const html = renderTile(game());
  assert.match(html, /<article class="tile" id="game-007">/);
  assert.match(html, /#007/);
  assert.match(html, /MojiBlast/);
  assert.match(html, /<time datetime="2026-03-14">14\.03\.2026<\/time>/);
  assert.match(html, /href="https:\/\/github\.com\/a\/moji"/);
  assert.doesNotMatch(html, /Spielen/);
});

test('tile shows a Spielen button when play_url is set', () => {
  const html = renderTile(game({ playUrl: 'https://example.com/play' }));
  assert.match(html, /<a class="btn btn-primary" href="https:\/\/example\.com\/play">Spielen<span class="vh"> MojiBlast<\/span><\/a>/);
});

test('tile uses the screenshot with alt text, or an aria-hidden placeholder', () => {
  const withShot = renderTile(game({ hasScreenshot: true }));
  assert.match(withShot, /<img src="games\/007-moji\/screenshot\.png" alt="Screenshot von MojiBlast" loading="lazy">/);

  const emoji = renderTile(game({ emoji: '💥' }));
  assert.match(emoji, /<span class="placeholder" aria-hidden="true">💥<\/span>/);
  assert.doesNotMatch(emoji, /<img/);

  const numberOnly = renderTile(game());
  assert.match(numberOnly, /<span class="placeholder" aria-hidden="true">#007<\/span>/);
});

test('special characters in title, tags and emoji are escaped in text and attributes', () => {
  const html = renderTile(
    game({
      title: 'Tom & "Jerry" <b>',
      tags: ['<i>x</i>'],
      emoji: '<3',
      hasScreenshot: true,
      playUrl: 'https://example.com/?a=1&b="2"',
    }),
  );
  assert.doesNotMatch(html, /<b>/);
  assert.doesNotMatch(html, /<i>/);
  assert.match(html, /alt="Screenshot von Tom &amp; &quot;Jerry&quot; &lt;b&gt;"/);
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=&quot;2&quot;"/);
});

test('sortForDisplay puts the newest first and does not mutate', () => {
  const games = [
    game({ number: 1, date: '2026-01-01' }),
    game({ number: 3, date: '2026-03-01' }),
    game({ number: 2, date: '2026-03-01' }),
  ];
  assert.deepEqual(sortForDisplay(games).map((g) => g.number), [3, 2, 1]);
  assert.deepEqual(games.map((g) => g.number), [1, 3, 2]);
});

const template = '{{count}}|{{total}}|{{percent}}|{{cells}}|{{tiles}}|{{buildDate}}';

test('renderPage fills progress, cells, tiles and build date', () => {
  const html = renderPage({ template, games: [game({ number: 1 }), game({ number: 2, folder: '002-b', title: 'B' })], buildDate: '2026-10-01' });
  const [count, total, percent, cells, tiles, buildDate] = html.split('|');
  assert.equal(count, '2');
  assert.equal(total, '100');
  assert.equal(percent, '2');
  assert.equal((cells.match(/class="cell/g) ?? []).length, 100);
  assert.equal((cells.match(/class="cell done"/g) ?? []).length, 2);
  assert.match(cells, /<a class="cell done" href="#game-001" tabindex="-1"><\/a>/);
  assert.equal((tiles.match(/<article/g) ?? []).length, 2);
  assert.equal(buildDate, '2026-10-01');
});

test('renderPage shows an empty state without games', () => {
  const html = renderPage({ template, games: [], buildDate: '2026-10-01' });
  assert.match(html, /^0\|100\|0\|/);
  assert.match(html, /Noch kein Spiel fertig/);
  assert.doesNotMatch(html, /<article/);
});

test('renderPage does not re-expand placeholders found inside game content and rejects unknown ones', () => {
  const html = renderPage({ template: '{{tiles}}', games: [game({ title: '{{buildDate}}' })], buildDate: 'X' });
  assert.match(html, /\{\{buildDate\}\}/);
  assert.throws(() => renderPage({ template: '{{nope}}', games: [], buildDate: 'X' }), /\{\{nope\}\}/);
});
