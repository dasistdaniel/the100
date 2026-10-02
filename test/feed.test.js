import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSiteUrl, renderFeed } from '../scripts/lib/feed.js';

const site = {
  url: 'https://example.github.io/the100/',
  title: 'The 100',
  description: '100 kleine Spiele',
};

const game = (overrides = {}) => ({
  number: 8,
  slug: 'mojiblast',
  folder: '008-mojiblast',
  title: 'MojiBlast',
  date: '2026-10-01',
  repo: 'https://github.com/a/moji',
  playUrl: null,
  tags: [],
  emoji: null,
  body: 'Ein **Spiel**.',
  hasScreenshot: false,
  ...overrides,
});

const feed = (games, extra = {}) => renderFeed({ games, ...site, buildDate: '2026-10-02', ...extra });
const count = (text, re) => (text.match(re) ?? []).length;

test('is an RSS 2.0 document with channel data and a self link', () => {
  const xml = feed([game()]);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0" xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom">/);
  assert.match(xml, /<title>The 100<\/title>/);
  assert.match(xml, /<link>https:\/\/example\.github\.io\/the100\/<\/link>/);
  assert.match(xml, /<description>100 kleine Spiele<\/description>/);
  assert.match(xml, /<language>de<\/language>/);
  assert.match(xml, /<atom:link href="https:\/\/example\.github\.io\/the100\/feed\.xml" rel="self" type="application\/rss\+xml"\/>/);
  assert.match(xml, /<lastBuildDate>Fri, 02 Oct 2026 12:00:00 GMT<\/lastBuildDate>/);
  assert.match(xml, /<\/channel>\n<\/rss>\n$/);
});

test('every game is an item with number, link, guid and an RFC 822 date', () => {
  const xml = feed([game()]);
  assert.equal(count(xml, /<item>/g), 1);
  assert.match(xml, /<title>#008 MojiBlast<\/title>/);
  assert.match(xml, /<link>https:\/\/example\.github\.io\/the100\/#game-008<\/link>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/example\.github\.io\/the100\/#game-008<\/guid>/);
  assert.match(xml, /<pubDate>Thu, 01 Oct 2026 12:00:00 GMT<\/pubDate>/);
});

test('items are sorted newest first', () => {
  const xml = feed([
    game({ number: 1, title: 'Old', date: '2026-02-22' }),
    game({ number: 3, title: 'New', date: '2026-10-01' }),
    game({ number: 2, title: 'Mid', date: '2026-09-12' }),
  ]);
  const titles = [...xml.matchAll(/<item>\s*<title>([^<]*)<\/title>/g)].map((m) => m[1]);
  assert.deepEqual(titles, ['#003 New', '#002 Mid', '#001 Old']);
});

test('the description holds escaped HTML, with the screenshot only when there is one', () => {
  const plain = feed([game()]);
  assert.match(plain, /<description>&lt;p&gt;Ein &lt;strong&gt;Spiel&lt;\/strong&gt;\.&lt;\/p&gt;\s*<\/description>/);
  assert.doesNotMatch(plain, /&lt;img/);

  const withShot = feed([game({ hasScreenshot: true })]);
  assert.ok(
    withShot.includes(
      '&lt;img src=&quot;https://example.github.io/the100/games/008-mojiblast/screenshot.png&quot; alt=&quot;Screenshot von MojiBlast&quot;&gt;',
    ),
  );
});

test('tags become categories', () => {
  const xml = feed([game({ tags: ['emoji', 'a&b'] })]);
  assert.match(xml, /<category>emoji<\/category>/);
  assert.match(xml, /<category>a&amp;b<\/category>/);
});

test('special characters are escaped and control characters are removed', () => {
  const xml = feed([game({ title: 'Tom & <Jerry> "x"\u0001', body: 'a ]]> b' })]);
  assert.match(xml, /<title>#008 Tom &amp; &lt;Jerry&gt; &quot;x&quot;<\/title>/);
  assert.doesNotMatch(xml, /\u0001/);
  assert.doesNotMatch(xml, /\]\]>/);
});

test('an empty list still gives a valid channel without items', () => {
  const xml = feed([]);
  assert.equal(count(xml, /<item>/g), 0);
  assert.match(xml, /<channel>/);
});

test('normalizeSiteUrl needs an https URL and adds the trailing slash', () => {
  assert.equal(normalizeSiteUrl('https://a.example/the100'), 'https://a.example/the100/');
  assert.equal(normalizeSiteUrl('https://a.example/the100/'), 'https://a.example/the100/');
  assert.throws(() => normalizeSiteUrl('http://a.example/'), /https/);
  assert.throws(() => normalizeSiteUrl('nope'), /https/);
  assert.throws(() => normalizeSiteUrl(undefined), /https/);
});

test('the feed uses the normalized site url', () => {
  const xml = renderFeed({ games: [game()], ...site, url: 'https://a.example/the100', buildDate: '2026-10-02' });
  assert.match(xml, /<link>https:\/\/a\.example\/the100\/<\/link>/);
});
