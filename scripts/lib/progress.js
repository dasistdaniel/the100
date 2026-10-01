import { TOTAL } from './game.js';

export function computeProgress(games) {
  const done = new Set(games.map((game) => game.number));
  return {
    count: games.length,
    total: TOTAL,
    percent: Math.round((games.length / TOTAL) * 100),
  };
}
