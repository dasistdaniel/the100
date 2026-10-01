import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkPalette } from './lib/contrast.js';
import { loadGames } from './lib/load-games.js';
import { renderPage } from './lib/render.js';
import { paletteToCss } from './lib/theme.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function copyScreenshot(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    const { default: sharp } = await import('sharp');
    await sharp(source).resize({ width: 800, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(destination);
  } catch (error) {
    console.warn(`Could not optimise ${source} (${error.message}); copying it unchanged.`);
    await copyFile(source, destination);
  }
}

function describeFailures(failures) {
  const lines = failures.map(({ theme, fg, bg, ratio, min }) =>
    ratio === null
      ? `  ${theme}: color "${fg}" or "${bg}" is missing`
      : `  ${theme}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`,
  );
  return `Palette fails the WCAG contrast check:\n${lines.join('\n')}`;
}

export async function build({
  siteDir = path.join(root, 'site'),
  gamesDir = path.join(root, 'games'),
  distDir = path.join(root, 'dist'),
  buildDate = new Date().toISOString().slice(0, 10),
} = {}) {
  const palette = JSON.parse(await readFile(path.join(siteDir, 'palette.json'), 'utf8'));
  const failures = checkPalette(palette);
  if (failures.length) throw new Error(describeFailures(failures));

  const games = await loadGames(gamesDir);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const template = await readFile(path.join(siteDir, 'template.html'), 'utf8');
  await writeFile(path.join(distDir, 'index.html'), renderPage({ template, games, buildDate }));

  const css = await readFile(path.join(siteDir, 'style.css'), 'utf8');
  await writeFile(path.join(distDir, 'style.css'), `${paletteToCss(palette)}\n${css}`);
  await copyFile(path.join(siteDir, 'app.js'), path.join(distDir, 'app.js'));
  await cp(path.join(siteDir, 'icons'), distDir, { recursive: true });

  for (const game of games.filter((g) => g.hasScreenshot)) {
    await copyScreenshot(
      path.join(gamesDir, game.folder, 'screenshot.png'),
      path.join(distDir, 'games', game.folder, 'screenshot.png'),
    );
  }

  return { count: games.length, distDir };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build()
    .then(({ count, distDir }) => console.log(`Built ${count} / 100 games into ${distDir}`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
