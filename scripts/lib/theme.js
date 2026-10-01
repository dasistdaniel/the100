function variables(colors) {
  return Object.entries(colors)
    .map(([name, value]) => `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`)
    .join(';');
}

export function paletteToCss(palette) {
  const light = variables(palette.light);
  const dark = variables(palette.dark);
  return [
    `:root{color-scheme:light;${light}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;${dark}}}`,
    `:root[data-theme="dark"]{color-scheme:dark;${dark}}`,
  ].join('\n');
}
