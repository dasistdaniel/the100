import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { padNumber } from './lib/game.js';
import { gameTemplate, isValidSlug, nextNumber } from './lib/new-game.js';

const gamesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'games');
const [slug, title, repoName] = process.argv.slice(2);

if (!slug || !title || !isValidSlug(slug)) {
  console.error('Usage: npm run new -- <slug> "<Title>" [repoName]');
  console.error('  slug: lowercase letters, digits and dashes, e.g. mojiblast or story-moji');
  process.exit(1);
}

try {
  await mkdir(gamesDir, { recursive: true });
  const entries = await readdir(gamesDir, { withFileTypes: true });
  const number = nextNumber(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
  const folder = `${padNumber(number)}-${slug}`;
  const dir = path.join(gamesDir, folder);
  await mkdir(dir);

  const today = new Date().toISOString().slice(0, 10);
  const repo = `https://github.com/dasistdaniel/${repoName ?? title}`;
  await writeFile(path.join(dir, 'index.md'), gameTemplate({ title, repo, date: today }));
  console.log(`Created games/${folder}/index.md`);
  console.log('Next: fill in the text, add screenshot.png next to it, then run "npm run dev".');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
