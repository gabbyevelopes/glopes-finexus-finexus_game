// Generates The Ledges pixel art:
//   ledges_near.png   - the street wall Finn walks right alongside (shops, apartments, lot, alley)
//   ledges_mid.png    - a hazier row of buildings behind it
//   ledges_ground.png - sidewalk and street
//   streetlamp.png    - one streetlamp (placed several times by the game)
// Run with:  node tools/generate_ledges_art.mjs
// Images are drawn at 1 art pixel = 1 image pixel; the game scales them up 4x
// (crisp, because pixelArt is on) to match Finn's chunky pixels.
import { Img } from './pixel-image.mjs';

/** Change for a different street layout. */
const SEED = 11;

/**
 * Where the Vaulton billboard stands, in art pixels (world x / 4). An empty fenced lot
 * is kept here so the billboard isn't stuck in front of a building.
 */
const BILLBOARD_LOT = { start: 452, end: 548 };

// ---------------------------------------------------------------- palette
// Mid-tone indigo/lavender to match the skyline. Bright teal, yellow and green are left
// out on purpose: those belong to the billboard, the coin and Finn.
const C = {
  outline: '#2a2648',
  deep: '#26223f',
  // near wall
  winDark: '#2f2b55',
  winLitA: '#b9b0ee', // pale lavender
  winLitB: '#e3b3dc', // pale pink
  glass: '#2f2b55',
  glassShine: '#4a4580',
  frame: '#3a3566',
  door: '#3d3870',
  sill: '#8d88c0',
  ply: '#8c7b86', // plywood
  plyDark: '#6f6070',
  ac: '#a6a2c8',
  acDark: '#6f6aa0',
  stain: '#4f4a84',
  poster: '#b8b2d8',
  posterInk: '#6f6aa0',
  crack: '#3a3566',
  shutterA: '#5f5a8f',
  shutterB: '#504b80',
  awning: [
    ['#8a4f7d', '#b87aa8'],
    ['#5a5a9c', '#8d88c0'],
    ['#8a5a6a', '#b88a96'],
  ],
  sign: ['#8a4f7d', '#5a4f8f', '#7a5068', '#4f5f8f'],
  neon: '#e08ac8',
  neonDim: '#b05aa0',
  washer: '#a9a3d6',
  crate: '#7a5a6a',
  fruit: ['#c25b6b', '#d9825a', '#b05aa0'],
  pawnBall: '#c9c3e6',
  fence: '#8a85b8',
  fencePost: '#4d4880',
  dirt: '#4d4880',
  weed: '#6a7090',
  bag: '#2f2b4a',
  bagHi: '#4f4a74',
  dumpster: '#46507a',
  dumpsterHi: '#5c6894',
  // mid row (hazier, further away)
  midWalls: ['#5c5794', '#625d99', '#57528c', '#66619c'],
  midShade: '#4d4880',
  midEdge: '#736eab',
  midOutline: '#3a3566',
  midWinDark: '#433e78',
  midWinLit: ['#8e88cc', '#a597d6'],
  // ground
  curbTop: '#7d78ad',
  sidewalk: '#5d5890',
  sidewalkHi: '#6a6598',
  joint: '#4d4880',
  curbEdge: '#2f2b55',
  street: '#3d3966',
  laneDash: '#6a6598',
  puddle: '#4a4575',
  puddleHi: '#7d78ad',
  // lamp
  pole: '#2a2648',
  poleHi: '#4a4575',
  bulb: '#ffe7a8',
  bulbRim: '#c9a86b',
};

/** Wall colors for near buildings: base, mortar (brick lines), shade, highlight. */
const WALLS = [
  { base: '#6a65a3', mortar: '#625d99', shade: '#57528c', hi: '#7d78b5' }, // lavender
  { base: '#77709e', mortar: '#6d6694', shade: '#615a86', hi: '#8a83b0' }, // dusty mauve
  { base: '#5f6a9e', mortar: '#576194', shade: '#4f5886', hi: '#737db0' }, // slate blue
  { base: '#7a6a9a', mortar: '#706090', shade: '#625584', hi: '#8c7dab' }, // faded plum
];

// Seeded random, so the art comes out the same every run.
let state = SEED;
const rand = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const chance = (p) => rand() < p;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ================================================================ NEAR WALL
// 2400 x 480 screen px = 600 x 120 art px. Bottom row sits on the sidewalk.
// Finn is ~37 art px tall, so doors (44 px) are a little taller than him.
const NEAR_W = 600;
const NEAR_H = 120;
const STOREY = 52; // ground floor height

