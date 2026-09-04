# siddham-registry

**CBETA 外字**の**書写と組字**を **Unicode Siddham** でつなぐ（対照と逆引き）、および**〈悉曇十八章〉**。

> ⚠️ **外字が主体、Unicode Siddham は連結**であって、対等な二者ではありません。
読み取り専用・バックエンドなし。

Unicode に悉曇が収録される前、悉曇文字はすべて**外字**で書かれていました。台湾では嘉豐出版社が
Big5 の符号順で整理したものが最も早く、のちに [CBETA](https://www.cbeta.org/) が引き継いで
Unicode フォント化・拡張しました。日本には今昔文字鏡が Shift-JIS 順で整理したものがあります。
**同じ悉曇字が、体系ごとに異なる符号位置・異なる文字・異なるフォントになります。**
本アプリが答えるのは：**文献中のこの外字は、どの Unicode Siddham に対応するのか？**

## できること

- **音節一覧** — 6,874 音節。ひとつ開けばその全字形が見えます：`ā` は **21 種**
  （空海・釈智広・《法隆寺貝葉》・ランジャナ・ワルトゥ…）。1 つの unicode 列に最大 **37** 字形。
- **逆引き** — 外字で書かれたテキストを貼り付けると、一文字ずつ Unicode Siddham に対応。
  対応しない文字は印を付け、**「登録にない」と「この字形は元々読みがない」を区別**します。
- **悉曇十八章** — 1 章 12 列、各セルに組字を常時表示。
- 検索は記法・ローマ字・悉曇・外字・Big5 コードすべてに効きます。
- 三言語（zh-Hant / en / ja）、ライト／ダーク。

## データ

9,066 字形 · 6,874 音節 · 26,532 組字リンク · 6,442 章セル · 43 字体 · 18 章
——`db_siddham` から静的 JS として書き出したもの。**生成物であり、手で編集しません。**

ローマ字は **ISO 15919**。記法は [bonji](https://github.com/scottgfhong310/bonji) と同一
（vendored [mandel59/bonji-input](https://github.com/mandel59/bonji-input)）。

## ⚠️ フォント

**CBETA 悉曇フォントは本アプリに同梱していません**——再配布の許諾がないためです
（フォント内に著作権・商標・ライセンスの記載がなく、CBETA のダウンロードページにも
当該ファイルの条項がありません）。
[CBETA のダウンロードページ](https://archive2.cbeta.org/download/cbreader.php)から取得し、
システムフォントとしてインストールしてください。アプリは
`@font-face { src: local('Siddam') }` でお使いの版を読み、見つからなければその旨を表示します。

Unicode Siddham の表示には影響しません——**Noto Sans Siddham**（SIL OFL 1.1）を同梱しており、
データが使う 75 個の悉曇符号位置をすべて含みます。

詳しい理由は [DESIGN.md](./DESIGN.md) §1。

## 実行

```bash
npm install && npm start        # http://localhost:3000/apps/siddham-registry/
npm run verify                  # 15 件の契約チェック
```

本アプリは **nodeapp WebApp ファミリー**の一員です——
[共通ガイドライン](https://github.com/scottgfhong310/nodeapp-webapp-family)。
本アプリ固有の設計判断は [DESIGN.md](./DESIGN.md)。

[English](./README.md) ｜ [繁體中文](./README.zh-Hant.md)

## ライセンス

MIT © 2026 [Scott G.F. Hong](https://github.com/scottgfhong310)。
**Noto Sans Siddham**（SIL OFL 1.1）を同梱：
[fonts/OFL.txt](./public/apps/siddham-registry/fonts/OFL.txt)。
字形データは CBETA の悉曇整理に由来します。
