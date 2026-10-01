import test from 'node:test';
import assert from 'node:assert/strict';
import { computeProgress } from '../scripts/lib/progress.js';

test('empty list gives 0 of 100', () => {
  const progress = computeProgress([]);
  assert.equal(progress.count, 0);
  assert.equal(progress.total, 100);
  assert.equal(progress.percent, 0);
});

test('counts finished games and rounds the percent', () => {
  const progress = computeProgress([{ number: 1 }, { number: 42 }, { number: 100 }]);
  assert.equal(progress.count, 3);
  assert.equal(progress.percent, 3);
});

test('100 games is 100 percent', () => {
  const games = Array.from({ length: 100 }, (_, i) => ({ number: i + 1 }));
  assert.equal(computeProgress(games).percent, 100);
});
