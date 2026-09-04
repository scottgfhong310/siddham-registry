/**
 * verify — siddham-registry 的契約檢查
 *
 * 把「markup ↔ handler」「規則 ↔ 實作」寫成可執行的檢查，比每次改版重點一輪可靠
 * （家族 PLAYBOOK §5：能靜態驗的就別靠點擊）。
 *
 * ⚠️ 本 app 有一條別的家族成員沒有的檢查：**授權**（第 ① ② ③ 條）。
 *    CBETA 悉曇字型沒有再散布的授權，所以它**永遠不得進這個 repo**
 *    （治理 §9.2）。這件事壞掉時畫面完全正常——字型就在那裡、顯示得好好的，
 *    只有授權出問題。所以只能靠檢查釘住，不能靠記得。
 *
 * 用法：
 *   node scripts/verify.js              # 跑全部
 *   node scripts/verify.js --selftest   # 逐條改壞原始碼，確認每條真的抓得到
 *   node scripts/verify.js --selftest 3 # 只跑第 3 條的注入並印出失敗訊息
 * 結束碼：0 全過／1 有不符／2 前提不成立
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'public/apps/siddham-registry');

const read = (p) => fs.readFileSync(path.join(APP, p), 'utf8');
/** 比對 CSS/JS 前先去掉註解——否則檢查會被自己的說明滿足（家族 v1.34／v1.39 的坑） */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let SRC = {};
function load() {
  SRC = {
    css: read('siddham-registry.css'),
    lib: read('siddham-registry-lib.js'),
    ctrl: read('siddham-registry.js'),
    chap: read('chapters.js'),
    probe: read('font-probe.js'),
    detail: read('glyph-detail.js'),
    index: read('index.html'),
    chapters: read('chapters.html'),
    zh: read('locales/zh-Hant.js'),
    en: read('locales/en.js'),
    ja: read('locales/ja.js'),
  };
}

// ── 共用文案的〔正統〕值（DESIGN_GUIDELINES §6，逐字） ──────────────────
const CANON = {
  'tool.lang': ['語言', 'Language', '言語'],
  'tool.mode': ['切換 light / dark', 'Toggle light / dark', 'ライト / ダーク切替'],
  'tool.clearFilter': ['清除', 'Clear', 'クリア'],
  'tool.more': ['更多工具', 'More tools', 'その他のツール'],
  'toast.lang': ['已切換為 {name}', 'Switched to {name}', '{name} に切り替えました'],
  'toast.copied': ['已複製', 'Copied', 'コピーしました'],
};

function keysOf(src) {
  const out = new Set();
  const re = /^\s*'([^']+)':/gm;
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return out;
}
function valueOf(src, key) {
  const re = new RegExp("'" + key.replace(/\./g, '\\.') + "':\\s*((?:'(?:[^'\\\\]|\\\\.)*'\\s*\\+?\\s*)+)");
  const m = src.match(re);
  if (!m) return null;
  return m[1].split(/'\s*\+\s*'/).join('').replace(/^'|'$/g, '').replace(/\\'/g, "'");
}

// ── 檢查 ────────────────────────────────────────────────────────────────
const CHECKS = [];
/** ⚠️ 用 check() 註冊而不是陣列字面——家族的 tools/test-readme-counts.js
 *  以 /^\s*check\(\s*'/ 數條數，寫成陣列它讀不到（會回報「讀不到條數」）。
 *  這不是風格問題：README 寫的條數會因此沒有東西在對。 */
function check(name, fn) { CHECKS.push([name, fn]); }

check('① app 目錄下沒有任何字型檔，除了 fonts/ 內 OFL 的那一支', () => {
    const bad = [];
    const walk = (dir, rel) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name), r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) { walk(p, r); continue; }
        if (!/\.(ttf|otf|woff2?|ttc|dfont)$/i.test(e.name)) continue;
        // 唯一放行：fonts/NotoSansSiddham-Regular.woff2（SIL OFL 1.1，附 OFL.txt）
        if (r === 'fonts/NotoSansSiddham-Regular.woff2') continue;
        bad.push(r);
      }
    };
    walk(APP, '');
    return bad.length ? `不該存在的字型檔：${bad.join(', ')}` : null;
  });

