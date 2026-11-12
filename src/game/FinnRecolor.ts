import Phaser from 'phaser';

type Region = 'hair' | 'skin' | null;

interface FrameData {
  live: Phaser.Textures.CanvasTexture;
  original: Uint8ClampedArray;
  /** Which region each pixel belongs to (hair, skin or neither). */
  regions: Region[];
}

/** Rows from the top of Finn's art (in source pixels) where his hair can be. Below this is visor/clothes. */
const HAIR_MAX_ROW = 62;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max / 255];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** Works out whether a pixel is hair (blue, top of the head) or skin (warm peach tones). */
function classify(r: number, g: number, b: number, row: number): Region {
  const [h, s, v] = rgbToHsv(r, g, b);
  if (row < HAIR_MAX_ROW && h >= 190 && h <= 240 && s > 0.3 && v > 0.25) return 'hair';
  if ((h <= 45 || h >= 330) && s > 0.12 && s < 0.65 && v > 0.45) return 'skin';
  return null;
}

/**
 * Recolors Finn's hair and skin on his existing sprite frames (a palette swap), keeping
 * the original light and shadow. The recolored frames live in "<key>_live" textures,
 * which the sprite and walk animation use.
 */
export class FinnRecolor {
  private frames: FrameData[] = [];
  /** Average saturation and brightness of each region in the original art, used to keep shading. */
  private average: Record<'hair' | 'skin', { s: number; v: number }> = {
    hair: { s: 0, v: 0 },
    skin: { s: 0, v: 0 },
  };

  constructor(scene: Phaser.Scene, baseKeys: string[]) {
    const sums = { hair: { s: 0, v: 0, n: 0 }, skin: { s: 0, v: 0, n: 0 } };

    for (const key of baseKeys) {
      const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
      const live = scene.textures.createCanvas(`${key}_live`, source.width, source.height)!;
      live.context.drawImage(source, 0, 0);
      const original = live.context.getImageData(0, 0, source.width, source.height).data.slice();

      const regions: Region[] = [];
      for (let i = 0; i < original.length; i += 4) {
        const region = original[i + 3] ? classify(original[i], original[i + 1], original[i + 2], Math.floor(i / 4 / source.width)) : null;
        regions.push(region);
        if (region) {
          const [, s, v] = rgbToHsv(original[i], original[i + 1], original[i + 2]);
          sums[region].s += s;
          sums[region].v += v;
          sums[region].n++;
        }
      }
      live.refresh();
      this.frames.push({ live, original, regions });
    }

    for (const region of ['hair', 'skin'] as const) {
      const n = Math.max(1, sums[region].n);
      this.average[region] = { s: sums[region].s / n, v: sums[region].v / n };
    }
  }

  /** Repaint Finn with these colors (hex), or null to keep the original art for that region. */
  apply(hair: string | null, skin: string | null): void {
    const targets = { hair: hair ? this.hexToHsv(hair) : null, skin: skin ? this.hexToHsv(skin) : null };

    for (const frame of this.frames) {
      const ctx = frame.live.context;
      const image = ctx.getImageData(0, 0, frame.live.width, frame.live.height);
      const out = image.data;
      out.set(frame.original);

      frame.regions.forEach((region, p) => {
        const target = region && targets[region];
        if (!region || !target) return;
        const i = p * 4;
        const [, s, v] = rgbToHsv(out[i], out[i + 1], out[i + 2]);
        const avg = this.average[region];
        // Keep each pixel's shading relative to the region's average, around the new color.
        const newS = Math.min(1, target[1] * (s / Math.max(avg.s, 0.01)));
        const newV = Math.min(1, target[2] * (v / Math.max(avg.v, 0.01)));
        const [r, g, b] = hsvToRgb(target[0], newS, newV);
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
      });

      ctx.putImageData(image, 0, 0);
      frame.live.refresh();
    }
  }

  private hexToHsv(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return rgbToHsv((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
}
