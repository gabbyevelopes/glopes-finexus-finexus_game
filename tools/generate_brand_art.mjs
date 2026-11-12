// Generates the Vaulton logo and the Neobyte coin as pixel art:
//   vaulton_logo.png - vault-door emblem + "VAULTON" wordmark (billboard, info card, email)
//   vaulton_icon.png - small emblem only (Inbox sender picture)
//   neobyte_coin.png - the Neobyte coin (world pickup, Wallet app)
// Run with:  node tools/generate_brand_art.mjs
// The game scales these up by whole numbers (2x, 3x...) so the pixels stay crisp.
import { Img } from './pixel-image.mjs';

// ---------------------------------------------------------------- Vaulton colors
// Flat colors only (no shading or gradients) for a sleek corporate look.
const V = {
  white: '#ffffff', // wordmark and V handle
  teal: '#0bdbda', // brand accent: emblem ring and divider
  tealDeep: '#0896a3', // engraved rivets on the ring
  face: '#10224a', // vault door face
  gap: '#0a1633', // thin dark line between ring and face
};

/**
 * Squared, geometric capitals (10x11, even two-pixel strokes) for the Vaulton name.
 * Widely spaced, in solid white, like a bank or fintech wordmark.
 */
const LOGO_FONT = {
  V: [
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    ' ##    ## ',
    ' ##    ## ',
    '  ##  ##  ',
    '  ##  ##  ',
    '   ####   ',
    '    ##    ',
  ],
  A: [
    ' ######## ',
    '##########',
    '##      ##',
    '##      ##',
    '##      ##',
    '##########',
    '##########',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
  ],
  U: [
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##########',
    ' ######## ',
  ],
  L: [
    '##        ',
    '##        ',
    '##        ',
    '##        ',
    '##        ',
    '##        ',
    '##        ',
    '##        ',
    '##        ',
    '##########',
    '##########',
  ],
  T: [
    '##########',
    '##########',
    '    ##    ',
    '    ##    ',
    '    ##    ',
    '    ##    ',
    '    ##    ',
    '    ##    ',
    '    ##    ',
    '    ##    ',
    '    ##    ',
  ],
  O: [
    ' ######## ',
    '##########',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##      ##',
    '##########',
    ' ######## ',
  ],
  N: [
    '##      ##',
    '###     ##',
    '####    ##',
    '## ##   ##',
    '##  ##  ##',
    '##   ## ##',
    '##    ####',
    '##     ###',
    '##      ##',
    '##      ##',
    '##      ##',
  ],
};
/** Wide letter spacing reads as premium. */
const LETTER_GAP = 5;

/** A thick line, for the V-shaped vault handle. */
function line(img, x0, y0, x1, y1, color, thickness = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    img.rect(x, y, thickness, thickness, color);
  }
}

/**
 * Round vault door: solid teal ring with engraved rivets, navy face, white V handle.
 * size 24 for the logo, 16 for the small icon.
 */
function drawEmblem(img, ox, oy, size) {
  const c = (size - 1) / 2;
  const r = size / 2;
  const ring = size >= 20 ? 3 : 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > r) continue;
      let color;
      if (d > r - ring) color = V.teal;
      else if (d > r - ring - 1) color = V.gap;
      else color = V.face;
      img.set(ox + x, oy + y, color);
    }
  // Rivets engraved into the ring.
  const rivetR = r - ring / 2 - 0.5;
  const count = size >= 20 ? 8 : 4;
  for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2 + Math.PI / count;
    img.set(ox + Math.round(c + Math.cos(a) * rivetR), oy + Math.round(c + Math.sin(a) * rivetR), V.tealDeep);
  }
  // V handle in white.
  const big = size >= 20;
  const t = big ? 2 : 1;
  const tipX = Math.round(c) - (big ? 1 : 0);
  const tipY = Math.round(c + (big ? 3 : 2));
  const armY = Math.round(c - (big ? 4 : 3));
  const armL = Math.round(c - (big ? 5 : 3));
  const armR = Math.round(c + (big ? 4 : 3));
  line(img, ox + armL, oy + armY, ox + tipX, oy + tipY, V.white, t);
  line(img, ox + armR, oy + armY, ox + tipX, oy + tipY, V.white, t);
}

function drawWordmark(img, ox, oy, text) {
  let x = ox;
  for (const ch of text) {
    const glyph = LOGO_FONT[ch];
    glyph.forEach((row, gy) => [...row].forEach((c, gx) => c === '#' && img.set(x + gx, oy + gy, V.white)));
    x += glyph[0].length + LETTER_GAP;
  }
}

/** Emblem | thin teal divider | VAULTON */
function makeLogo() {
  const word = 'VAULTON';
  const wordW = [...word].reduce((s, ch) => s + LOGO_FONT[ch][0].length + LETTER_GAP, -LETTER_GAP);
  const wordH = LOGO_FONT.V.length;
  const emblem = 24;
  const gap = 7;
  const img = new Img(emblem + gap + 1 + gap + wordW, emblem);

  drawEmblem(img, 0, 0, emblem);
  img.rect(emblem + gap, 2, 1, emblem - 4, V.teal); // divider
  drawWordmark(img, emblem + gap + 1 + gap, Math.floor((emblem - wordH) / 2), word);
  img.save('vaulton_logo.png');
}

function makeIcon() {
  const img = new Img(16, 16);
  drawEmblem(img, 0, 0, 16);
  img.save('vaulton_icon.png');
}

// ---------------------------------------------------------------- Neobyte coin
const COIN = {
  rim: '#7a4a00',
  edge: '#e0a800',
  edgeHi: '#ffe680',
  face: '#ffd23f',
  mark: '#a86f00',
  shine: '#fff6c2',
};

/** 13x13 gold coin with an "N" stamped in the middle. */
function makeCoin() {
  const size = 13;
  const img = new Img(size, size);
  const c = (size - 1) / 2;
  const r = size / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > r) continue;
      let color;
      if (d > r - 1) color = COIN.rim;
      else if (d > r - 2.2) color = x + y < size - 1 ? COIN.edgeHi : COIN.edge;
      else color = COIN.face;
      img.set(x, y, color);
    }
  const N = ['#   #', '##  #', '# # #', '#  ##', '#   #'];
  N.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && img.set(4 + x, 4 + y, COIN.mark)));
  img.set(3, 3, COIN.shine);
  img.set(4, 2, COIN.shine);
  img.save('neobyte_coin.png');
}

makeLogo();
makeIcon();
makeCoin();
