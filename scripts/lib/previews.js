const MAX_BYTES = 10 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// npm run previews -- [game ...] [--force] [--include-generated] [--dry-run]
export function parsePreviewArgs(args) {
  const options = { force: false, includeGenerated: false, dryRun: false, only: [] };
  for (const arg of args) {
    if (arg === '--force') options.force = true;
    else if (arg === '--include-generated') options.includeGenerated = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('-')) {
      throw new Error(`Unknown option "${arg}". Usage: npm run previews -- [game ...] [--force] [--include-generated] [--dry-run]`);
    } else options.only.push(arg);
  }
  return options;
}

export function githubRepoOf(url) {
  const match = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(url);
  return match ? `${match[1]}/${match[2]}` : null;
}

export function matchesFilter(game, filters) {
  if (!filters.length) return true;
  return filters.some((filter) => {
    const text = filter.toLowerCase();
    if (/^\d+$/.test(text)) return Number(text) === game.number;
    return text === game.slug || text === game.folder;
  });
}

// 'download' | 'skip-exists' | 'skip-generated'
// A screenshot is only replaced with --force, and GitHub's generated card (repo name, stars) is only
// used with --include-generated, because it does not show the game.
export function decideAction({ hasScreenshot, usesCustom, force, includeGenerated }) {
  if (hasScreenshot && !force) return 'skip-exists';
  if (!usesCustom && !includeGenerated) return 'skip-generated';
  return 'download';
}

export function pngSize(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function detectImageType(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

export async function downloadImage(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error(`Image at ${url} is larger than ${MAX_BYTES / 1024 / 1024} MB`);
  if (!detectImageType(bytes)) throw new Error(`${url} is not an image`);
  return bytes;
}

// The site expects screenshot.png, so JPEG or WebP previews are converted.
export async function toPng(bytes) {
  if (detectImageType(bytes) === 'png') return bytes;
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    throw new Error('The preview is not a PNG and the optional package "sharp" is not installed to convert it (npm install).');
  }
  return sharp(bytes).png({ compressionLevel: 9 }).toBuffer();
}