function brickWall(img, x, top, w, h, wall) {
  img.rect(x, top, w, h, wall.base);
  for (let y = top + 3; y < top + h; y += 4) {
    img.rect(x, y, w, 1, wall.mortar);
    const offset = ((y - top) / 4) % 2 ? 4 : 0;
    for (let bx = x + offset; bx < x + w; bx += 8) img.rect(bx, y - 3, 1, 3, wall.mortar);
  }
}

function cornice(img, x, top, w, wall) {
  img.rect(x, top, w, 1, C.outline);
  img.rect(x, top + 1, w, 2, wall.hi);
  img.rect(x, top + 3, w, 1, wall.shade);
}

function sideEdges(img, x, top, w, h, wall) {
  img.rect(x, top, 1, h, C.outline);
  img.rect(x + w - 1, top, 1, h, C.outline);
  img.rect(x + w - 3, top + 1, 2, h - 1, wall.shade);
}

function boardedPatch(img, x, y, w, h) {
  img.rect(x, y, w, h, C.ply);
  for (let i = 0; i < w; i += 3) img.rect(x + i, y, 1, h, C.plyDark);
  img.set(x + 1, y + 1, C.outline);
  img.set(x + w - 2, y + 1, C.outline);
  img.set(x + 1, y + h - 2, C.outline);
  img.set(x + w - 2, y + h - 2, C.outline);
}

function upperWindows(img, x, w, top, bottom, { fireEscape = false } = {}) {
  for (let wy = top + 8; wy + 10 <= bottom - 4; wy += 18) {
    for (let wx = x + 6; wx + 7 <= x + w - 6; wx += 13) {
      const roll = rand();
      if (roll < 0.12) {
        boardedPatch(img, wx, wy, 7, 10);
      } else if (roll < 0.2) {
        img.rect(wx, wy, 7, 10, C.winDark);
        img.set(wx + 2, wy + 1, C.sill); // broken glass shards
        img.set(wx + 3, wy + 2, C.sill);
        img.set(wx + 5, wy + 1, C.sill);
      } else if (roll < 0.42) {
        img.rect(wx, wy, 7, 10, chance(0.6) ? C.winLitA : C.winLitB);
        img.rect(wx, wy, 7, 3, C.frame); // half-drawn blind
      } else {
        img.rect(wx, wy, 7, 10, C.winDark);
        img.set(wx + 1, wy + 1, C.glassShine);
      }
      img.rect(wx - 1, wy + 10, 9, 1, C.sill);
      img.rect(wx, wy - 1, 7, 1, C.outline);
      // Water stain dripping from the sill.
      if (chance(0.2)) img.rect(wx + randInt(1, 5), wy + 11, 1, randInt(3, 7), C.stain);
      // AC unit hanging below.
      if (chance(0.18)) {
        img.rect(wx, wy + 11, 7, 4, C.ac);
        img.rect(wx + 1, wy + 12, 5, 1, C.acDark);
        img.rect(wx, wy + 15, 7, 1, C.outline);
      }
    }
  }
  if (fireEscape) {
    const fx = chance(0.5) ? x + 4 : x + w - 22;
    for (let fy = top + 20; fy < bottom - 8; fy += 18) {
      img.rect(fx, fy, 18, 1, C.outline);
      img.rect(fx, fy - 3, 18, 1, C.outline);
      for (let r = 0; r <= 18; r += 3) img.rect(fx + r, fy - 3, 1, 3, C.outline);
      for (let d = 0; d < 14 && fy + 1 + d < bottom - 6; d++) img.set(fx + 3 + d, fy + 1 + d, C.outline);
    }
  }
}

function crackLine(img, x, y, len) {
  let cx = x;
  for (let i = 0; i < len; i++) {
    img.set(cx, y + i, C.crack);
    cx += randInt(-1, 1);
  }
}

function poster(img, x, y) {
  img.rect(x, y, 7, 9, C.poster);
  img.rect(x + 1, y + 2, 5, 1, C.posterInk);
  img.rect(x + 1, y + 4, 4, 1, C.posterInk);
  // Torn corner and ragged bottom edge.
  img.clear(x + 6, y);
  img.clear(x + 5, y);
  img.clear(x + 6, y + 1);
  for (let i = 0; i < 7; i++) if (chance(0.4)) img.clear(x + i, y + 8);
}

// ---------------------------------------------------------------- graffiti
// Legible spray-paint pieces in neon colors, painted only on flat surfaces (blank walls,
// shutters, plywood). Each has a dark outline, a lighter top edge and paint drips.

