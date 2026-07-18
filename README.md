# orogami 折紙

**日本語(CJK)のタイトルを、いちばん自然な位置で折り返す。** BudouX の分かち書き＋禁則を、既存の OGP 生成（`@vercel/og` / Satori）に **1行で寄生**させるためのユーティリティ。

> Wrap Japanese / CJK titles at natural phrase boundaries — a drop-in for `@vercel/og` and Satori. No new framework to adopt.

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

`wrap()` は分かち書きの境界にゼロ幅スペースを差し込む。CSS の `word-break: keep-all` と併用すると **その位置でしか折り返さない**。

## ロードマップ

- [x] コア: `wrap()` / `preview()`（BudouX ja / zh-Hans / zh-Hant）— `src/index.ts`
- [ ] `<Wrap>` React / Satori コンポーネント
- [ ] OGP画像ヘルパー（Satori + resvg、**フォント自動サブセット**）— `src/og.ts`（未検証）
- [ ] **CIリンタ**: 「そのOGPタイトルは汚く折れる」を警告 ← 反復接触＝定着の要

## Dev

```bash
npm install
npm run demo   # 折り返し位置を ｜ で可視化
```

MIT