check('② fonts/ 內附有 OFL.txt', () =>
    fs.existsSync(path.join(APP, 'fonts/OFL.txt')) ? null : '缺 fonts/OFL.txt（bundled 字型必須附授權）');

check('③ CbetaSiddam 的 @font-face 只有 local()、沒有 url()', () => {
    const css = stripComments(SRC.css);
    const m = css.match(/@font-face\s*\{[^}]*CbetaSiddam[^}]*\}/);
    if (!m) return '找不到 CbetaSiddam 的 @font-face';
    if (!/src:\s*local\(/.test(m[0])) return '沒有用 local()';
    if (/url\(/.test(m[0])) return '出現 url()——那等於把沒有授權的字型放進 repo';
    return null;
  });

check('④ 字型偵測量像素不量寬度，且自帶對照組', () => {
    const p = stripComments(SRC.probe);
    if (/measureText/.test(p)) return 'font-probe 用了 measureText——載體字元是 CJK，任何字型都恰好 1em，量不出來';
    if (!/getImageData/.test(p)) return '沒有量像素';
    if (!/__no_such_font__/.test(p)) return '沒有對照組（不存在的字型必須與純後備相同）';
    if (!/return null/.test(p)) return '對照組失敗時沒有回 null（不確定就不要給答案）';
    return null;
  });

check('⑤ 兩個控制器都不自帶字型偵測（只有 font-probe 一份實作）', () => {
    for (const [n, s] of [['siddham-registry.js', SRC.ctrl], ['chapters.js', SRC.chap]]) {
      if (/measureText|getImageData/.test(stripComments(s))) return `${n} 自己在偵測字型——應改用 FontProbe`;
      if (!/FontProbe\.applyBodyClass/.test(s)) return `${n} 沒有呼叫 FontProbe.applyBodyClass`;
    }
    return null;
  });

check('⑥ 羅馬轉寫用專屬字型堆疊（ISO 15919 的組合附加符號）', () => {
    const css = stripComments(SRC.css);
    if (!/--latin:/.test(css)) return '沒有定義 --latin';
    const uses = (css.match(/font-family:\s*var\(--latin\)/g) || []).length;
    if (uses !== 4) return `套用處數為 ${uses}，應為 4（.syl-lat／.rev-lat／.d-lat／.cell-lat）`;
    return null;
  });

check('⑦ 章名只放行 <sub>，不是全跳脫也不是全信任', () => {
    const s = stripComments(SRC.chap);
    if (!/function chapterName/.test(s)) return '沒有 chapterName()';
    if (!/&lt;sub&gt;/.test(s)) return '沒有把跳脫後的 &lt;sub&gt; 換回標籤';
    if (!/esc\(raw\)/.test(s)) return '沒有先整段跳脫';
    if (!/chapterName\(g\.chapter\.name\)/.test(s)) return 'chapterName() 沒有被用在章名上';
    return null;
  });

check('⑧ 組字的四種狀態都被消費端分開處理', () => {
    const lib = stripComments(SRC.lib);
    for (const st of ["'none'", "'atomic'", "'composed'"]) {
      if (!lib.includes(st)) return `lib 沒有 ${st} 狀態`;
    }
    const d = stripComments(SRC.detail);
    if (!/state === 'none'/.test(d)) return '明細卡沒有處理 none';
    if (!/state === 'atomic'/.test(d)) return '明細卡沒有把「基本字」與「沒有登錄」講成兩句話';
    if (!/compAtomic/.test(d) || !/compNone/.test(d)) return '缺 compAtomic／compNone 文案';
    return null;
  });

check('⑨ 反查的三種結果各有一種樣子，不併成「找不到」', () => {
    const s = stripComments(SRC.ctrl);
    if (!/reverse\.unknown/.test(s)) return '缺「不在登錄裡」';
    if (!/reverse\.noSyllable/.test(s)) return '缺「本來就沒有音」';
    if (!/rev-cell miss/.test(s) || !/rev-cell nosyl/.test(s)) return '兩種缺席沒有分開的 class';
    return null;
  });