/** 5x7 pixel letters. "#" = paint. */
const FONT = {
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  G: [' ####', '#    ', '#    ', '# ###', '#   #', '#   #', ' ####'],
  H: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  W: ['#   #', '#   #', '#   #', '# # #', '# # #', '## ##', '#   #'],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  $: ['  #  ', ' ####', '# #  ', ' ### ', '  # #', '#### ', '  #  '],
  '=': ['     ', '     ', '#####', '     ', '#####', '     ', '     '],
  ' ': ['   ', '   ', '   ', '   ', '   ', '   ', '   '],
};

/** Faces with X eyes, 11x11. */
const FACES = {
  frown: [
    '   #####   ',
    ' ##     ## ',
    '#         #',
    '# # # # # #',
    '#  #   #  #',
    '# # # # # #',
    '#         #',
    '#   ###   #',
    '#  #   #  #',
    ' ##     ## ',
    '   #####   ',
  ],
  smile: [
    '   #####   ',
    ' ##     ## ',
    '#         #',
    '# # # # # #',
    '#  #   #  #',
    '# # # # # #',
    '#         #',
    '#  #   #  #',
    '#   ###   #',
    ' ##     ## ',
    '   #####   ',
  ],
};

/** Neon spray paint: [fill, lighter top edge]. */
const PAINT = {
  pink: ['#ff4fb0', '#ffb3df'],
  green: ['#39ff6a', '#b8ffc9'],
  purple: ['#a64dff', '#d9b3ff'],
};
const PAINT_ORDER = ['pink', 'green', 'purple'];
let paintIndex = 0;
const nextPaint = () => PAINT[PAINT_ORDER[paintIndex++ % PAINT_ORDER.length]];

const DRIP_ROOM = 5;
/** Rows from one line of text to the next. Enough gap that outlines and drips don't merge. */
const LINE_HEIGHT = 11;

/**
 * Turns a piece of text (or a face) into a grid of painted pixels at the given scale.
 * Text can have several lines ("NEED\nMONEY"); lines are centered.
 */
function buildMask(content, scale) {
  const rows = [];
  let lastLineTop = 0;
  if (content.face) {
    rows.push({ dx: 0, dy: 0, glyph: FACES[content.face] });
  } else {
    const lines = content.text.split('\n');
    lastLineTop = (lines.length - 1) * LINE_HEIGHT * scale;
    const lineWidth = (line) => [...line].reduce((sum, ch) => sum + (FONT[ch] ?? FONT[' '])[0].length + 1, -1);
    const widest = Math.max(...lines.map(lineWidth));
    lines.forEach((line, li) => {
      let dx = Math.floor((widest - lineWidth(line)) / 2);
      for (const ch of line) {
        const glyph = FONT[ch] ?? FONT[' '];
        // Hand-sprayed look: letters bob up and down a little.
        rows.push({ dx, dy: li * LINE_HEIGHT + (ch === ' ' ? 0 : randInt(0, 1)), glyph });
        dx += glyph[0].length + 1;
      }
    });
  }
  const w = Math.max(...rows.map((r) => r.dx + r.glyph[0].length)) * scale;
  const h = Math.max(...rows.map((r) => r.dy + r.glyph.length)) * scale;
  const mask = new Uint8Array(w * h);
  for (const { dx, dy, glyph } of rows)
    glyph.forEach((line, gy) =>
      [...line].forEach((c, gx) => {
        if (c !== '#') return;
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) mask[((gy + dy) * scale + sy) * w + (dx + gx) * scale + sx] = 1;
      })
    );
  return { mask, w, h, lastLineTop };
}

/** Size a piece would take up, including its outline and room for drips. */
function pieceSize(content, scale) {
  const saved = state; // measuring shouldn't change the random letter bobbing
  const { w, h } = buildMask(content, scale);
  state = saved;
  return { w: w + 2, h: h + 2 + DRIP_ROOM };
}

