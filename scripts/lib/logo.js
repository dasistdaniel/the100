import { escapeHtml } from './html.js';

// The logo is the number 100 set in a 3x5 pixel font. One source drives the inline logo on the
// site and the master files in logo/ (see scripts/logo.js).
const GLYPHS = {
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  E: ['###', '#..', '###', '#..', '###'],
};

export const VARIANTS = ['mark', 'one', 'stacked', 'horizontal'];

const BIG = { pitch: 32, size: 28, radius: 6 };
const SMALL = { pitch: 16, size: 14, radius: 3 };

// Cells of a word: one empty column between letters.
function cellsOf(word) {
  const cells = [];
  let column = 0;
  for (const letter of word) {
    GLYPHS[letter].forEach((row, y) => {
      [...row].forEach((mark, x) => {
        if (mark === '#') cells.push({ column: column + x, row: y });
      });
    });
    column += 4;
  }
  return { cells, columns: column - 1 };
}

function extent(word, { pitch, size }) {
  const { columns } = cellsOf(word);
  return { width: columns * pitch - (pitch - size), height: 5 * pitch - (pitch - size) };
}

function pixels(word, { pitch, size, radius }, offsetX, offsetY, colorOf) {
  const { cells, columns } = cellsOf(word);
  return cells
    .map(({ column, row }) => {
      const t = columns > 1 ? column / (columns - 1) : 0;
      return `<rect x="${offsetX + column * pitch}" y="${offsetY + row * pitch}" width="${size}" height="${size}" rx="${radius}" fill="${colorOf(t)}"/>`;
    })
    .join('');
}

export function mixHex(from, to, t) {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const channel = (shift) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}

// fill(t): color of a pixel of the number, t runs from 0 (left) to 1 (right). ink: color of the small "THE".
export function renderLogo({ variant, fill, ink, title, attrs = '' }) {
  if (!VARIANTS.includes(variant)) throw new Error(`Unknown logo variant "${variant}" (use ${VARIANTS.join(', ')})`);

  const number = variant === 'one' ? '1' : '100';
  const big = extent(number, BIG);
  const small = extent('THE', SMALL);
  const inkOf = () => ink;
  let width = big.width;
  let height = big.height;
  let body;

  if (variant === 'stacked') {
    const gap = 32;
    height = small.height + gap + big.height;
    body = pixels('THE', SMALL, 0, 0, inkOf) + pixels(number, BIG, 0, small.height + gap, fill);
  } else if (variant === 'horizontal') {
    const gap = 40;
    width = small.width + gap + big.width;
    body = pixels('THE', SMALL, 0, big.height - small.height, inkOf) + pixels(number, BIG, small.width + gap, 0, fill);
  } else {
    body = pixels(number, BIG, 0, 0, fill);
  }

  const extra = attrs ? ` ${attrs}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"${extra}><title>${escapeHtml(title)}</title>${body}</svg>\n`;
}