check('⑩ 側鍵 markup 都有對應的 handler（或是真的 <a>）', () => {
    const ids = [...SRC.index.matchAll(/id="(setting-[a-z-]+)"/g)].map((m) => m[1])
      .concat([...SRC.chapters.matchAll(/id="(setting-[a-z-]+)"/g)].map((m) => m[1]));
    const js = SRC.ctrl + SRC.chap;
    const bad = [];
    for (const id of new Set(ids)) {
      const isLink = new RegExp(`<a[^>]*id="${id}"[^>]*href=`).test(SRC.index + SRC.chapters);
      if (isLink) continue;                       // 真的 <a>：不需要 handler（§ app-launcher 那條）
      if (!js.includes(`$('${id}')`)) bad.push(id);
    }
    return bad.length ? `這些側鍵沒有 handler 也不是連結：${bad.join(', ')}` : null;
  });

check('⑪ 三語 key 集合完全相同', () => {
    const z = keysOf(SRC.zh), e = keysOf(SRC.en), j = keysOf(SRC.ja);
    const miss = (a, b, an, bn) => [...a].filter((k) => !b.has(k)).map((k) => `${bn} 缺 ${k}`);
    const bad = [...miss(z, e, 'zh', 'en'), ...miss(z, j, 'zh', 'ja'),
                 ...miss(e, z, 'en', 'zh'), ...miss(j, z, 'ja', 'zh')];
    return bad.length ? bad.slice(0, 6).join('；') : null;
  });

check('⑫ 共用文案逐字等於 DESIGN_GUIDELINES §6 的〔正統〕', () => {
    const bad = [];
    for (const [key, [zh, en, ja]] of Object.entries(CANON)) {
      const got = [valueOf(SRC.zh, key), valueOf(SRC.en, key), valueOf(SRC.ja, key)];
      [zh, en, ja].forEach((want, i) => {
        if (got[i] !== want) bad.push(`${key}[${['zh', 'en', 'ja'][i]}] 實得 ${JSON.stringify(got[i])}、正統 ${JSON.stringify(want)}`);
      });
    }
    return bad.length ? bad.slice(0, 4).join('；') : null;
  });

check('⑬ 資料產物齊備且宣告了欄序', () => {
    const need = ['siddham-meta.js', 'siddham-faces.js', 'siddham-syllables.js',
                  'siddham-glyphs.js', 'siddham-composition.js', 'siddham-chapters.js'];
    const miss = need.filter((f) => !fs.existsSync(path.join(APP, 'data', f)));
    if (miss.length) return `缺產物：${miss.join(', ')}`;
    const g = fs.readFileSync(path.join(APP, 'data/siddham-glyphs.js'), 'utf8');
    // ⚠️ 要比對**完整的賦值**，不是子字串——`/SID_GLYPH_COLS/` 也會命中
    //    被改名成 `SID_GLYPH_COLS_X` 的宣告，於是欄序宣告消失了它照樣是綠的
    //    （--selftest 抓到的，2026-08-17）。
    if (!/window\.SID_GLYPH_COLS\s*=/.test(g)) return 'siddham-glyphs.js 沒有宣告欄序';
    if (!/SiddhamLib.*unpack|unpack\(/.test(SRC.lib)) return 'lib 沒有依欄名解包';
    return null;
});

check('⑭ 原始碼不含 NUL 位元組', () => {
    const bad = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!/\.(js|css|html)$/.test(e.name)) continue;
        if (fs.readFileSync(p).includes(0)) bad.push(path.relative(ROOT, p));
      }
    };
    walk(APP);
    return bad.length ? `含 NUL：${bad.join(', ')}` : null;
  });

/**
 * ⚠️ 這條釘的東西壞掉時**畫面完全正常**：明細卡照樣開得起來、長得對，只有關不掉。
 *    成因是 Materialize 的 init 對同一個元素跑第二次會先 destroy 舊實例（連同它的
 *    click／keydown handler）再建一個新的。GlyphDetail 自己 init 了明細卡，控制器若再
 *    `M.Modal.init(document.querySelectorAll('.modal'))` 掃一次，開卡的就是被丟掉的那一個：
 *    `open()` 只是加 class ＋ 貼 overlay 所以照樣有效，但活著的那個實例 `isOpen` 恆為
 *    false ⇒ 「關閉」／點遮罩／ESC 都在 `close()` 第一行早退。
 *    兩層各擋一半：(a) 控制器不掃全部、(b) 模組不快取實例（換誰來掃都不成立）。
 */