function paintPiece(img, x, y, content, scale) {
  const { mask, w, h, lastLineTop } = buildMask(content, scale);
  const [fill, hi] = nextPaint();
  const inMask = (i, j) => i >= 0 && j >= 0 && i < w && j < h && mask[j * w + i];
  const ox = x + 1;
  const oy = y + 1;
  for (let j = -1; j <= h; j++)
    for (let i = -1; i <= w; i++) {
      if (inMask(i, j)) img.set(ox + i, oy + j, inMask(i, j - 1) ? fill : hi);
      else if (inMask(i - 1, j) || inMask(i + 1, j) || inMask(i, j - 1) || inMask(i, j + 1)) img.set(ox + i, oy + j, C.outline);
    }
  // Drips run down from the bottom of strokes, only on the last line so they don't run
  // into the letters below.
  for (let i = 0; i < w; i++) {
    let j = h - 1;
    while (j >= lastLineTop && !inMask(i, j)) j--;
    if (j < lastLineTop || !chance(0.22)) continue;
    const len = randInt(2, DRIP_ROOM - 1);
    img.rect(ox + i, oy + j + 1, 1, len, fill);
    img.set(ox + i, oy + j + 1 + len, C.outline);
  }
}

/** Flat spots where graffiti could go, collected while drawing buildings. */
const surfaces = [];
const addSurface = (x, y, w, h) => surfaces.push({ x, y, w, h, used: false });

/**
 * Paint a piece on a surface, if it fits. Wide surfaces keep their leftover space free
 * for another piece beside this one. Returns true when painted.
 */
function paintOn(img, surface, content, scale) {
  const size = pieceSize(content, scale);
  if (surface.used || size.w > surface.w || size.h > surface.h) return false;
  const spare = surface.w - size.w;
  const leaveRoom = spare >= 18; // enough room left for something else
  let x = surface.x + (leaveRoom ? randInt(1, 3) : Math.floor(spare / 2));
  // Slide along the surface to keep clear of lamp posts.
  if (hitsLamp(x, size.w)) {
    const clear = [];
    for (let cx = surface.x; cx + size.w <= surface.x + surface.w; cx++) if (!hitsLamp(cx, size.w)) clear.push(cx);
    if (!clear.length) return false;
    x = clear[0];
  }
  const y = surface.y + Math.floor((surface.h - size.h) / 2);
  paintPiece(img, x, y, content, scale);
  surface.used = true;
  if (leaveRoom) addSurface(x + size.w + 3, surface.y, surface.x + surface.w - (x + size.w + 3), surface.h);
  return true;
}

function storefront(img, x, w, wall, kind) {
  const H = NEAR_H;
  // Sign band.
  const signColor = pick(C.sign);
  img.rect(x + 3, H - 58, w - 6, 7, signColor);
  img.rect(x + 3, H - 58, w - 6, 1, C.outline);
  img.rect(x + 3, H - 52, w - 6, 1, C.outline);
  for (let i = x + 8; i < x + w - 8; i += 6) img.rect(i, H - 56, 3, 3, C.sill); // unlit bulbs, no text

  // Shop window and door.
  const ww = Math.max(16, w - 30);
  const wx = x + 5;
  const wy = H - 46;
  const wh = 30;
  img.rect(wx - 1, wy - 1, ww + 2, wh + 2, C.outline);
  img.rect(wx, wy, ww, wh, C.glass);
  for (let k = 0; k < 2; k++) {
    const sx = wx + randInt(2, ww - 8);
    for (let d = 0; d < 7; d++) img.set(sx + d, wy + 2 + d, C.glassShine);
  }
  img.rect(wx, wy + 12, ww, 1, C.frame); // shelves
  img.rect(wx, wy + 22, ww, 1, C.frame);

  if (kind === 'laundromat') {
    for (let cx = wx + 2; cx + 8 <= wx + ww; cx += 10) {
      img.rect(cx, wy + 14, 8, 8, C.washer);
      img.rect(cx + 2, wy + 16, 4, 4, C.glass);
    }
  } else if (kind === 'pawn') {
    // Three-ball pawn sign hanging beside the door.
    const px = x + w - 6;
    img.rect(px, H - 50, 4, 1, C.outline);
    img.rect(px - 2, H - 48, 3, 3, C.pawnBall);
    img.rect(px + 2, H - 48, 3, 3, C.pawnBall);
    img.rect(px, H - 45, 3, 3, C.pawnBall);
    for (let i = wx + 3; i < wx + ww - 4; i += 6) img.rect(i, wy + 6, 3, 5, C.sill); // stuff on shelves
  } else if (kind === 'store') {
    // Crates of fruit outside.
    for (let cx = wx; cx + 9 <= wx + ww; cx += 11) {
      img.rect(cx, H - 8, 9, 7, C.crate);
      img.rect(cx, H - 8, 9, 1, C.outline);
      img.rect(cx, H - 5, 9, 1, C.outline);
      for (let f = 1; f < 8; f += 2) img.set(cx + f, H - 9, pick(C.fruit));
    }
  }

  // Neon "open"-style sign in the window (no text).
  if (chance(0.5)) {
    const nx = wx + randInt(2, Math.max(2, ww - 12));
    img.rect(nx, wy + 3, 10, 5, C.neonDim);
    img.rect(nx + 1, wy + 4, 8, 3, C.neon);
  }

  // Cracked window.
  if (chance(0.35)) {
    let cx = wx + randInt(3, ww - 3);
    for (let cy = wy; cy < wy + 12; cy++) {
      img.set(cx, cy, C.sill);
      cx += randInt(-1, 1);
    }
  }

  // Security shutter, pulled part of the way down.
  if (chance(0.4)) {
    const sh = randInt(8, wh - 6);
    for (let sy = wy; sy < wy + sh; sy++) img.rect(wx, sy, ww, 1, sy % 2 ? C.shutterA : C.shutterB);
    img.rect(wx, wy + sh, ww, 1, C.outline);
    addSurface(wx, wy, ww, sh);
  }

  // Door.
  const dx = x + w - 21;
  img.rect(dx - 1, H - 47, 15, 47, C.outline);
  img.rect(dx, H - 46, 13, 46, C.door);
  img.rect(dx + 2, H - 43, 9, 18, C.glass);
  img.set(dx + 3, H - 42, C.glassShine);
  img.set(dx + 10, H - 22, C.sill); // handle

  // Torn awning over the window.
  if (chance(0.6)) {
    const [a, b] = pick(C.awning);
    for (let i = 0; i < ww + 2; i++) {
      const missing = chance(0.12);
      if (missing) continue;
      const drop = chance(0.08) ? 2 : 0;
      img.rect(wx - 1 + i, H - 50, 1, 3 + drop, Math.floor(i / 3) % 2 ? a : b);
    }
    img.rect(wx - 1, H - 51, ww + 2, 1, C.outline);
  }

  // Kick plate under the window (a flat panel, good for graffiti).
  img.rect(wx, wy + wh + 1, ww, H - (wy + wh + 1), wall.shade);
  if (kind !== 'store') addSurface(wx, wy + wh + 1, ww, H - (wy + wh + 1));
}

