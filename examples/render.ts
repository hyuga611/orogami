import { readFileSync, writeFileSync } from 'node:fs';
import { renderOgp, subset } from '../src/og.ts';
import { preview } from '../src/index.ts';

const title = '個人開発したツールが海外の開発者にも届くための日本語OGP設計';

const full = readFileSync('.fonts/NotoSansJP.ttf');
console.log('full font  :', (full.length / 1024 / 1024).toFixed(2), 'MB');

const sub = await subset(full, title, { weight: 700 });
const pct = (100 - (sub.length / full.length) * 100).toFixed(1);
console.log('subset     :', (sub.length / 1024).toFixed(1), 'KB  (-' + pct + '%)');
console.log('break preview:', preview(title));

writeFileSync('orogami-off.png', await renderOgp(title, { font: sub, wrap: false }));
console.log('-> orogami-off.png  (before: char-level wrap)');

writeFileSync('orogami-on.png', await renderOgp(title, { font: sub, wrap: true }));
console.log('-> orogami-on.png   (after: BudouX phrase wrap)');