check('⑮ 明細卡的 Modal 實例不會被第二次 init 換掉（換掉了就關不起來）', () => {
    const bad = [];
    // (a) 兩個控制器都不得掃全部 .modal 重新 init
    [['siddham-registry.js', SRC.ctrl], ['chapters.js', SRC.chap]].forEach(([name, src]) => {
      const s = stripComments(src);
      if (/Modal\.init\s*\(\s*document\.querySelectorAll/.test(s)
          || /Modal\.init\s*\([^)]*['"][^'"]*\.modal\b/.test(s)) {
        bad.push(`${name} 掃全部 .modal 重新 init（會 destroy 掉明細卡的實例）`);
      }
    });
    // (b) 明細卡開卡一律走「當下的實例」，不可存成模組變數
    const d = stripComments(SRC.detail);
    if (!/M\.Modal\.getInstance\s*\(/.test(d)) bad.push('glyph-detail 沒有用 M.Modal.getInstance 取當下實例');
    const opens = [...d.matchAll(/([A-Za-z_$][\w$]*)\s*(\(\))?\s*\.open\s*\(\s*\)/g)];
    if (opens.length < 2) bad.push(`glyph-detail 只找到 ${opens.length} 處 open()（應為 openSyllable／openGlyph 各一）`);
    opens.forEach((m) => {
      if (m[2] !== '()' || m[1] !== 'modalInst') bad.push(`glyph-detail 的 ${m[0]} 不是 modalInst().open()`);
    });
    return bad.length ? bad.join('；') : null;
  });


// ⚠️ 第 ⑯ 條是 2026-08-19 補的，而它補的是一個**已經漂了一天沒被發現**的洞：
//    三份 README／`app.js`／`CLAUDE.md`／`DESIGN.md`／控制器與 CSS 的註解裡散著同一組
//    「9,066 字形／6,899 音節／…」，而 **`db_siddham` 每登記一筆修正就可能動到它們**
//    （`ph_u` 那筆讓音節 6,898 → 6,899，順帶讓 `U+0332` 的 25 → 26）。
//    ⚠️ 家族的 `test-readme-counts.js` **照不到本 repo**（它只查五支色彩 registry 與
//    `app-launcher`），所以在此之前**沒有任何東西在擋**。
// ⚠️ 期望值一律**從出貨的產物算**，不從 DB 算：README 描述的是使用者拿到的東西，
//    而 public repo 本來就不連 DB（`--check` 才是「產物 vs DB」那一層）。
check('⑯ 散在文件與註解裡的統計數字，必須等於出貨產物的實數', () => {
    const dataDir = path.join(APP, 'data');
    const w = {};
    for (const f of ['siddham-faces.js', 'siddham-syllables.js', 'siddham-glyphs.js',
                     'siddham-composition.js', 'siddham-chapters.js']) {
      new Function('window', fs.readFileSync(path.join(dataDir, f), 'utf8')).call({}, w);
    }
    const si = Object.fromEntries(w.SID_SYL_COLS.map((c, i) => [c, i]));
    const nComp = w.SID_COMPOSITION.reduce((n, x) => n + (Array.isArray(x) ? x.length : 0), 0);
    // ⚠️ 這是本條唯一「讀不出來會安靜地變成 0」的地方：欄名一改 si.latin 就是 undefined，
    //    於是 (r[undefined] || '') 對每一列都是 ''、下面幾個統計全部歸零，而檢查照樣通過。
    //    ⇒ 錨點要釘在 si.latin 本身，不是釘在它算出來的數字上。
    if (!Number.isInteger(si.latin)) return '產物讀不出 latin 欄（SID_SYL_COLS 的欄名變了？）';
    const mark = (ch) => w.SID_SYLLABLES.filter((r) => (r[si.latin] || '').includes(ch)).length;
    // 結構性計數：**0 就表示產物壞了**
    const real = {
      glyphs: w.SID_GLYPHS.length, syllables: w.SID_SYLLABLES.length,
      comp: nComp, cells: w.SID_CELLS.length,
      faces: w.SID_FACES.length, chapters: w.SID_CHAPTERS.length,
    };
    // 內容性計數：**0 是合法的資料狀態**，不是讀不出來
    const tally = {
      u0310: mark('\u0310'), u0325: mark('\u0325'), u0304: mark('\u0304'), u0332: mark('\u0332'),
      precomposed: w.SID_SYLLABLES.filter((r) => /[ṛṝḷḹ]/.test(r[si.latin] || '')).length,
    };
    // ⚠️ 前提不成立就 FAIL，不可以當成「沒有數字要檢查」而通過（空轉的檢查比沒有檢查更糟）。
    // ⚠️⚠️ 但**前提要分兩種**，而這正是 2026-09-05 修掉的那個 bug：本條原本一律要求 `> 0`，
    //    於是 2026-08-28（家族 v1.99）把 `r`+U+0325 換成預組 ṛ/ṝ/ḷ/ḹ 之後 `u0325` **合法地變成 0**，
    //    守衛在第一個 0 就 return ⇒ **後面那二十幾條「文件 vs 產物」的比對整整 8 天一次都沒跑過**
    //    （期間 syllables 6,900 → 6,874 在 10 處漂掉、沒有任何東西吵；連 --selftest 都因為
    //    「未改壞時必須全綠」這條前提而整支停擺）。
    //    **判準：一道防「空轉」的守衛，不可以把「這個數字真的是 0」也算成空轉。**
    for (const [k, v] of Object.entries(real))  if (!Number.isInteger(v) || v <= 0) return `產物讀不出 ${k}`;
    for (const [k, v] of Object.entries(tally)) if (!Number.isInteger(v))           return `產物讀不出 ${k}`;
    Object.assign(real, tally);

    const grp = (n) => n.toLocaleString('en-US');   // 6899 -> "6,899"
    // [檔案, 這個檔裡該出現的 (正則, 期望值) …]。⚠️ 比對的是**帶千分位的整數**，
    //    不逐句解析語意——三種語言的語序不同，各寫一套解析壞掉時會安靜地比對到錯的位置。
    const targets = [
      ['README.md',        [[/([\d,]+) glyphs/, real.glyphs], [/([\d,]+) syllables/, real.syllables],
                            [/([\d,]+) composition links/, real.comp], [/([\d,]+) chapter cells/, real.cells]]],
      ['README.zh-Hant.md',[[/([\d,]+) 字形/, real.glyphs],
                            // ⚠️ 「個?」不可省：第 15 行寫的是「6,874 **個**音節」，
                            //    少了它那一處**從來沒有被看守過**（2026-09-05 補）。
                            [/([\d,]+) 個?音節/, real.syllables],
                            [/([\d,]+) 個組字關聯/, real.comp], [/([\d,]+) 個章格/, real.cells]]],
      ['README.ja.md',     [[/([\d,]+) 字形/, real.glyphs], [/([\d,]+) 音節/, real.syllables],
                            [/([\d,]+) 組字リンク/, real.comp], [/([\d,]+) 章セル/, real.cells]]],
      ['app.js',           [[/([\d,]+) 個字形/, real.glyphs], [/([\d,]+) 個音節/, real.syllables]]],
      ['CLAUDE.md',        [[/([\d,]+) 個音節是靜態產物/, real.syllables]]],
      // ⚠️ 四個附標**全部**上錨點（原本只有 U+0332）——2026-08-28 那次讓其中三個變成 0，
      //    而沒有錨點的數字漂了也沒有人會知道。預組那個數字同理。
      ['DESIGN.md',        [[/`U\+0310` candrabindu \*\*([\d,]+) 個音節\*\*/, real.u0310],
                            [/`U\+0325` 環下 \*\*([\d,]+)\*\*/, real.u0325],
                            [/`U\+0304` macron \*\*([\d,]+)\*\*/, real.u0304],
                            [/`U\+0332` 底線 \*\*([\d,]+)\*\*/, real.u0332],
                            [/現況 \*\*([\d,]+) 個音節\*\*/, real.precomposed],
                            [/影響 ([\d,]+)\/([\d,]+)/, real.u0310, real.syllables]]],
    ];
    const bad = [];
    for (const [file, pairs] of targets) {
      const p = path.join(ROOT, file);
      if (!fs.existsSync(p)) { bad.push(`${file} 不存在`); continue; }
      const src = fs.readFileSync(p, 'utf8');
      for (const [re, ...want] of pairs) {
        // ⚠️ 比對**每一個**出現處，不是 String.match 的第一個。
        //    實際踩過：README.md 裡「syllables」出現兩次（介紹一次、統計行一次），
        //    只比第一個的話，統計行那個數字**沒有任何東西在看守**——而它正是最會漂的那個。
        const all = [...src.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))];
        // ⚠️ 錨點讀不到要**逐檔報**，不可以因為別的檔過了就算數。
        if (!all.length) { bad.push(`${file}：找不到錨點 ${re}`); continue; }
        all.forEach((m) => want.forEach((v, i) => {
          if (m[i + 1] !== grp(v)) bad.push(`${file}：${m[0]} 應為 ${grp(v)}`);
        }));
      }
    }
    // 控制器與 CSS 的註解裡也各有一份
    const cssRe = [
      [/U\+0310 candrabindu（([\d,]+) 個音節）/, real.u0310],
      [/U\+0325 環下（([\d,]+)）/, real.u0325],
      [/U\+0304 macron（([\d,]+)）/, real.u0304],
      [/U\+0332 底線（([\d,]+)）/, real.u0332],
      [/預組字元 ṛ\/ṝ\/ḷ\/ḹ 書寫（([\d,]+) 個音節）/, real.precomposed],
      [/影響 ([\d,]+)\/([\d,]+) 個音節/, real.u0310, real.syllables],
    ];
    for (const [re, ...want] of cssRe) {
      const all = [...SRC.css.matchAll(new RegExp(re.source, 'g'))];
      if (!all.length) { bad.push(`css：找不到錨點 ${re}`); continue; }
      all.forEach((m) => want.forEach((v, i) => {
        if (m[i + 1] !== grp(v)) bad.push(`css：${m[0]} 應為 ${grp(v)}`);
      }));
    }
    // ⚠️ 這一條刻意比對**未去註解**的原始碼——本條要驗的東西就住在註解裡。
    //    （其餘檢查用 stripComments 是為了不被自己的說明滿足；方向相反，故不共用。）
    const mj = SRC.ctrl.match(/一次貼 ([\d,]+) 張卡/);
    if (!mj) bad.push('控制器：找不到 WALL_LIMIT 註解的錨點');
    else if (mj[1] !== grp(real.syllables)) bad.push(`控制器：${mj[0]} 應為 ${grp(real.syllables)}`);

    return bad.length ? bad.join('；') : null;
  });


// ── selftest：逐條改壞，確認每條真的抓得到 ──────────────────────────────
const SELFTESTS = [
  [1, 'app 目錄放一支沒有授權的字型', () => {
    fs.writeFileSync(path.join(APP, 'Siddam.ttf'), 'x');
    return () => fs.unlinkSync(path.join(APP, 'Siddam.ttf'));
  }],
  [2, '拿掉 OFL.txt', () => {
    const p = path.join(APP, 'fonts/OFL.txt'), b = fs.readFileSync(p);
    fs.unlinkSync(p);
    return () => fs.writeFileSync(p, b);
  }],
  [3, '@font-face 加上 url() 退路', () => patch('siddham-registry.css',
    "src: local('Siddam');", "src: local('Siddam'), url('fonts/Siddam.ttf');")],
  [4, '字型偵測改回量寬度', () => patch('font-probe.js',
    'var d = c.getImageData(0, 0, 80, 80).data, h = 0, i;',
    'var d = [c.measureText(ch).width], h = 0, i;')],
  [4, '拿掉對照組', () => patch('font-probe.js', "__no_such_font__", "serif")],
  [5, '控制器自己偵測字型', () => patch('siddham-registry.js',
    'var fontOk = window.FontProbe.applyBodyClass(ix);',
    'var fontOk = document.createElement("canvas").getContext("2d").measureText("一").width > 0;')],
  [6, '拿掉一處 --latin', () => patch('siddham-registry.css',
    '.cell-lat { color: var(--muted); font-size: .66rem; display: block; font-family: var(--latin); }',
    '.cell-lat { color: var(--muted); font-size: .66rem; display: block; }')],
  [7, '章名改成全跳脫', () => patch('chapters.js',
    "      .replace(/&lt;sub&gt;/g, '<sub>')", "      .replace(/__never__/g, '<sub>')")],
  [8, '明細卡把基本字併進「沒有登錄」', () => patch('glyph-detail.js',
    "if (c.state === 'atomic')", "if (c.state === '__never__')")],
  [9, '反查把兩種缺席併成一種', () => patch('siddham-registry.js',
    "'<div class=\"rev-cell nosyl\">", "'<div class=\"rev-cell miss\">")],
  [10, '側鍵 handler 拿掉', () => patch('siddham-registry.js',
    "$('setting-fonts').addEventListener", "$('setting-XXXX').addEventListener")],
  [11, '刪掉 en 的一個 key', () => patch('locales/en.js',
    "  'mode.wall': 'Syllables',\n", '')],
  [12, '把 tool.lang[ja] 改掉', () => patch('locales/ja.js',
    "'tool.lang': '言語',", "'tool.lang': 'ランゲージ',")],
  [13, '拿掉產物的欄序宣告', () => {
    const p = path.join(APP, 'data/siddham-glyphs.js');
    const b = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, b.replace('window.SID_GLYPH_COLS', 'window.SID_GLYPH_COLS_X'));
    return () => fs.writeFileSync(p, b);
  }],
  [14, '塞一個 NUL 進 CSS', () => {
    const p = path.join(APP, 'siddham-registry.css');
    const b = fs.readFileSync(p);
    fs.writeFileSync(p, Buffer.concat([b, Buffer.from([0])]));
    return () => fs.writeFileSync(p, b);
  }],
  // ⚠️ 這三個注入正是 2026-08-17 那個「卡片關不掉」的三種寫法，缺一不可：
  //    第一個是它當初真正的成因，後兩個是模組自保那一層。
  [15, '控制器改回掃全部 .modal 重新 init', () => patch('siddham-registry.js',
    "window.M.Modal.init($('font-modal'), { endingTop: '6%' });",
    "window.M.Modal.init(document.querySelectorAll('.modal'), { endingTop: '6%' });")],
  [15, '明細卡把實例快取成模組變數', () => patch('glyph-detail.js',
    'render(); modalInst().open(); },', 'render(); modal.open(); },')],
  [15, '明細卡不再問當下的實例', () => patch('glyph-detail.js',
    'return window.M.Modal.getInstance(el) || window.M.Modal.init(el',
    'return window.M.Modal.init(el')],
  // ⚠️ patch() 只改 APP 底下的檔，而第 ⑯ 條有一半的目標在 repo 根（README／app.js／…）——
  //    所以這兩個注入一個打 repo 根、一個打 APP 內的註解，各驗一半。
  [16, 'README 的統計數字過期（repo 根）', () => {
    const p = path.join(ROOT, 'README.md');
    const before = fs.readFileSync(p, 'utf8');
    const after = before.replace(/(9,066 glyphs · )([\d,]+)( syllables)/, '$1' + '1,234' + '$3');
    if (after === before) throw new Error('注入打不中（README.md 的統計行）');
    fs.writeFileSync(p, after);
    return () => fs.writeFileSync(p, before);
  }],
  [16, '控制器註解的字數過期', () => patch('siddham-registry.js',
    /一次貼 [\d,]+ 張卡/, '一次貼 1,234 張卡')],
  // ⚠️ 這一個守的是 2026-09-05 那個 bug 的**反面**：欄名一改，四個附標統計會
  //    **安靜地全部歸零**而檢查照樣通過（舊寫法靠 `> 0` 擋，而那同時把合法的 0 也擋掉了）。
  //    ⇒ 錨點改釘在 si.latin 本身，這個注入證明它真的在擋。
  [16, 'latin 欄名改掉（四個附標統計會安靜地全部歸零）', () => patch('data/siddham-syllables.js',
    '["notation","siddham","latin"]', '["notation","siddham","latinX"]')]
];
// ⚠️ 「合法的 0 必須放行」沒有獨立注入——它由 runner 的「未改壞時必須全綠」那條前提守著
//    （現況 u0325／u0304／u0332 三者都是 0，改回舊守衛就會當場紅）。
//    ⚠️ 代價講明：哪天資料又出現 U+0325，這一層覆蓋就會**安靜地消失**。

