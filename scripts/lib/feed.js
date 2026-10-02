import { padNumber } from './game.js';
import { escapeHtml } from './html.js';
import { renderMarkdown, sortForDisplay } from './render.js';

// Characters that are not allowed in XML 1.0 are dropped, the rest is escaped.
function xmlText(value) {
  return escapeHtml(String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, ''));
}

export function normalizeSiteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`site.json "url" must be an https:// URL, got "${value}"`);
  }
  if (url.protocol !== 'https:') throw new Error(`site.json "url" must be an https:// URL, got "${value}"`);
  return url.href.endsWith('/') ? url.href : `${url.href}/`;
}

function rfc822(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).toUTCString();
}

function renderItem(game, siteUrl) {
  const link = `${siteUrl}#game-${padNumber(game.number)}`;
  const image = game.hasScreenshot
    ? `<p><img src="${escapeHtml(`${siteUrl}games/${game.folder}/screenshot.png`)}" alt="Screenshot von ${escapeHtml(game.title)}"></p>\n`
    : '';
  const categories = game.tags.map((tag) => `<category>${xmlText(tag)}</category>`).join('\n');
  return [
    '<item>',
    `<title>#${padNumber(game.number)} ${xmlText(game.title)}</title>`,
    `<link>${xmlText(link)}</link>`,
    `<guid isPermaLink="true">${xmlText(link)}</guid>`,
    `<pubDate>${rfc822(game.date)}</pubDate>`,
    categories,
    `<description>${xmlText(image + renderMarkdown(game.body))}</description>`,
    '</item>',
  ]
    .filter(Boolean)
    .join('\n');
}

export function renderFeed({ games, url, title, description, buildDate }) {
  const siteUrl = normalizeSiteUrl(url);
  const items = sortForDisplay(games).map((game) => renderItem(game, siteUrl));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${xmlText(title)}</title>`,
    `<link>${xmlText(siteUrl)}</link>`,
    `<description>${xmlText(description)}</description>`,
    '<language>de</language>',
    `<lastBuildDate>${rfc822(buildDate)}</lastBuildDate>`,
    `<atom:link href="${xmlText(`${siteUrl}feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}
