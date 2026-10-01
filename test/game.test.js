import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGame, assertUniqueNumbers, padNumber, TOTAL } from '../scripts/lib/game.js';

const valid = `---
title: MojiBlast
date: 2026-03-14
repo: https://github.com/dasistdaniel/MojiBlast
---
Text.
`;

function withFields(fields) {
  return `---\n${fields}\n---\nBody\n`;
}

test('TOTAL is 100 and padNumber pads to 3 digits', () => {
  assert.equal(TOTAL, 100);
  assert.equal(padNumber(7), '007');
  assert.equal(padNumber(100), '100');
});

test('parses a minimal game', () => {
  assert.deepEqual(parseGame('001-mojiblast', valid), {
    number: 1,
    slug: 'mojiblast',
    folder: '001-mojiblast',
    title: 'MojiBlast',
    date: '2026-03-14',
    repo: 'https://github.com/dasistdaniel/MojiBlast',
    playUrl: null,
    tags: [],
    emoji: null,
    body: 'Text.',
  });
});

test('parses optional fields', () => {
  const game = parseGame(
    '042-story-moji',
    withFields(
      'title: StoryMoji\ndate: 2026-04-01\nrepo: https://github.com/a/b\nplay_url: https://example.com/play\ntags: [emoji, story]\nemoji: 📖',
    ),
  );
  assert.equal(game.number, 42);
  assert.equal(game.slug, 'story-moji');
  assert.equal(game.playUrl, 'https://example.com/play');
  assert.deepEqual(game.tags, ['emoji', 'story']);
  assert.equal(game.emoji, '📖');
});

test('accepts quoted and unquoted dates the same way', () => {
  const a = parseGame('001-a', withFields('title: A\ndate: 2026-03-14\nrepo: https://x.test/a'));
  const b = parseGame('001-a', withFields('title: A\ndate: "2026-03-14"\nrepo: https://x.test/a'));
  assert.equal(a.date, '2026-03-14');
  assert.equal(b.date, '2026-03-14');
});

test('rejects impossible dates instead of shifting them', () => {
  assert.throws(
    () => parseGame('001-a', withFields('title: A\ndate: 2026-02-30\nrepo: https://x.test/a')),
    /games\/001-a: "date"/,
  );
  assert.throws(
    () => parseGame('001-a', withFields('title: A\ndate: yesterday\nrepo: https://x.test/a')),
    /"date"/,
  );
});

test('handles Windows line endings', () => {
  const crlf = valid.replace(/\n/g, '\r\n');
  const game = parseGame('001-mojiblast', crlf);
  assert.equal(game.title, 'MojiBlast');
  assert.equal(game.body, 'Text.');
});

test('reports each missing required field', () => {
  for (const field of ['title', 'date', 'repo']) {
    const fields = { title: 'A', date: '2026-03-14', repo: 'https://x.test/a' };
    delete fields[field];
    const text = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
    assert.throws(() => parseGame('001-a', withFields(text)), new RegExp(`"${field}"`));
  }
});

test('reports a file without front matter', () => {
  assert.throws(() => parseGame('001-a', 'Just text'), /"title"/);
});

test('rejects bad folder names and numbers out of range', () => {
  for (const name of ['1-a', '001_a', '001-A', '001-', '001', '000-a', '101-a', 'abc']) {
    assert.throws(() => parseGame(name, valid), /folder (name|number)/, name);
  }
});

test('rejects non-https and script URLs', () => {
  const base = 'title: A\ndate: 2026-03-14\n';
  assert.throws(() => parseGame('001-a', withFields(`${base}repo: http://x.test/a`)), /"repo"/);
  assert.throws(
    () => parseGame('001-a', withFields(`${base}repo: https://x.test/a\nplay_url: "javascript:alert(1)"`)),
    /"play_url"/,
  );
  assert.throws(
    () => parseGame('001-a', withFields(`${base}repo: https://x.test/a\nplay_url: not a url`)),
    /"play_url"/,
  );
});

test('rejects wrong types for title and tags', () => {
  assert.throws(
    () => parseGame('001-a', withFields('title: 2048\ndate: 2026-03-14\nrepo: https://x.test/a')),
    /"title"/,
  );
  assert.throws(
    () => parseGame('001-a', withFields('title: A\ndate: 2026-03-14\nrepo: https://x.test/a\ntags: emoji')),
    /"tags"/,
  );
});

test('assertUniqueNumbers rejects duplicates and names both folders', () => {
  assert.doesNotThrow(() => assertUniqueNumbers([{ number: 1, folder: '001-a' }, { number: 2, folder: '002-b' }]));
  assert.throws(
    () => assertUniqueNumbers([{ number: 7, folder: '007-a' }, { number: 7, folder: '007-b' }]),
    /007-a.*007-b/,
  );
});
