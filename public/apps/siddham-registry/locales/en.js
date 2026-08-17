/* siddham-registry — English
 * Shared strings (tool.* / toast.*) copied verbatim from the family
 * DESIGN_GUIDELINES §6 canonical table. Data names go through the other
 * channel (data/*.js), never this dictionary (§6.1). */
I18n.register('en', {
  // ── shared (§6 canonical table, verbatim) ───────────────────────
  'tool.lang': 'Language',
  'tool.mode': 'Toggle light / dark',
  'tool.clearFilter': 'Clear',
  'tool.more': 'More tools',
  'toast.lang': 'Switched to {name}',
  'toast.copied': 'Copied',

  // ── this app ────────────────────────────────────────────────────
  'title.page': 'Siddhaṁ Registry',
  'app.title': 'Siddhaṁ Registry',
  'app.sub': 'CBETA private-use glyphs ↔ Unicode Siddham',
  'search.placeholder': 'notation / Latin / Siddhaṁ / glyph / Big5…',

  'mode.wall': 'Syllables',
  'mode.reverse': 'Reverse lookup',
  'wall.writings': '{n} writings',
  'count.total': '{n} syllables',
  'count.shown': 'showing {n} / {total} syllables',

  'reverse.placeholder': 'Paste text written with CBETA private-use glyphs…',
  'reverse.hint': 'Paste Siddhaṁ written with private-use glyphs and get Unicode Siddham back, '
    + 'character by character.<br>Unmatched characters are marked — <b>unmatched is not the same '
    + 'as wrong</b>: it may not be a private-use glyph at all, or it may be in the registry but '
    + 'have no reading by nature.',
  'reverse.unknown': 'not in registry',
  'reverse.noSyllable': 'this glyph has no reading',
  'reverse.count': '{n} / {total} characters matched',

  'tool.chapters': 'The Eighteen Chapters',
  'tool.fonts': 'About the fonts',
  'font.title': 'Fonts',
  'font.notice': 'The <b>CBETA Siddhaṁ font (Siddam)</b> was not detected — private-use glyphs '
    + 'will render as tofu. That font <b>carries no redistribution licence, so it is not shipped '
    + 'with this app</b>. Get it from the '
    + '<a href="https://archive2.cbeta.org/download/cbreader.php" target="_blank" rel="noopener">'
    + 'CBETA download page</a> and install it as a system font. '
    + '(Unicode Siddham display is unaffected.)',
  'font.bundled': 'shipped with this app',
  'font.local': 'read from your installed copy',
  'font.notInstalled': 'not installed locally',
  'font.noLicense': 'no licence declared',
  'font.why': 'Only fonts under the SIL OFL are shipped with this app. The CBETA private-use font '
    + 'declares no licence terms, so it is only read via local().',

  'detail.close': 'Close',
  'detail.thisGlyph': 'This glyph',
  'detail.carrier': 'Carrier character',
  'detail.code': 'Big5 code',
  'detail.face': 'Face / calligrapher',
  'detail.syllable': 'Syllable',
  'detail.noSyllable': 'This glyph has no syllable by nature (group / stroke order / mantra wheel / '
    + 'punctuation) — it is not "not mapped yet".',
  'detail.writings': '{n} writings of this syllable',
  'detail.composition': 'Composition',
  'detail.compNone': 'The source records no composition for this glyph.',
  'detail.compAtomic': 'Base glyph — the source says it decomposes to itself.',
  'detail.compPlaceholder': 'empty slot marked 〇 in the source',
  'detail.chapter': 'The Eighteen Chapters',
  'detail.chapterPos': 'Position',
  'detail.chapterAt': 'Chapter {ch}, row {row}, column {col}',
  'detail.copySiddham': 'Siddhaṁ',
  'detail.copyNotation': 'Notation',
  'detail.copyLatin': 'Latin',
  'detail.copyCodepoints': 'Code points',
  'toast.copyFail': 'Copy failed',
  'toast.emptyField': 'This field is empty',

  'chapters.title': 'The Eighteen Chapters',
  'chapters.sub': '12 columns per chapter; click any cell for its composition and other writings',
  'chapters.chapter': 'Chapter {n}',
  'chapters.cells': '{n} cells',
  'chapters.declaredMismatch': '⚠️ The source declares {declared} cells but there are {actual} — '
    + 'both values kept, neither corrected.',
  'chapters.back': 'Back to registry',
}, 'English');
