/* siddham-registry — 日本語
 * 共通文言（tool.* / toast.*）は家族 DESIGN_GUIDELINES §6 の〔正統〕表から逐語コピー。
 * データの名前（字体名・章名・悉曇字）は別チャネル（data/*.js）で、この辞書には入れない（§6.1）。 */
I18n.register('ja', {
  // ── 共通（§6 正統表、逐語）──────────────────────────────────────
  'tool.lang': '言語',
  'tool.mode': 'ライト / ダーク切替',
  'tool.clearFilter': 'クリア',
  'tool.more': 'その他のツール',
  'toast.lang': '{name} に切り替えました',
  'toast.copied': 'コピーしました',

  // ── 本アプリ ────────────────────────────────────────────────────
  'title.page': '悉曇文字対照',
  'app.title': '悉曇文字対照',
  'app.sub': 'CBETA 外字 ↔ Unicode Siddham',
  'search.placeholder': '記法 / ローマ字 / 悉曇 / 外字 / Big5…',

  'mode.wall': '音節一覧',
  'mode.reverse': '逆引き',
  'wall.writings': '{n} 種の字形',
  'count.total': '全 {n} 音節',
  'count.shown': '{n} / {total} 音節を表示',

  'reverse.placeholder': 'CBETA 外字で書かれたテキストを貼り付け…',
  'reverse.hint': '文献中の外字で書かれた悉曇を貼り付けると、一文字ずつ Unicode Siddham に'
    + '対応させます。<br>対応しなかった文字は印を付けます——<b>対応しない＝誤りではありません</b>。'
    + 'そもそも外字でない場合も、登録にはあるが元々読みを持たない場合もあります。',
  'reverse.unknown': '登録にありません',
  'reverse.noSyllable': 'この字形は元々読みがありません',
  'reverse.count': '{n} / {total} 文字が対応',

  'tool.chapters': '悉曇十八章',
  'tool.fonts': 'フォントについて',
  'font.title': 'フォント',
  'font.notice': '<b>CBETA 悉曇フォント（Siddam）</b>が検出されませんでした。外字は豆腐で表示されます。'
    + 'このフォントは<b>再配布の許諾がないため本アプリには同梱していません</b>。'
    + '<a href="https://archive2.cbeta.org/download/cbreader.php" target="_blank" rel="noopener">'
    + 'CBETA のダウンロードページ</a>から取得し、システムフォントとしてインストールしてください。'
    + '（Unicode Siddham の表示には影響しません。）',
  'font.bundled': '本アプリに同梱',
  'font.local': 'ローカルにインストール済みのものを使用',
  'font.notInstalled': 'ローカル未インストール',
  'font.noLicense': 'ライセンス表記なし',
  'font.version': 'バージョン {v}',
  // ⚠️ zh-Hant 参照：{v} は本アプリが登録しているバージョンで、インストール済みのものではない。
  'font.versionRegistered': '登録バージョン {v}（同名のビルドが複数あり、'
    + 'インストール済みのものは本ページからは判別できません）',
  'font.why': 'SIL OFL のフォントのみ本アプリに同梱しています。CBETA 外字フォントはライセンス条項を'
    + '表明していないため、local() でのみ読み込みます。',

  'detail.close': '閉じる',
  'detail.thisGlyph': 'この字形',
  'detail.carrier': '担体文字',
  'detail.code': 'Big5 コード',
  'detail.face': '字体・書家',
  'detail.syllable': '音節',
  'detail.noSyllable': 'この字形は元々対応する音節がありません（グループ／筆順／咒輪／文章記号）。'
    + '「未対応」ではありません。',
  'detail.writings': 'この音節の {n} 種の字形',
  'detail.composition': '組字',
  'detail.compNone': '出典にこの字の組字は登録されていません。',
  'detail.compAtomic': '基本字——出典は自分自身までで分解が止まるとしています。',
  'detail.compPlaceholder': 'ここに組件がありますが、登録に指名できる字形がありません（出典は 〇 と表記）',
  'detail.chapter': '悉曇十八章',
  'detail.chapterPos': '位置',
  'detail.chapterAt': '第 {ch} 章 第 {row} 行 第 {col} 列',
  'detail.copySiddham': '悉曇',
  'detail.copyNotation': '記法',
  'detail.copyLatin': 'ローマ字',
  'detail.copyCodepoints': 'コードポイント',
  'toast.copyFail': 'コピーに失敗しました',
  'toast.emptyField': 'この項目は空です',

  'chapters.title': '悉曇十八章',
  'chapters.sub': '1 章 12 列。各セルをクリックすると組字と他の字形が見られます',
  'chapters.chapter': '第 {n} 章',
  'chapters.cells': '{n} セル',
  'chapters.declaredMismatch': '⚠️ 出典は {declared} セルとしていますが実際は {actual} セルです——'
    + '両方の数値を保持し、いずれも修正していません。',
  'chapters.back': '字形対照へ戻る',
}, '日本語');
