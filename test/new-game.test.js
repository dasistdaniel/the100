import test from 'node:test';
import assert from 'node:assert/strict';
import { gameTemplate, isValidSlug, nextNumber } from '../scripts/lib/new-game.js';
import { parseGame } from '../scripts/lib/game.js';

test('nextNumber starts at 1 and continues after the highest number', () => {
  assert.equal(nextNumber([]), 1);
  assert.equal(nextNumber(['001-a', '002-b']), 3);
  assert.equal(nextNumber(['005-x', '002-b']), 6);
  assert.equal(nextNumber(['001-a', 'README.md', '.DS_Store', 'notes']), 2);
});

test('nextNumber refuses to go past 100', () => {
  assert.equal(nextNumber(['099-a']), 100);
  assert.throws(() => nextNumber(['100-a']), /100/);
});

test('isValidSlug accepts lowercase words with dashes only', () => {
  for (const ok of ['mojiblast', 'story-moji', 'game2']) assert.equal(isValidSlug(ok), true, ok);
  for (const bad of ['', 'Moji', 'moji blast', '-a', 'a-', 'a--b', 'ä']) assert.equal(isValidSlug(bad), false, bad);
});

test('the generated template is a valid game file', () => {
  const source = gameTemplate({ title: 'My Game', repo: 'https://github.com/dasistdaniel/My-Game', date: '2026-10-01' });
  const game = parseGame('003-my-game', source);
  assert.equal(game.title, 'My Game');
  assert.equal(game.date, '2026-10-01');
  assert.equal(game.repo, 'https://github.com/dasistdaniel/My-Game');
  assert.equal(game.playUrl, null);
});

test('titles with colons or quotes still produce a valid file', () => {
  const source = gameTemplate({ title: 'Pong: "Reloaded"', repo: 'https://github.com/dasistdaniel/pong', date: '2026-10-01' });
  assert.equal(parseGame('004-pong', source).title, 'Pong: "Reloaded"');
});
