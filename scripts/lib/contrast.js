function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Invalid color "${hex}" (use #rrggbb)`);
  const n = parseInt(match[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// [foreground, background, minimum ratio]: 4.5 for text, 3 for UI components (WCAG AA).
export const REQUIRED_PAIRS = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['onAccent', 'accent', 4.5],
  ['tagText', 'tagBg', 4.5],
  ['border', 'bg', 3],
  ['border', 'surface', 3],
  ['focus', 'bg', 3],
  ['focus', 'surface', 3],
  ['accent', 'track', 3],
  // The page gradient sits directly behind the header, progress text and footer.
  ...['bgFrom', 'bgMid', 'bgTo'].flatMap((stop) => [
    ['text', stop, 4.5],
    ['muted', stop, 4.5],
    ['gradA', stop, 3],
    ['gradB', stop, 3],
  ]),
  ['gradA', 'track', 3],
  ['gradB', 'track', 3],
];

export function checkPalette(palette) {
  const failures = [];
  for (const theme of ['light', 'dark']) {
    const colors = palette[theme] ?? {};
    for (const [fg, bg, min] of REQUIRED_PAIRS) {
      if (!colors[fg] || !colors[bg]) {
        failures.push({ theme, fg, bg, ratio: null, min });
        continue;
      }
      const ratio = contrastRatio(colors[fg], colors[bg]);
      if (ratio < min) failures.push({ theme, fg, bg, ratio, min });
    }
  }
  return failures;
}
