import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { GameError, assertUniqueNumbers, parseGame } from './game.js';

export async function loadGames(gamesDir) {
  let entries = [];
  try {
    entries = await readdir(gamesDir, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const games = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(gamesDir, entry.name);
    let source;
    try {
      source = await readFile(path.join(dir, 'index.md'), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') throw new GameError(entry.name, 'index.md is missing');
      throw error;
    }
    const game = parseGame(entry.name, source);
    game.hasScreenshot = existsSync(path.join(dir, 'screenshot.png'));
    games.push(game);
  }

  assertUniqueNumbers(games);
  return games.sort((a, b) => a.number - b.number);
}
