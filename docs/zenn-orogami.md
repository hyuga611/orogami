---
title: "日本語OGPの折り返し、汚くないですか？ BudouXで直して、ついでにフォントを99.9%削った"
emoji: "🎴"
type: "tech"
topics: ["ogp", "budoux", "satori", "typescript", "個人開発"]
published: false
---

## 日本語OGP、こう折れてませんか

`@vercel/og` や `astro-og-canvas` で作った日本語のOGP画像。長いタイトルが、こうなってませんか。

![before: 開発者にも が途中で割れている](/images/before.png)

`開発者` と `にも` の間で割れています。日本語（CJK）はデフォルトで **文字単位** で折り返されるので、こういう不自然な改行が起きます。英語なら単語の空白で折れるところが、日本語には空白が無いからです。

これを、こう直したい。

![after: 文節の境界だけで折り返す](/images/after.png)

同じ幅・同じフォントサイズでも、**文節の境界でだけ** 折り返せば読みやすくなります。`開発者にも` はひとかたまりのまま。

## どうやるか：BudouX で文節を出す

Google の [BudouX](https://github.com/google/budoux) は、機械学習で日本語（中国語・韓国語・タイ語も）の「ここで折り返してよい」境界を出してくれる軽量ライブラリ（15KB・WASM可）です。

```ts
import { loadDefaultJapaneseParser } from "budoux";
const parser = loadDefaultJapaneseParser();
parser.parse("開発者にも届くための日本語OGP設計");
// => ["開発者にも", "届く", "ための", "日本語OGP設計"]
```

あとは、この文節を1つずつ `span` にして flex-wrap で並べるだけ。文節の途中では折れず、可視の隙間も出ません（`word-break: keep-all` や ZWSP に頼るより、Satori では確実でした）。

## おまけ：フォントを 9.15MB → 10.6KB に

日本語OGPのもう一つの壁がフォントの重さ。Noto Sans JP は約9MBあり、そのままではエッジ（Cloudflare Workers 等）のバンドル上限に載りません。

でもOGP1枚が使う文字はせいぜい数十字。[subset-font](https://github.com/papandreou/subset-font)（harfbuzz）で、その画像で使うグリフだけへサブセットすれば十分です。

```
full font  : 9.15 MB
subset     : 10.6 KB  (-99.9%)
```

可変フォントなら `variationAxes: { wght: 700 }` でウェイトも固定して静的化できます。これで Satori に渡す実データは数十KBに収まります。

## 使い方

既存の `@vercel/og` にそのまま寄生させるなら、タイトルを `wrap()` で包むだけ。

```ts
import { wrap } from "orogami";

<div style={{ wordBreak: "keep-all" }}>
  {wrap("個人開発したツールが海外でもバズる方法")}
</div>
```

画像まで一気に出すなら `renderOgp()`（Satori + resvg + 自動サブセット込み）。

```ts
import { renderOgp, subset } from "orogami/og";

const small = await subset(fullFont, title, { weight: 700 });
const png = await renderOgp(title, { font: small });
```

## まだ scaffold です

コア（`wrap` / OGP生成 / サブセット）は動いていますが、`<Wrap>` コンポーネントや「そのOGPタイトル、汚く折れますよ」を知らせる CI リンタはこれから。GitHub で作っていきます。フィードバック歓迎です。

- リポジトリ: （GitHub URL）

---

*This is a scaffold. Feedback welcome — a drop-in `<Wrap>` for @vercel/og that breaks Japanese/CJK titles at natural phrase boundaries, plus auto font-subsetting.*
