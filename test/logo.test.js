import test from 'node:test';
import assert from 'node:assert/strict';
import { mixHex, renderLogo, VARIANTS } from '../scripts/lib/logo.js';

const count = (svg, re) => (svg.match(re) ?? []).length;
const solid = () => '#000000';

test('mixHex interpolates between two colors', () => {
  assert.equal(mixHex('#000000', '#ffffff', 0), '#000000');
  assert.equal(mixHex('#000000', '#ffffff', 1), '#ffffff');
  assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
});

test('the mark spells 100 with 32 pixels in a 348x156 box', () => {
  const svg = renderLogo({ variant: 'mark', fill: solid, ink: '#000000', title: 'The 100' });
  assert.match(svg, /viewBox="0 0 348 156"/);
  assert.equal(count(svg, /<rect /g), 32);
  assert.match(svg, /<title>The 100<\/title>/);
});

test('the pixel one is a single 3x5 glyph with 8 pixels', () => {
  const svg = renderLogo({ variant: 'one', fill: solid, ink: '#000000', title: 'One' });
  assert.equal(count(svg, /<rect /g), 8);
});

test('stacked and horizontal lockups add the small THE (3 x 5 pixel letters)', () => {
  for (const variant of ['stacked', 'horizontal']) {
    const svg = renderLogo({ variant, fill: solid, ink: '#111111', title: 'The 100' });
    // THE = T(7) + H(11) + E(11) = 29 pixels on top of the 32 of the 100
    assert.equal(count(svg, /<rect /g), 61, variant);
    assert.match(svg, /fill="#111111"/);
  }
});

test('every pixel lies inside the viewBox for all variants', () => {
  for (const variant of VARIANTS) {
    const svg = renderLogo({ variant, fill: solid, ink: '#000000', title: 'x' });
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg).map(Number);
    for (const [, x, y, rw, rh] of svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
      assert.ok(Number(x) >= 0 && Number(y) >= 0, `${variant}: negative origin`);
      assert.ok(Number(x) + Number(rw) <= w + 0.001, `${variant}: pixel sticks out right`);
      assert.ok(Number(y) + Number(rh) <= h + 0.001, `${variant}: pixel sticks out bottom`);
    }
  }
});

test('the fill callback receives 0 at the first column and 1 at the last column of the 100', () => {
  const seen = [];
  renderLogo({ variant: 'mark', fill: (t) => { seen.push(t); return '#000000'; }, ink: '#000000', title: 'x' });
  assert.equal(Math.min(...seen), 0);
  assert.equal(Math.max(...seen), 1);
});

test('the title is escaped and unknown variants are rejected', () => {
  assert.match(renderLogo({ variant: 'mark', fill: solid, ink: '#000', title: 'A & <B>' }), /<title>A &amp; &lt;B&gt;<\/title>/);
  assert.throws(() => renderLogo({ variant: 'nope', fill: solid, ink: '#000', title: 'x' }), /variant/);
});

test('attrs are added to the svg tag', () => {
  const svg = renderLogo({ variant: 'mark', fill: solid, ink: '#000', title: 'x', attrs: 'aria-hidden="true" focusable="false"' });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 348 156" aria-hidden="true" focusable="false">/);
});
