import { TOTAL } from './game.js';

export function computeProgress(games) {
  const done = new Set(games.map((game) => game.number));
  return {
    count: games.length,
    total: TOTAL,
    percent: Math.round((games.length / TOTAL) * 100),
    cells: Array.from({ length: TOTAL }, (_, index) => ({ number: index + 1, done: done.has(index + 1) })),
  };
}