function drawShop(img, x, w, stories) {
  const wall = pick(WALLS);
  const h = stories === 1 ? randInt(62, 70) : randInt(100, 112);
  const top = NEAR_H - h;
  brickWall(img, x, top, w, h, wall);
  sideEdges(img, x, top, w, h, wall);
  cornice(img, x, top, w, wall);
  if (stories > 1) upperWindows(img, x, w, top + 4, NEAR_H - STOREY - 8);
  storefront(img, x, w, wall, pick(['laundromat', 'pawn', 'store', 'plain']));
  addWear(img, x, w, top, wall);
}

function drawBoarded(img, x, w) {
  const wall = pick(WALLS);
  const h = randInt(64, 104);
  const top = NEAR_H - h;
  brickWall(img, x, top, w, h, wall);
  sideEdges(img, x, top, w, h, wall);
  cornice(img, x, top, w, wall);
  if (h > 80) upperWindows(img, x, w, top + 4, NEAR_H - STOREY - 8);
  // Broken sign hanging off one end.
  const signColor = pick(C.sign);
  for (let i = 0; i < w - 10; i++) {
    const sag = Math.floor(Math.max(0, i - (w - 10) / 2) / 4);
    img.rect(x + 3 + i, NEAR_H - 58 + sag, 1, 6, signColor);
    img.set(x + 3 + i, NEAR_H - 58 + sag, C.outline);
  }
  // Everything at street level boarded up.
  boardedPatch(img, x + 5, NEAR_H - 46, w - 28, 30);
  boardedPatch(img, x + w - 21, NEAR_H - 46, 13, 46);
  addSurface(x + 5, NEAR_H - 46, w - 28, 30);
  addWear(img, x, w, top, wall);
}

