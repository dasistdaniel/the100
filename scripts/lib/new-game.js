import { TOTAL, padNumber } from './game.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return SLUG_PATTERN.test(slug);
}

export function nextNumber(folderNames) {
  const numbers = folderNames
    .map((name) => /^(\d{3})-/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  if (next > TOTAL) throw new Error(`All ${TOTAL} games exist already (next would be ${padNumber(next)}).`);
  return next;
}

export function gameTemplate({ title, repo, date }) {
  return `---
title: ${JSON.stringify(title)}
date: ${date}
repo: ${repo}
# play_url: https://dasistdaniel.github.io/REPO/
tags: []
# emoji: 🎮
---
Kurze Beschreibung: Was ist das für ein Spiel, was war knifflig, was hast du gelernt?
`;
}
