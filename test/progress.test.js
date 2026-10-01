import test from 'node:test';
import assert from 'node:assert/strict';
import { computeProgress } from '../scripts/lib/progress.js';

test('empty list gives 0 of 100 with 100 open cells', () => {
  const progress = computeProgress([]);
  assert.equal(progress.count, 0);
  assert.equal(progress.total, 100);
  assert.equal(progress.percent, 0);
  assert.equal(progress.cells.length, 100);
  assert.ok(progress.cells.every((cell) => !cell.done));
});

test('marks the cells of finished games', () => {
  const progress = computeProgress([{ number: 1 }, { number: 42 }, { number: 100 }]);
  assert.equal(progress.count, 3);
  assert.equal(progress.percent, 3);
  assert.deepEqual(
    progress.cells.filter((cell) => cell.done).map((cell) => cell.number),
    [1, 42, 100],
  );
  assert.equal(progress.cells[0].number, 1);
  assert.equal(progress.cells[99].number, 100);
});

test('100 games is 100 percent', () => {
  const games = Array.from({ length: 100 }, (_, i) => ({ number: i + 1 }));
  assert.equal(computeProgress(games).percent, 100);
});
