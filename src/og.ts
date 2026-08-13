import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import subsetFont from 'subset-font';
import { phrases, type Lang } from './index.ts';

export interface OgOptions {
  font: Buffer | ArrayBuffer;
  lang?: Lang;
  width?: number;
  height?: number;
  fontFamily?: string;
  wrap?: boolean;
}

/**
 * Does this font carry an `fvar` table — i.e. is it a variable font?
 *
 * Satori's opentype parser throws on the `fvar` table of at least Noto Sans JP,
 * with `TypeError: Cannot read properties of undefined (reading '265')` and a
 * stack entirely inside opentype.js. Nothing in it says "variable font", and
 * nothing says what to do. The fix is `subset()`, which pins a weight and drops
 * the axes — the README's own example does that, so the failure only reaches
 * someone who passed a font straight through, which is the obvious thing to try.
 *
 * This reads the sfnt table directory: u32 tag, u16 numTables, then 16-byte
 * records whose first 4 bytes are the table tag.
 */
export function isVariableFont(font: Buffer): boolean {
  try {
    if (font.length < 12) return false;
    const numTables = font.readUInt16BE(4);
    if (numTables > 512) return false; // not a table directory we understand
    for (let i = 0; i < numTables; i++) {
      const at = 12 + i * 16;
      if (at + 4 > font.length) return false;
      if (font.toString('latin1', at, at + 4) === 'fvar') return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function subset(font: Buffer, text: string, opts: { weight?: number } = {}): Promise<Buffer> {
  return subsetFont(font, text, {
    targetFormat: 'truetype',
    ...(opts.weight ? { variationAxes: { wght: opts.weight } } : {}),
  });
}

export async function renderOgp(title: string, opts: OgOptions): Promise<Buffer> {
  const { font, lang = 'ja', width = 1200, height = 630, fontFamily = 'Noto Sans JP', wrap: doWrap = true } = opts;

  const buf = Buffer.isBuffer(font) ? font : Buffer.from(font);
  if (isVariableFont(buf)) {
    throw new TypeError(
      'orogami: this is a variable font, and Satori cannot parse one — it fails inside opentype.js ' +
        'with an error that names neither the font nor the cause. Run it through subset() first, ' +
        'which pins the weight and drops the variation axes:\n' +
        "  const font = await subset(readFileSync('NotoSansJP.ttf'), title, { weight: 700 });",
    );
  }

  const content: Parameters<typeof satori>[0] = doWrap
    ? {
        type: 'div',
        props: {
          style: { display: 'flex', flexWrap: 'wrap' },
          children: phrases(title, { lang }).map((p) => ({ type: 'span', props: { children: p } })),
        },
      }
    : title;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width, height, display: 'flex', padding: 80, alignItems: 'center',
          background: '#0e1513', color: '#e6ece8', fontFamily,
          fontSize: 64, fontWeight: 700, lineHeight: 1.4,
        },
        children: content,
      },
    },
    { width, height, fonts: [{ name: fontFamily, data: buf, weight: 700, style: 'normal' }] }
  );

  return Buffer.from(new Resvg(svg).render().asPng());
}
