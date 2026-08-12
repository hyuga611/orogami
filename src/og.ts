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

export async function subset(font: Buffer, text: string, opts: { weight?: number } = {}): Promise<Buffer> {
  return subsetFont(font, text, {
    targetFormat: 'truetype',
    ...(opts.weight ? { variationAxes: { wght: opts.weight } } : {}),
  });
}

export async function renderOgp(title: string, opts: OgOptions): Promise<Buffer> {
  const { font, lang = 'ja', width = 1200, height = 630, fontFamily = 'Noto Sans JP', wrap: doWrap = true } = opts;

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
    { width, height, fonts: [{ name: fontFamily, data: font, weight: 700, style: 'normal' }] }
  );

  return Buffer.from(new Resvg(svg).render().asPng());
}