function drawApartment(img, x, w) {
  const wall = pick(WALLS);
  const h = chance(0.5) ? NEAR_H : randInt(108, 118);
  const top = NEAR_H - h;
  brickWall(img, x, top, w, h, wall);
  sideEdges(img, x, top, w, h, wall);
  if (h < NEAR_H) cornice(img, x, top, w, wall);
  upperWindows(img, x, w, top + 4, NEAR_H - STOREY + 4, { fireEscape: w > 50 });
  // Entrance with a stoop.
  const dx = x + Math.floor(w / 2) - 7;
  img.rect(dx - 2, NEAR_H - 52, 18, 3, wall.hi); // lintel
  img.rect(dx - 1, NEAR_H - 49, 16, 43, C.outline);
  img.rect(dx, NEAR_H - 48, 14, 42, C.door);
  img.rect(dx + 2, NEAR_H - 45, 10, 12, C.glass);
  img.rect(dx - 3, NEAR_H - 6, 20, 2, wall.hi); // steps
  img.rect(dx - 5, NEAR_H - 4, 24, 4, wall.shade);
  // Barred ground-floor windows either side.
  for (const bxw of [x + 4, x + w - 14]) {
    if (bxw < dx - 11 || bxw > dx + 16) {
      img.rect(bxw, NEAR_H - 40, 10, 14, C.winDark);
      for (let b = 1; b < 10; b += 2) img.rect(bxw + b, NEAR_H - 40, 1, 14, C.outline);
    }
  }
  addWear(img, x, w, top, wall);
}

function drawAlley(img, x, w) {
  img.rect(x, 0, w, NEAR_H, C.deep);
  img.rect(x + 2, 0, 1, NEAR_H, C.outline); // pipe in the shadows
  // Dumpster.
  const dw = Math.min(w - 2, 14);
  img.rect(x + 1, NEAR_H - 12, dw, 12, C.dumpster);
  img.rect(x + 1, NEAR_H - 12, dw, 2, C.dumpsterHi);
  img.rect(x + 1, NEAR_H - 13, dw, 1, C.outline);
}

/** Empty lot behind a chain-link fence. Transparent above, so the buildings behind show through. */
function drawLot(img, x, w) {
  img.rect(x, NEAR_H - 3, w, 3, C.dirt);
  const fenceTop = NEAR_H - 34;
  const holeX = x + randInt(10, w - 20);
  for (let y = fenceTop; y < NEAR_H - 3; y++) {
    for (let i = x; i < x + w; i++) {
      const inHole = i > holeX && i < holeX + 9 && y > NEAR_H - 18;
      if (!inHole && ((i + y) % 5 === 0 || (i - y + 1000) % 5 === 0)) img.set(i, y, C.fence);
    }
  }
  img.rect(x, fenceTop, w, 1, C.fencePost);
  for (let px = x + 2; px < x + w; px += 16) img.rect(px, fenceTop - 1, 2, 35, C.fencePost);
  // Weeds, trash bags and a tire.
  for (let i = x + 1; i < x + w; i += randInt(3, 7)) img.rect(i, NEAR_H - 3 - randInt(1, 4), 1, 4, C.weed);
  for (let k = 0; k < 3; k++) {
    const bx = x + randInt(2, w - 10);
    img.rect(bx, NEAR_H - 7, 7, 5, C.bag);
    img.rect(bx + 1, NEAR_H - 8, 5, 1, C.bag);
    img.rect(bx + 2, NEAR_H - 7, 2, 1, C.bagHi);
  }
  const tx = x + randInt(4, w - 12);
  img.rect(tx, NEAR_H - 6, 8, 4, C.outline);
  img.rect(tx + 2, NEAR_H - 5, 4, 2, C.dirt);
}

/** Cracks, stains and torn posters on a building. */
function addWear(img, x, w, top, wall) {
  for (let k = 0; k < randInt(1, 3); k++) crackLine(img, x + randInt(3, w - 4), top + randInt(4, 30), randInt(5, 12));
  for (let k = 0; k < randInt(0, 2); k++) {
    // Missing plaster patch showing older brick.
    const px = x + randInt(4, w - 10);
    const py = top + randInt(6, Math.max(6, NEAR_H - top - 70));
    img.rect(px, py, 6, 3, wall.shade);
    img.rect(px + 1, py + 1, 4, 1, wall.mortar);
  }
  for (let k = 0; k < randInt(1, 2); k++) poster(img, x + randInt(2, w - 9), NEAR_H - randInt(28, 40));
}

/**
 * Blank brick side wall: a flat canvas for a big graffiti piece up top, and smaller
 * pieces side by side along the lower half ({ content, scale } each).
 */
