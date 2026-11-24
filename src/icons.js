const paths = {
  map: '<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zM9 3v15m6-12v15"/>',
  flag: '<path d="M5 21V4c5-5 9 5 15 0v10c-6 5-10-5-15 0"/>',
  paper:
    '<path d="M3 5h15v15H5a2 2 0 0 1-2-2zM18 8h3v10a2 2 0 0 1-2 2M6 9h8M6 13h3m3 0h3m-9 3h9"/>',
  chart: '<path d="M3 3v17h18M7 16v-4m5 4V8m5 8V5"/>',
  settings:
    '<path d="M3 6h9m5 0h4M3 12h3m5 0h10M3 18h11m5 0h2"/><circle cx="14" cy="6" r="2.1"/><circle cx="8" cy="12" r="2.1"/><circle cx="16" cy="18" r="2.1"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  sound:
    '<path d="m3 9 4 0 5-5v16l-5-5H3zm13-2c3 3 3 7 0 10m3-13c5 5 5 11 0 16"/>',
  mute: '<path d="m3 9 4 0 5-5v16l-5-5H3zm13 0 6 6m0-6-6 6"/>',
  layers: '<path d="m2 8 10-5 10 5-10 5zm0 5 10 5 10-5M3 18l9 4 9-4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  book: '<path d="M12 6c-3-3-7-3-10-2v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2zm0 0v15"/>',
  close: '<path d="m6 6 12 12m0-12L6 18"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2zm14-15a3 3 0 0 1 0 6m2 3c3 1 4 3 4 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  shop: '<path d="M3 9 5 3h14l2 6v3c-2 2-4 1-5-1-2 2-4 2-5 0-2 2-5 2-6 0l-2 1zM5 13v7h14v-7M9 20v-6h5v6"/>',
  cursor: '<path d="m4 3 6 17 3-7 7-3z"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 8M3 3v7h7"/>',
  star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  move: '<path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 1-1 3m0 2h.01"/>',
  tea: '<path d="m6 7 2 14h8l2-14zM4 7h16m-7 0 2-5h4"/>',
  bolt: '<path d="M13 2 5 14h6l-1 8 9-13h-7z"/>',
  flower:
    '<path d="M12 9c-7-11-12 2-4 4-9 5 4 12 5 4 5 9 13-4 4-5 10-6-3-13-5-3z"/>',
  leaf: '<path d="M3 18C2 8 11 4 21 3c0 10-6 18-15 15zm2 2 11-11"/>',
  game: '<path d="M6 7h12c4 0 6 13 2 13l-5-4H9l-5 4C0 20 2 7 6 7zM7 9v5m-2-2h5m5 0h1m2-2h1"/>',
  next: '<path d="m3 5 8 7-8 7zm9 0 8 7-8 7zm9 0v14"/>',
  bag: '<path d="M4 8h16l-1 13H5zM8 9V6a4 4 0 0 1 8 0v3"/>',
  trophy:
    '<path d="M7 3h10v6a5 5 0 0 1-10 0zm10 2h4v2q0 6-5 6M7 5H3v2q0 6 5 6m4 1v5m-5 2h10"/>',
};
export function icon(name, size = 20) {
  return (
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="' +
    size +
    '" height="' +
    size +
    '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    (paths[name] || paths.star) +
    "</svg>"
  );
}
