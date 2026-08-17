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
const CHECKS = [
  ['① app 目錄下沒有任何字型檔，除了 fonts/ 內 OFL 的那一支', () => {
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
  }],

  ['② fonts/ 內附有 OFL.txt', () =>
    fs.existsSync(path.join(APP, 'fonts/OFL.txt')) ? null : '缺 fonts/OFL.txt（bundled 字型必須附授權）'],

  ['③ CbetaSiddam 的 @font-face 只有 local()、沒有 url()', () => {
    const css = stripComments(SRC.css);
    const m = css.match(/@font-face\s*\{[^}]*CbetaSiddam[^}]*\}/);
    if (!m) return '找不到 CbetaSiddam 的 @font-face';
    if (!/src:\s*local\(/.test(m[0])) return '沒有用 local()';
    if (/url\(/.test(m[0])) return '出現 url()——那等於把沒有授權的字型放進 repo';
    return null;
  }],

  ['④ 字型偵測量像素不量寬度，且自帶對照組', () => {
    const p = stripComments(SRC.probe);
    if (/measureText/.test(p)) return 'font-probe 用了 measureText——載體字元是 CJK，任何字型都恰好 1em，量不出來';
    if (!/getImageData/.test(p)) return '沒有量像素';
    if (!/__no_such_font__/.test(p)) return '沒有對照組（不存在的字型必須與純後備相同）';
    if (!/return null/.test(p)) return '對照組失敗時沒有回 null（不確定就不要給答案）';
    return null;
  }],

  ['⑤ 兩個控制器都不自帶字型偵測（只有 font-probe 一份實作）', () => {
    for (const [n, s] of [['siddham-registry.js', SRC.ctrl], ['chapters.js', SRC.chap]]) {
      if (/measureText|getImageData/.test(stripComments(s))) return `${n} 自己在偵測字型——應改用 FontProbe`;
      if (!/FontProbe\.applyBodyClass/.test(s)) return `${n} 沒有呼叫 FontProbe.applyBodyClass`;
    }
    return null;
  }],

  ['⑥ 羅馬轉寫用專屬字型堆疊（ISO 15919 的組合附加符號）', () => {
    const css = stripComments(SRC.css);
    if (!/--latin:/.test(css)) return '沒有定義 --latin';
    const uses = (css.match(/font-family:\s*var\(--latin\)/g) || []).length;
    if (uses !== 4) return `套用處數為 ${uses}，應為 4（.syl-lat／.rev-lat／.d-lat／.cell-lat）`;
    return null;
  }],

  ['⑦ 章名只放行 <sub>，不是全跳脫也不是全信任', () => {
    const s = stripComments(SRC.chap);
    if (!/function chapterName/.test(s)) return '沒有 chapterName()';
    if (!/&lt;sub&gt;/.test(s)) return '沒有把跳脫後的 &lt;sub&gt; 換回標籤';
    if (!/esc\(raw\)/.test(s)) return '沒有先整段跳脫';
    if (!/chapterName\(g\.chapter\.name\)/.test(s)) return 'chapterName() 沒有被用在章名上';
    return null;
  }],

  ['⑧ 組字的四種狀態都被消費端分開處理', () => {
    const lib = stripComments(SRC.lib);
    for (const st of ["'none'", "'atomic'", "'composed'"]) {
      if (!lib.includes(st)) return `lib 沒有 ${st} 狀態`;
    }
    const d = stripComments(SRC.detail);
    if (!/state === 'none'/.test(d)) return '明細卡沒有處理 none';
    if (!/state === 'atomic'/.test(d)) return '明細卡沒有把「基本字」與「沒有登錄」講成兩句話';
    if (!/compAtomic/.test(d) || !/compNone/.test(d)) return '缺 compAtomic／compNone 文案';
    return null;
  }],

  ['⑨ 反查的三種結果各有一種樣子，不併成「找不到」', () => {
    const s = stripComments(SRC.ctrl);
    if (!/reverse\.unknown/.test(s)) return '缺「不在登錄裡」';
    if (!/reverse\.noSyllable/.test(s)) return '缺「本來就沒有音」';
    if (!/rev-cell miss/.test(s) || !/rev-cell nosyl/.test(s)) return '兩種缺席沒有分開的 class';
    return null;
  }],

  ['⑩ 側鍵 markup 都有對應的 handler（或是真的 <a>）', () => {
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
  }],

  ['⑪ 三語 key 集合完全相同', () => {
    const z = keysOf(SRC.zh), e = keysOf(SRC.en), j = keysOf(SRC.ja);
    const miss = (a, b, an, bn) => [...a].filter((k) => !b.has(k)).map((k) => `${bn} 缺 ${k}`);
    const bad = [...miss(z, e, 'zh', 'en'), ...miss(z, j, 'zh', 'ja'),
                 ...miss(e, z, 'en', 'zh'), ...miss(j, z, 'ja', 'zh')];
    return bad.length ? bad.slice(0, 6).join('；') : null;
  }],

  ['⑫ 共用文案逐字等於 DESIGN_GUIDELINES §6 的〔正統〕', () => {
    const bad = [];
    for (const [key, [zh, en, ja]] of Object.entries(CANON)) {
      const got = [valueOf(SRC.zh, key), valueOf(SRC.en, key), valueOf(SRC.ja, key)];
      [zh, en, ja].forEach((want, i) => {
        if (got[i] !== want) bad.push(`${key}[${['zh', 'en', 'ja'][i]}] 實得 ${JSON.stringify(got[i])}、正統 ${JSON.stringify(want)}`);
      });
    }
    return bad.length ? bad.slice(0, 4).join('；') : null;
  }],

  ['⑬ 資料產物齊備且宣告了欄序', () => {
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
  }],

  ['⑭ 原始碼不含 NUL 位元組', () => {
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
  }],
];

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
];

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
      const hit = fails.some((f) => f[0].startsWith(`${'①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭'[idx - 1]}`));
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
