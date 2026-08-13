/**
 * The measurement behind the table in the README's Satori section.
 *
 * The README used to tell people to use `wrap()` with `word-break: keep-all`
 * inside Satori. That works in a browser and mostly does not work in Satori,
 * which reads `keep-all` as "segment with Intl.Segmenter at word granularity"
 * and never treats the zero-width spaces as the authority on where to break.
 * The result splits phrases down the middle — the exact thing this package
 * exists to prevent.
 *
 * Run it yourself rather than taking the table on trust:
 *
 *   npm run build
 *   node examples/satori-breaks.ts
 *
 * Needs `.fonts/NotoSansJP.ttf` (see `npm run render`).
 */
import satori from 'satori';
import { readFileSync } from 'node:fs';
import { phrases, wrap } from '../dist/index.js';
import { subset } from '../dist/og.js';

const RAW = readFileSync('.fonts/NotoSansJP.ttf');
const ZWSP = /​/g;

const TITLES = [
  '個人開発したツールが海外の開発者にも届くための日本語OGP設計',
  '東京都渋谷区のスタートアップで働くエンジニアの一日',
  '生成AIを業務に入れるとき最初に決めておくべきこと',
  '小さなチームがデザインシステムを維持し続ける方法',
  'この記事は、読みやすさと速さを両立させるための記録です',
];
const WIDTHS = [420, 480, 560, 640, 720];

async function linesOf(font: Buffer, children: unknown, style: object, width: number) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width, height: 400, display: 'flex', padding: 20, alignItems: 'center',
          background: '#111', color: '#eee', fontFamily: 'F', fontSize: 48, lineHeight: 1.4, ...style,
        },
        children,
      },
      // biome-ignore lint/suspicious/noExplicitAny: satori's node type is structural
    } as any,
    { width, height: 400, embedFont: false, fonts: [{ name: 'F', data: font, weight: 400, style: 'normal' }] },
  );
  // embedFont:false emits one <text> per run; same `y` means the same line.
  const runs = [...svg.matchAll(/<text[^>]*\sy="([\d.]+)"[^>]*>([^<]*)<\/text>/g)]
    .map((m) => ({ y: Number(m[1]), t: m[2].replace(ZWSP, '') }));
  const byLine = new Map<number, string>();
  for (const r of runs) byLine.set(r.y, (byLine.get(r.y) ?? '') + r.t);
  return [...byLine.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
}

/** Is every line a run of whole phrases, with nothing lost? */
function clean(lines: string[], title: string): boolean {
  const ps = phrases(title);
  for (const line of lines) {
    let rest = line;
    while (rest.length) {
      const p = ps.find((p) => rest.startsWith(p));
      if (!p) return false;
      rest = rest.slice(p.length);
    }
  }
  return lines.join('') === title;
}

const WAYS = {
  'wrap() + keep-all': (t: string) => [wrap(t), { wordBreak: 'keep-all' }] as const,
  'wrap() alone': (t: string) => [wrap(t), {}] as const,
  'no orogami': (t: string) => [t, {}] as const,
  'phrases as flex items': (t: string) =>
    [{
      type: 'div',
      props: {
        style: { display: 'flex', flexWrap: 'wrap' },
        children: phrases(t).map((p) => ({ type: 'span', props: { children: p } })),
      },
    }, {}] as const,
};

const tally: Record<string, [number, number]> = {};
for (const k of Object.keys(WAYS)) tally[k] = [0, 0];

for (const title of TITLES) {
  const font = await subset(RAW, title, { weight: 400 });
  for (const width of WIDTHS) {
    for (const [name, build] of Object.entries(WAYS)) {
      const [children, style] = build(title);
      const lines = await linesOf(font, children, style, width);
      tally[name][clean(lines, title) ? 0 : 1]++;
    }
  }
}

const n = TITLES.length * WIDTHS.length;
console.log(`${TITLES.length} titles x ${WIDTHS.length} widths = ${n} combinations\n`);
console.log('  approach                    at phrase boundaries   split mid-phrase');
for (const [name, [ok, bad]] of Object.entries(tally)) {
  console.log(`  ${name.padEnd(26)} ${String(ok).padStart(14)} ${String(bad).padStart(18)}`);
}
