import { Marked } from 'marked';
import { padNumber } from './game.js';
import { escapeHtml } from './html.js';
import { computeProgress } from './progress.js';

// Descriptions are the author's own text, but never trust it blindly: raw HTML is shown as text,
// only http(s)/mailto links are kept and images are reduced to their alt text.
const markdown = new Marked({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!/^(https?:\/\/|mailto:)/i.test(href)) return text;
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(href)}"${titleAttr}>${text}</a>`;
    },
    image({ text }) {
      return escapeHtml(text);
    },
  },
});

export function renderMarkdown(source) {
  return markdown.parse(source, { async: false });
}

export function sortForDisplay(games) {
  return [...games].sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
}

function formatDate(iso) {
  return iso.split('-').reverse().join('.');
}

export function renderTile(game) {
  const id = padNumber(game.number);
  const title = escapeHtml(game.title);

  const media = game.hasScreenshot
    ? `<img src="games/${escapeHtml(game.folder)}/screenshot.png" alt="Screenshot von ${title}" loading="lazy">`
    : `<span class="placeholder" aria-hidden="true">${game.emoji ? escapeHtml(game.emoji) : `#${id}`}</span>`;

  const tags = game.tags.length
    ? `<ul class="tags" aria-label="Tags">${game.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
    : '';

  const play = game.playUrl
    ? `<a class="btn btn-primary" href="${escapeHtml(game.playUrl)}">Spielen<span class="vh"> ${title}</span></a>`
    : '';
  const code = `<a class="btn" href="${escapeHtml(game.repo)}">Code<span class="vh"> von ${title} ansehen</span></a>`;

  return `<article class="tile" id="game-${id}">
  <div class="shot">${media}</div>
  <div class="tile-body">
    <h2><span class="num">#${id}</span> ${title}</h2>
    <p class="meta"><time datetime="${escapeHtml(game.date)}">${formatDate(game.date)}</time></p>
    ${tags}
    <div class="desc">${renderMarkdown(game.body)}</div>
    <p class="actions">${play}${code}</p>
  </div>
</article>`;
}

export function renderPage({ template, games, buildDate }) {
  const progress = computeProgress(games);
  const tiles = games.length
    ? sortForDisplay(games).map(renderTile).join('\n')
    : '<p class="empty">Noch kein Spiel fertig. Das erste kommt bald.</p>';

  const values = {
    count: progress.count,
    total: progress.total,
    percent: progress.percent,
    tiles,
    buildDate: escapeHtml(buildDate),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key) => {
    if (!(key in values)) throw new Error(`Unknown template placeholder ${placeholder}`);
    return values[key];
  });
}
