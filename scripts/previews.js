import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGames } from './lib/load-games.js';
import {
  decideAction,
  downloadImage,
  githubRepoOf,
  matchesFilter,
  parsePreviewArgs,
  pngSize,
  toPng,
} from './lib/previews.js';

// Downloads the GitHub social preview of each game repo as games/<folder>/screenshot.png.
// Needs the GitHub CLI (gh) to ask GitHub whether a custom preview exists.
const gamesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'games');

let options;
try {
  options = parsePreviewArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function queryPreview(repo) {
  try {
    const output = execFileSync('gh', ['repo', 'view', repo, '--json', 'usesCustomOpenGraphImage,openGraphImageUrl'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(output);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('The GitHub CLI "gh" was not found. Install it and run "gh auth login".');
    throw new Error(`gh could not read ${repo}: ${String(error.stderr ?? error.message).trim()}`);
  }
}

const games = (await loadGames(gamesDir)).filter((game) => matchesFilter(game, options.only));
if (options.only.length && !games.length) {
  console.error(`No game matches: ${options.only.join(', ')}`);
  process.exit(1);
}

const counts = { downloaded: 0, skipped: 0, failed: 0 };
for (const game of games) {
  const label = `${String(game.number).padStart(3, '0')} ${game.slug}`;
  const report = (text) => console.log(`${label.padEnd(26)} ${text}`);
  try {
    if (game.hasScreenshot && !options.force) {
      counts.skipped += 1;
      report('skipped: screenshot.png exists (use --force to replace it)');
      continue;
    }
    const repo = githubRepoOf(game.repo);
    if (!repo) {
      counts.skipped += 1;
      report('skipped: not a GitHub repo');
      continue;
    }

    const preview = queryPreview(repo);
    const action = decideAction({
      hasScreenshot: game.hasScreenshot,
      usesCustom: preview.usesCustomOpenGraphImage,
      force: options.force,
      includeGenerated: options.includeGenerated,
    });
    if (action === 'skip-generated') {
      counts.skipped += 1;
      report('skipped: no custom social preview on GitHub yet (only the generated card)');
      continue;
    }
    if (options.dryRun) {
      counts.skipped += 1;
      report(`would download ${preview.openGraphImageUrl}`);
      continue;
    }

    const png = await toPng(await downloadImage(preview.openGraphImageUrl));
    await writeFile(path.join(gamesDir, game.folder, 'screenshot.png'), png);
    counts.downloaded += 1;
    const size = pngSize(png);
    const sizeText = size ? `${size.width}x${size.height}` : 'unknown size';
    report(`downloaded ${sizeText}`);
    if (size && Math.abs(size.width / size.height - 2) > 0.02) {
      console.log(`${' '.repeat(27)}warning: not 2:1 (1280x640 recommended), the tile will crop it`);
    }
  } catch (error) {
    counts.failed += 1;
    report(`FAILED: ${error.message}`);
  }
}

console.log(`\n${counts.downloaded} downloaded, ${counts.skipped} skipped, ${counts.failed} failed${options.dryRun ? ' (dry run)' : ''}.`);
if (counts.failed) process.exit(1);
