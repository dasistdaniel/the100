import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastRatio, luminance, checkPalette } from '../scripts/lib/contrast.js';

test('black on white is 21:1 and identical colors are 1:1', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
  assert.equal(contrastRatio('#336699', '#336699'), 1);
  assert.equal(luminance('#ffffff'), 1);
});

test('rejects colors that are not #rrggbb', () => {
  assert.throws(() => luminance('red'), /#rrggbb/);
  assert.throws(() => luminance('#fff'), /#rrggbb/);
});

test('checkPalette reports failing pairs per theme', () => {
  const palette = JSON.parse(JSON.stringify({
    light: { bg: '#ffffff', surface: '#ffffff', text: '#ffffff', muted: '#000000', accent: '#000000', onAccent: '#ffffff', border: '#000000', tagBg: '#ffffff', tagText: '#000000', track: '#ffffff', focus: '#000000' },
    dark: { bg: '#000000', surface: '#000000', text: '#ffffff', muted: '#ffffff', accent: '#ffffff', onAccent: '#000000', border: '#ffffff', tagBg: '#000000', tagText: '#ffffff', track: '#000000', focus: '#ffffff' },
  }));
  const failures = checkPalette(palette);
  assert.ok(failures.some((f) => f.theme === 'light' && f.fg === 'text' && f.bg === 'bg'));
  assert.ok(failures.every((f) => f.theme === 'light'));
});

test('checkPalette reports a missing color', () => {
  const palette = JSON.parse(JSON.stringify({ light: {}, dark: {} }));
  const failures = checkPalette(palette);
  assert.ok(failures.length > 0);
  assert.ok(failures.every((f) => f.ratio === null));
});

test('the shipped palette meets WCAG AA in both themes', async () => {
  const palette = JSON.parse(await readFile(new URL('../site/palette.json', import.meta.url), 'utf8'));
  assert.deepEqual(checkPalette(palette), []);
});