/** 改壞一個檔案，回傳還原函式。⚠️ 會先斷言注入真的改到東西——
 *  一個什麼都沒改到的注入，與一條失效的檢查，在輸出上長得一模一樣。 */
function patch(rel, from, to) {
  const p = path.join(APP, rel);
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(from, to);
  if (after === before) {
    throw new Error(`注入打不中（${rel}）：${JSON.stringify(from.slice(0, 48))}`);
  }
  fs.writeFileSync(p, after);
  return () => fs.writeFileSync(p, before);
}

function runChecks() {
  load();
  const fails = [];
  for (const [name, fn] of CHECKS) {
    let msg = null;
    try { msg = fn(); } catch (e) { msg = '例外：' + e.message; }
    if (msg) fails.push([name, msg]);
  }
  return fails;
}

function main() {
  const args = process.argv.slice(2);
  const selftest = args.includes('--selftest');
  const only = selftest ? Number(args[args.indexOf('--selftest') + 1]) || null : null;

  if (!selftest) {
    const fails = runChecks();
    for (const [name] of CHECKS) {
      const f = fails.find((x) => x[0] === name);
      console.log(`  ${f ? '✗' : '✓'} ${name}${f ? '\n      ' + f[1] : ''}`);
    }
    if (fails.length) { console.log(`\n✗ ${fails.length} / ${CHECKS.length} 條不符`); process.exit(1); }
    console.log(`\n✓ ${CHECKS.length} 條全部通過`);
    return;
  }

  // 前提：未改壞時必須全綠——否則「全部抓到」可能只是它本來就在紅
  const base = runChecks();
  if (base.length) {
    console.log('✗ 前提不成立：未改壞的原始碼就有 ' + base.length + ' 條不符');
    base.forEach(([n, m]) => console.log(`    ${n}: ${m}`));
    process.exit(2);
  }
  console.log('✓ 前提：未改壞時 ' + CHECKS.length + ' 條全綠\n');

  let caught = 0, total = 0;
  SELFTESTS.forEach(([idx, desc, mutate], i) => {
    if (only && idx !== only) return;
    total++;
    let restore = null;
    try {
      restore = mutate();
      const fails = runChecks();
      // ⚠️ 這裡本來是一張**寫死的圈碼表**（'①…⑮'），加第 16 條時它靜默失效：
      //    查出 undefined ⇒ startsWith('undefined') 恆 false ⇒ 注入永遠判定「沒抓到」，
      //    **而訊息裡其實已經寫著實際紅的就是那一條**。改成用宣告順序對應，不再有要手動跟著改的表
      //    （家族反覆記載：一條要靠人跟著改的檢查，遲早會被改成讓它閉嘴的那個值）。
      const target = CHECKS[idx - 1];
      if (!target) throw new Error(`selftest 指向第 ${idx} 條，但只有 ${CHECKS.length} 條檢查`);
      const hit = fails.some((f) => f[0] === target[0]);
      console.log(`  ${hit ? '✓' : '✗'} #${i + 1} 第 ${idx} 條 — ${desc}`
        + (hit ? '' : `   ← 沒抓到！實際紅的：${fails.map((f) => f[0].slice(0, 3)).join(',') || '（全綠）'}`));
      if (hit) caught++;
      if (only) fails.forEach(([n, m]) => console.log(`        ${n}\n          ${m}`));
    } catch (e) {
      console.log(`  ✗ #${i + 1} 第 ${idx} 條 — ${desc}   ← ${e.message}`);
    } finally {
      if (restore) restore();
    }
  });
  const after = runChecks();
  console.log(`\n還原後：${after.length ? '✗ 仍有 ' + after.length + ' 條紅' : '✓ 全綠'}`);
  console.log(`${caught} / ${total} 個注入被抓到`);
  if (caught !== total || after.length) process.exit(1);
}

main();