function drawBlankWall(img, x, w, content, scale, lowerPieces = []) {
  const wall = pick(WALLS);
  const h = randInt(96, 108);
  const top = NEAR_H - h;
  brickWall(img, x, top, w, h, wall);
  sideEdges(img, x, top, w, h, wall);
  cornice(img, x, top, w, wall);
  img.rect(x + w - 6, top + 4, 1, h - 4, C.stain); // drainpipe
  img.rect(x + 2, NEAR_H - 4, w - 4, 4, wall.shade); // grimy base
  for (let k = 0; k < 2; k++) crackLine(img, x + randInt(3, w - 4), top + randInt(4, 20), randInt(5, 10));

  const size = pieceSize(content, scale);
  paintPiece(img, x + Math.floor((w - size.w) / 2), top + 10, content, scale);

  // Lower half, left to right. Each piece takes the space the previous one left over.
  addSurface(x + 3, NEAR_H - 40, w - 10, 34);
  for (const piece of lowerPieces) {
    const free = surfaces[surfaces.length - 1];
    if (!paintOn(img, free, piece.content, piece.scale)) {
      console.log(`  (doesn't fit on the wall at ${x}: ${(piece.content.text ?? piece.content.face).replace('\n', ' ')})`);
    }
  }
}

function fillSegments(img, start, end) {
  let x = start;
  let last = '';
  while (x < end) {
    let type = pick(['shop2', 'shop2', 'shop1', 'apartment', 'apartment', 'boarded', 'alley']);
    if (type === 'alley' && (last === 'alley' || end - x < 60)) type = 'shop1';
    let w = type === 'alley' ? randInt(12, 16) : randInt(56, 84);
    if (end - x - w < 40) w = end - x; // don't leave a sliver at the end
    if (type === 'shop1') drawShop(img, x, w, 1);
    else if (type === 'shop2') drawShop(img, x, w, 2);
    else if (type === 'apartment') drawApartment(img, x, w);
    else if (type === 'boarded') drawBoarded(img, x, w);
    else drawAlley(img, x, w);
    last = type;
    x += w;
  }
}

/** Big pieces on their own blank walls, at set spots along the street (art px). */
const LEDGES_WALL = { start: 140, width: 80 }; // near where Finn starts
const TRUST_WALL_WIDTH = 82; // right before the billboard lot, answering "Trust Us With Tomorrow."

/**
 * Extra pieces scattered onto whatever flat surfaces are left (shutters, plywood, panels).
 * The key pieces are set on the two blank walls in makeNear instead.
 * Faces and dollar signs need double size for their details (X eyes, the S of the $) to read.
 */
const GRAFFITI = [{ content: { face: 'smile' }, scales: [2] }];

/**
 * Streetlamp positions in art px (world x / 4). Keep in sync with STREETLAMP_START_X and
 * STREETLAMP_SPACING in LedgesScene.ts, so graffiti isn't hidden behind a pole.
 */
const LAMP_XS = Array.from({ length: 6 }, (_, i) => 50 + i * 100);
const hitsLamp = (x, w) => LAMP_XS.some((lx) => lx + 3 >= x && lx - 3 <= x + w);

function makeNear() {
  const img = new Img(NEAR_W, NEAR_H);
  const trustStart = BILLBOARD_LOT.start - TRUST_WALL_WIDTH;

  fillSegments(img, 0, LEDGES_WALL.start);
  drawBlankWall(img, LEDGES_WALL.start, LEDGES_WALL.width, { text: 'LEDGES' }, 2, [
    { content: { text: '$$$' }, scale: 2 },
    { content: { text: '$' }, scale: 2 },
  ]);
  fillSegments(img, LEDGES_WALL.start + LEDGES_WALL.width, trustStart);
  drawBlankWall(img, trustStart, TRUST_WALL_WIDTH, { text: 'TRUST\nWHO?' }, 1, [
    { content: { text: 'MONEY =\nPOWER' }, scale: 1 },
    { content: { face: 'frown' }, scale: 2 },
  ]);
  drawLot(img, BILLBOARD_LOT.start, BILLBOARD_LOT.end - BILLBOARD_LOT.start);
  fillSegments(img, BILLBOARD_LOT.end, NEAR_W);

  // Spread the smaller pieces over the surfaces they fit on.
  for (const { content, scales } of GRAFFITI) {
    let painted = false;
    for (const scale of scales) {
      const size = pieceSize(content, scale);
      const options = surfaces.filter((s) => !s.used && size.w <= s.w && size.h <= s.h);
      while (options.length && !painted) {
        const surface = options.splice(Math.floor(rand() * options.length), 1)[0];
        painted = paintOn(img, surface, content, scale);
      }
      if (painted) break;
    }
    if (!painted) console.log(`  (no clear surface big enough for ${(content.text ?? content.face).replace('\n', ' ')})`);
  }
  img.save('ledges_near.png');
}

