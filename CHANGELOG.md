# Changelog

## 0.2.0

README が勧めていた書き方が、**Satori では効かなかった。** 公開版を実際に Satori に通して
折り返し位置を読み出して分かった。

### `wrap()` + `word-break: keep-all` は Satori では効かない

README のトップに置いていた「寄生モード」がこれだった：

```tsx
<div style={{ wordBreak: 'keep-all' }}>{wrap(title)}</div>
```

そして「CSS の `word-break: keep-all` と併用すると**その位置でしか折り返さない**」と書いていた。
**ブラウザではその通り。Satori では違う。**

Satori は `keep-all` を指定されると `Intl.Segmenter` の word 境界で切る。ZWSP を
「ここで折れ」という指定としては見ない。タイトル5本 × 幅5種＝25通りの実測：

| 書き方 | 文節境界で折れた | 文節の途中で割れた |
| --- | --- | --- |
| `wrap()` + `wordBreak: 'keep-all'`（旧README） | 7 | **18** |
| `wrap()` だけ | 0 | 25 |
| orogami を使わない | 2 | 23 |
| 文節を1つずつ flex アイテムにする | **23** | 2 |

`個人開発したツール / が海外の開発者に`、`決めておくべき / こと` のように、
**このパッケージが防ぐために存在する割れ方をしていた。**

**修正:** README を「ブラウザ」と「Satori」の2節に分けた。Satori 側は flex アイテム方式を
示す。`renderOgp()` は 0.1.0 から内部でこれを使っていたので、**自分のコードは正しくて、
README だけが間違っていた**ことになる。

実測は `npm run breaks`（`examples/satori-breaks.ts`）で再現できる。表を信じる必要はない。

### 可変フォントを `renderOgp()` に渡すと、意味の分からないエラーで落ちていた

```
TypeError: Cannot read properties of undefined (reading '265')
    at parseFvarAxis (.../opentype.js:10285:25)
```

Satori の opentype パーサが `fvar` テーブルで落ちる。スタックは全部 opentype.js の中で、
「可変フォント」とも「どうすればいいか」とも書いていない。README がダウンロードを勧めている
Noto Sans JP がまさに可変フォントなので、**素直にそのまま渡した人だけがここに落ちる。**
README の例は先に `subset()` していて、それが結果的にウェイトを固定して軸を落とすので通る。

`fvar` の有無を見て、`subset()` を使えと言うエラーにした。判定は `isVariableFont()` として
export してあり、テストは実フォントではなくテーブルディレクトリを組み立てて行う
（`.fonts/` は gitignore なので、実フォントに依存するテストは CI で黙って走らなくなる）。

### その他

- 冒頭の「1行で寄生」を取り下げた。ブラウザでは1行だが、Satori では2行で、
  **書き方そのものが違う。**
