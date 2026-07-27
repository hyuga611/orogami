# orogami 折紙

[![npm version](https://img.shields.io/npm/v/orogami.svg)](https://www.npmjs.com/package/orogami)
[![license](https://img.shields.io/npm/l/orogami.svg)](./LICENSE)
[![zero-dep core](https://img.shields.io/badge/core%20deps-budoux%20only-blue.svg)](https://github.com/google/budoux)

> By the author of **[reflint](https://github.com/hyuga611/reflint)** and a set of zero-dependency CI linters for AI-agent repos — see [Related tools](#related-tools).

**日本語(CJK)のタイトルを、いちばん自然な位置で折り返す。** BudouX の分かち書き＋禁則を、既存の OGP 生成（`@vercel/og` / Satori）に **1行で寄生**させるためのユーティリティ。

> Wrap Japanese / CJK titles at natural phrase boundaries — a drop-in for `@vercel/og` and Satori. No new framework to adopt.

## Install

```bash
npm i orogami
```

## なぜ

`@vercel/og` も `astro-og-canvas` も日本語を **文字単位** で折り返すので、タイトルが不自然に割れる（例: 行末で `東|京` と割れる）。orogami はタイトル文字列を **渡す前に1行ラップするだけ**。新しいツールも独自テーマ書式も要らない ＝ 採用摩擦ゼロ。

## 使い方（寄生モード）

```ts
import { wrap } from 'orogami';

// 既存の @vercel/og の JSX に、タイトルを wrap() で包むだけ
<div style={{ wordBreak: 'keep-all' }}>
  {wrap('個人開発したツールが海外でもバズる方法')}
</div>
```

`wrap()` は分かち書きの境界にゼロ幅スペース（ZWSP）を差し込む。CSS の `word-break: keep-all` と併用すると **その位置でしか折り返さない**。折り返し位置を確認したいだけなら `preview()`（境界を `|` で可視化）や `phrases()`（配列で取得）を使う。

```ts
import { preview } from 'orogami';

preview('東京都渋谷区のスタートアップで働くエンジニアの一日');
// 東京都|渋谷区の|スタートアップで|働く|エンジニアの|一日
```

`lang` は `'ja'`（既定） / `'zh-Hans'` / `'zh-Hant'` に対応。

## OGP画像の生成 ＋ フォント自動サブセット（experimental · `orogami/og`）

Satori + resvg で 1200×630 の OGP 画像を生成し、**そのタイトルに使う字だけにフォントをサブセット**する（可変フォントのウェイト固定も可）。実測で **9.15 MB → 10.6 KB（-99.9%）**。

```bash
# 画像系は optional peer。og を使うときだけ入れる
npm i satori @resvg/resvg-js subset-font
```

```ts
import { subset, renderOgp } from 'orogami/og';
import { readFileSync, writeFileSync } from 'node:fs';

const title = '個人開発したツールが海外の開発者にも届くための日本語OGP設計';
const font = await subset(readFileSync('NotoSansJP.ttf'), title, { weight: 700 });

writeFileSync('ogp.png', await renderOgp(title, { font, wrap: true }));
```

## API

| export | from | 概要 |
| --- | --- | --- |
| `wrap(text, { lang? })` | `orogami` | 文節境界に ZWSP を挿入した文字列を返す |
| `preview(text, { lang? })` | `orogami` | 折り返し位置を `\|` で可視化 |
| `phrases(text, { lang? })` | `orogami` | 文節の配列を返す |
| `subset(font, text, { weight? })` | `orogami/og` | 使う字だけにフォントをサブセット（`Promise<Buffer>`） |
| `renderOgp(title, opts)` | `orogami/og` | OGP画像 PNG を生成（`Promise<Buffer>`） |

`Lang = 'ja' | 'zh-Hans' | 'zh-Hant'`

## ロードマップ

- [x] コア: `wrap()` / `preview()` / `phrases()`（BudouX ja / zh-Hans / zh-Hant）
- [x] OGP画像ヘルパー（Satori + resvg、**フォント自動サブセット -99.9%**）— `orogami/og`（experimental）
- [ ] `<Wrap>` React / Satori コンポーネント
- [ ] **CIリンタ**: 「そのOGPタイトルは汚く折れる」を PR で警告

## Dev

```bash
npm install
npm run build   # tsup -> dist (esm + .d.ts)
npm run demo    # 折り返し位置を | で可視化
npm run render  # .fonts/NotoSansJP.ttf から OGP を生成
```

## Related tools

Zero-dependency CI linters for repos where AI agents do the work. Each one fails the PR on something that breaks quietly.

| | Catches |
| --- | --- |
| [reflint](https://github.com/hyuga611/reflint) | `AGENTS.md` / `llms.txt` / `CLAUDE.md` pointing at commands, scripts, or paths that no longer exist |
| [skills-lint](https://github.com/hyuga611/skills-lint) | `SKILL.md` broken references + `name`/trigger collisions between skills |
| [carrylint](https://github.com/hyuga611/carrylint) | Skills with the author's machine or model baked in — absolute paths, undeclared CLIs, unresolved placeholders |
| [genchi](https://github.com/hyuga611/genchi) | Agents reporting "done" without re-fetching real-world state |
| [tracklint](https://github.com/hyuga611/tracklint) | Forms and CTAs that quietly stopped being wired for conversion tracking |
| [tokenlint](https://github.com/hyuga611/tokenlint) | Hardcoded colors that bypass your design tokens |
| [reflint for VS Code](https://github.com/hyuga611/reflint-vscode) | The same reflint checks, inline in the editor as you save |
| **orogami** ← you are here | Not a linter — natural Japanese/CJK line breaking for OGP images (BudouX + font subsetting) |

MIT © [hyuga611](https://github.com/hyuga611)