// ================================================================ MID ROW (behind)
function drawMidBuilding(img, x, w, h) {
  const top = img.h - h;
  const wall = pick(C.midWalls);
  img.rect(x, top, w, h, wall);
  img.rect(x + w - 3, top, 2, h, C.midShade);
  img.rect(x, top, w, 1, C.midOutline);
  img.rect(x, top, 1, h, C.midOutline);
  img.rect(x + w - 1, top, 1, h, C.midOutline);
  img.rect(x + 1, top + 1, w - 2, 1, C.midEdge);
  if (chance(0.4)) {
    // Water tank (no antennas).
    const tx = x + randInt(4, Math.max(4, w - 12));
    img.rect(tx, top - 8, 8, 5, C.midShade);
    img.rect(tx, top - 8, 8, 1, C.midOutline);
    img.rect(tx + 1, top - 3, 1, 3, C.midOutline);
    img.rect(tx + 6, top - 3, 1, 3, C.midOutline);
  } else if (chance(0.4)) {
    // Rooftop box.
    const rx = x + randInt(3, Math.max(3, w - 12));
    img.rect(rx, top - 4, 9, 4, C.midShade);
    img.rect(rx, top - 4, 9, 1, C.midOutline);
  }
  for (let wy = top + 7; wy + 5 < img.h - 4; wy += 9) {
    for (let wx = x + 4; wx + 4 < x + w - 4; wx += 7) {
      img.rect(wx, wy, 4, 5, chance(0.25) ? pick(C.midWinLit) : C.midWinDark);
    }
  }
}

function makeMid() {
  // At 0.7 parallax with the widest view (1200px), (2400 - 1200) * 0.7 + 1200 = 2040 screen px
  // can scroll into view = 510 art px. A little extra for safety.
  const img = new Img(520, 96);
  let x = 0;
  while (x < img.w) {
    const w = randInt(36, 62);
    drawMidBuilding(img, x, w, randInt(50, 92));
    x += w + (chance(0.3) ? randInt(2, 5) : 0);
  }
  img.save('ledges_mid.png');
}

// ================================================================ GROUND
function makeGround() {
  // 2400 x 120 screen px = 600 x 30 art px. Finn's feet rest on the top row.
  const img = new Img(600, 30);
  img.rect(0, 0, img.w, 1, C.curbTop);
  img.rect(0, 1, img.w, 2, C.sidewalkHi);
  img.rect(0, 3, img.w, 9, C.sidewalk);
  img.rect(0, 12, img.w, 2, C.curbEdge);
  img.rect(0, 14, img.w, 16, C.street);
  for (let x = 0; x < img.w; x += 16) {
    img.rect(x, 1, 1, 11, C.joint);
    if (chance(0.3)) {
      let cx = x + randInt(3, 12);
      for (let cy = randInt(2, 5); cy < 11; cy++) {
        img.set(cx, cy, C.joint);
        cx += randInt(-1, 1);
      }
    }
  }
  for (let x = 4; x < img.w; x += 25) img.rect(x, 21, 10, 1, C.laneDash);
  for (let i = 0; i < 6; i++) {
    const px = randInt(0, img.w - 12);
    const py = randInt(16, 26);
    img.rect(px, py, 10, 2, C.puddle);
    img.rect(px + 2, py, 4, 1, C.puddleHi);
  }
  for (let i = 0; i < 3; i++) {
    const mx = randInt(20, img.w - 20);
    img.rect(mx, 25, 8, 2, C.curbEdge);
    img.rect(mx + 1, 25, 6, 1, C.joint);
  }
  img.save('ledges_ground.png');
}

// ================================================================ STREETLAMP
function makeLamp() {
  // 14 x 58 art px = 56 x 232 screen px. Anchor: bottom center of the pole.
  const img = new Img(14, 58);
  img.rect(7, 6, 2, 50, C.pole);
  img.rect(7, 6, 1, 50, C.poleHi);
  img.rect(5, 54, 6, 4, C.pole);
  img.rect(5, 54, 6, 1, C.poleHi);
  img.rect(2, 4, 7, 2, C.pole);
  img.rect(1, 6, 5, 2, C.pole);
  img.rect(1, 6, 5, 1, C.poleHi);
  img.rect(2, 8, 3, 2, C.bulb);
  img.rect(1, 8, 1, 1, C.bulbRim);
  img.rect(5, 8, 1, 1, C.bulbRim);
  img.save('streetlamp.png');
}

makeNear();
makeMid();
makeGround();
makeLamp();
