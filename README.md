# siddham-registry

The **writings and composition** of the **CBETA private-use Siddhaṁ glyphs**, linked by
**Unicode Siddham** (cross-reference and reverse lookup), plus the **Eighteen Chapters of
Siddhaṁ** (悉曇十八章). Read-only, zero backend.

> ⚠️ **The private-use glyphs are the subject; Unicode Siddham is the link** — not two equal
> sides. That glyph set carries the evolution of Siddhaṁ writing (palm-leaf manuscripts,
> Kūkai, Rañjanā, Wartu…), and its composition data makes the meaning legible; Unicode
> Siddham's value is letting the same sound point across systems.

Before Unicode had a Siddham block, Siddhaṁ was written with *private-use glyphs*: in Taiwan
the earliest set came from 嘉豐出版社, ordered by Big5 code and later carried on and extended by
[CBETA](https://www.cbeta.org/); Japan has 今昔文字鏡 ordered by Shift-JIS. **The same Siddhaṁ
letter is a different code point, a different character and a different font in each system.**
This app answers: *what Unicode Siddham does this private-use glyph correspond to?*

## What it does

- **Syllable wall** — 6,900 syllables. Open one to see every way it is written:
  `ā` has **21 writings** across Kūkai, Zhiguang, the Hōryū-ji palm-leaf manuscript, Rañjana,
  Wartu and more. One Unicode Siddham string maps to as many as **37** glyphs.
- **Reverse lookup** — paste text written with private-use glyphs, get Unicode Siddham back,
  character by character. Unmatched characters are marked, and *not in the registry* is
  distinguished from *this glyph has no reading by nature*.
- **The Eighteen Chapters** — 12 columns per chapter, every cell showing its composition.
- Search across notation, Latin, Siddhaṁ, carrier character and Big5 code.
- Three languages (zh-Hant / en / ja), light & dark.

## Data

9,066 glyphs · 6,900 syllables · 26,532 composition links · 6,442 chapter cells ·
43 faces · 18 chapters — exported from `db_siddham` as static JS. The products are
**generated, not hand-edited**.

Romanisation is **ISO 15919**. The notation is the same one used by
[bonji](https://github.com/scottgfhong310/bonji) (vendored
[mandel59/bonji-input](https://github.com/mandel59/bonji-input)).

## ⚠️ Fonts

**The CBETA Siddhaṁ font is not shipped with this app** — it carries no redistribution licence
(the font declares no copyright, trademark or licence, and CBETA's download page states no terms).
Install it yourself from the [CBETA download page](https://archive2.cbeta.org/download/cbreader.php);
the app reads your installed copy via `@font-face { src: local('Siddam') }` and tells you if it
cannot find it.

Unicode Siddham display is unaffected — **Noto Sans Siddham** (SIL OFL 1.1) is bundled and covers
all 75 Siddham code points used by the data.

See [DESIGN.md](./DESIGN.md) §1 for the full reasoning.

## Run

```bash
npm install && npm start        # http://localhost:3000/apps/siddham-registry/
npm run verify                  # 15 contract checks
```

## Structure

```
app.js · scripts/verify.js
public/apps/siddham-registry/
├─ index.html · chapters.html                    # two pages
├─ siddham-registry.css · .js · chapters.js      # styles · controllers
├─ siddham-registry-lib.js                       # pure core (no DOM)
├─ glyph-detail.js · font-probe.js               # shared across both pages
├─ data/siddham-*.js                             # exported from db_siddham
└─ fonts/ · i18n.js · locales/ · side-tool.* · materialize-dark.css
```

Part of the **nodeapp WebApp family** —
[shared guidelines](https://github.com/scottgfhong310/nodeapp-webapp-family).
Design decisions specific to this app: [DESIGN.md](./DESIGN.md).

[繁體中文](./README.zh-Hant.md) ｜ [日本語](./README.ja.md)

## License

MIT © 2026 [Scott G.F. Hong](https://github.com/scottgfhong310).
Bundles **Noto Sans Siddham** (SIL OFL 1.1) — see [fonts/OFL.txt](./public/apps/siddham-registry/fonts/OFL.txt).
Glyph data derives from CBETA's Siddhaṁ compilation.
