import matter from 'gray-matter';
import yaml from 'js-yaml';

export const TOTAL = 100;

const FOLDER_PATTERN = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

// JSON_SCHEMA keeps `date: 2026-03-14` a plain string, so impossible dates are not silently rolled over.
const MATTER_OPTIONS = {
  engines: { yaml: (source) => yaml.load(source, { schema: yaml.JSON_SCHEMA }) ?? {} },
};

export class GameError extends Error {
  constructor(folder, message) {
    super(`games/${folder}: ${message}`);
    this.name = 'GameError';
  }
}

export function padNumber(number) {
  return String(number).padStart(3, '0');
}

function requireText(folder, field, value) {
  if (value === undefined || value === null || value === '') {
    throw new GameError(folder, `"${field}" is required`);
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GameError(folder, `"${field}" must be text (put quotes around it if it looks like a number)`);
  }
  return value.trim();
}

function requireHttpsUrl(folder, field, value) {
  const text = requireText(folder, field, value);
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new GameError(folder, `"${field}" must be an https:// URL, got "${text}"`);
  }
  if (url.protocol !== 'https:') {
    throw new GameError(folder, `"${field}" must be an https:// URL, got "${text}"`);
  }
  return text;
}

function requireIsoDate(folder, value) {
  const text = requireText(folder, 'date', value);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && new Date(`${text}T00:00:00Z`).toISOString().slice(0, 10) === text;
  if (!valid) {
    throw new GameError(folder, `"date" must be a real date like 2026-03-14, got "${text}"`);
  }
  return text;
}

export function parseGame(folder, source) {
  const match = FOLDER_PATTERN.exec(folder);
  if (!match) {
    throw new GameError(folder, 'folder name must look like 001-my-game (3 digits, dash, lowercase slug)');
  }
  const number = Number(match[1]);
  if (number < 1 || number > TOTAL) {
    throw new GameError(folder, `folder number must be between 001 and ${padNumber(TOTAL)}`);
  }

  let parsed;
  try {
    parsed = matter(source.replace(/\r\n?/g, '\n'), MATTER_OPTIONS);
  } catch (error) {
    throw new GameError(folder, `front matter is not valid YAML (${error.reason ?? error.message})`);
  }
  const data = parsed.data ?? {};

  const title = requireText(folder, 'title', data.title);
  const date = requireIsoDate(folder, data.date);
  const repo = requireHttpsUrl(folder, 'repo', data.repo);
  const playUrl = data.play_url === undefined ? null : requireHttpsUrl(folder, 'play_url', data.play_url);

  let tags = [];
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== 'string')) {
      throw new GameError(folder, '"tags" must be a list of text, like [emoji, arcade]');
    }
    tags = data.tags.map((tag) => tag.trim()).filter(Boolean);
  }

  const emoji = data.emoji === undefined ? null : requireText(folder, 'emoji', data.emoji);

  return { number, slug: match[2], folder, title, date, repo, playUrl, tags, emoji, body: parsed.content.trim() };
}

export function assertUniqueNumbers(games) {
  const seen = new Map();
  for (const game of games) {
    if (seen.has(game.number)) {
      throw new Error(`Duplicate game number ${padNumber(game.number)}: games/${seen.get(game.number)} and games/${game.folder}`);
    }
    seen.set(game.number, game.folder);
  }
}
