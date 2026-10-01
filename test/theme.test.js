import test from 'node:test';
import assert from 'node:assert/strict';
import { paletteToCss } from '../scripts/lib/theme.js';

const palette = {
  light: { bg: '#ffffff', onAccent: '#ffffff' },
  dark: { bg: '#000000', onAccent: '#111111' },
};

test('light values are the default on :root', () => {
  const css = paletteToCss(palette);
  assert.match(css, /:root\{color-scheme:light;--bg:#ffffff;--on-accent:#ffffff\}/);
});

test('dark values apply for the system preference unless light is forced, and when dark is forced', () => {
  const css = paletteToCss(palette);
  assert.match(
    css,
    /@media \(prefers-color-scheme: dark\)\{:root:not\(\[data-theme="light"\]\)\{color-scheme:dark;--bg:#000000;--on-accent:#111111\}\}/,
  );
  assert.match(css, /:root\[data-theme="dark"\]\{color-scheme:dark;--bg:#000000;--on-accent:#111111\}/);
});
