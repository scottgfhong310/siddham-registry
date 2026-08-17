/* siddham-registry — 繁體中文（預設語言）
 * 共用文案（tool.* / toast.*）逐字抄自家族 DESIGN_GUIDELINES §6 的〔正統〕表格。
 * 資料的名字（face 名、章名、悉曇字）走另一條通道（data/*.js），不進本字典（§6.1）。 */
I18n.register('zh-Hant', {
  // ── 共用（§6 正統表，逐字抄）────────────────────────────────────
  'tool.lang': '語言',
  'tool.mode': '切換 light / dark',
  'tool.clearFilter': '清除',
  'tool.more': '更多工具',
  'toast.lang': '已切換為 {name}',
  'toast.copied': '已複製',

  // ── 本 app ──────────────────────────────────────────────────────
  'title.page': '悉曇文字對照',
  'app.title': '悉曇文字對照',
  'app.sub': 'CBETA 造字 ↔ Unicode Siddham',
  'search.placeholder': '記法 / 羅馬 / 悉曇 / 造字 / Big5…',

  'mode.wall': '音節牆',
  'mode.reverse': '反查',
  'wall.writings': '{n} 種寫法',
  'count.total': '共 {n} 個音節',
  'count.shown': '顯示 {n} / {total} 個音節',

  'reverse.placeholder': '貼上用 CBETA 造字寫成的文字…',
  'reverse.hint': '把文獻裡用造字寫成的悉曇貼進來，逐字對回 Unicode Siddham。'
    + '<br>對不到的字會標出來——<b>對不到不等於錯</b>，可能它根本不是造字，'
    + '也可能它在登錄裡但本來就沒有讀音。',
  'reverse.unknown': '不在登錄裡',
  'reverse.noSyllable': '此字形本來就沒有音',
  'reverse.count': '{n} / {total} 字對到音節',

  // 字型（治理 §9.2：CBETA 字型沒有散布授權，不隨本 repo 出去）
  'tool.chapters': '悉曇十八章',
  'tool.fonts': '字型說明',
  'font.title': '字型',
  'font.notice': '尚未偵測到 <b>CBETA 悉曇字型（Siddam）</b>，造字會顯示成缺字方塊。'
    + '這支字型<b>沒有再散布的授權，所以不隨本 app 提供</b>——'
    + '請自 <a href="https://archive2.cbeta.org/download/cbreader.php" target="_blank" rel="noopener">'
    + 'CBETA 下載頁</a>取得並安裝到系統字型。'
    + '（Unicode Siddham 的顯示不受影響。）',
  'font.bundled': '隨本 app 提供',
  'font.local': '讀本機已安裝的版本',
  'font.notInstalled': '本機未安裝',
  'font.noLicense': '未宣告授權',
  'font.why': '只有 SIL OFL 授權的字型隨本 app 散布。CBETA 造字字型未宣告授權條款，'
    + '故僅以 local() 讀取本機安裝的版本。',

  // 明細卡
  'detail.close': '關閉',
  'detail.thisGlyph': '這個字形',
  'detail.carrier': '載體字元',
  'detail.code': 'Big5 碼',
  'detail.face': '字體／書家',
  'detail.syllable': '音節',
  'detail.noSyllable': '此字形本來就沒有對應的音節（群組／筆畫順序／咒輪／文章記號），'
    + '不是「還沒對應」。',
  'detail.writings': '這個音節的 {n} 種寫法',
  'detail.composition': '組字',
  'detail.compNone': '來源沒有登錄這個字的組字。',
  'detail.compAtomic': '基本字——來源說它拆到自己為止。',
  'detail.compPlaceholder': '來源以 〇 標示的空位',
  'detail.chapter': '悉曇十八章',
  'detail.chapterPos': '位置',
  'detail.chapterAt': '第 {ch} 章 第 {row} 列 第 {col} 欄',
  'detail.copySiddham': '悉曇',
  'detail.copyNotation': '記法',
  'detail.copyLatin': '羅馬',
  'detail.copyCodepoints': '碼位',
  'toast.copyFail': '複製失敗',
  'toast.emptyField': '這一欄沒有內容',

  // 十八章頁
  'chapters.title': '悉曇十八章',
  'chapters.sub': '一章 12 欄；點任一格看它的組字與其他寫法',
  'chapters.chapter': '第 {n} 章',
  'chapters.cells': '{n} 格',
  'chapters.declaredMismatch': '⚠️ 來源宣稱 {declared} 格，實際 {actual} 格——'
    + '兩個數字都保留、未修正。',
  'chapters.back': '回字形對照',
}, '繁體中文');
