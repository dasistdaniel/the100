import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixHex, renderLogo } from './lib/logo.js';

// Writes the logo master files to logo/master/ from the palette in site/palette.json.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'logo', 'master');
const palette = JSON.parse(await readFile(path.join(root, 'site', 'palette.json'), 'utf8'));

const looks = {
  '': { fill: (t) => mixHex(palette.light.gradA, palette.light.gradB, t), ink: palette.light.text },
  '-dark': { fill: (t) => mixHex(palette.dark.gradA, palette.dark.gradB, t), ink: palette.dark.text },
  '-black': { fill: () => '#000000', ink: '#000000' },
  '-white': { fill: () => '#ffffff', ink: '#ffffff' },
};

await mkdir(outDir, { recursive: true });
for (const variant of ['mark', 'one', 'stacked', 'horizontal']) {
  for (const [suffix, look] of Object.entries(looks)) {
    const file = `the100-${variant}${suffix}.svg`;
    await writeFile(path.join(outDir, file), renderLogo({ variant, ...look, title: 'The 100' }));
    console.log(`wrote logo/master/${file}`);
  }
}
