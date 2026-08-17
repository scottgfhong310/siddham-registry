/**
 * siddham-registry-lib — 悉曇造字對照的純核心
 *
 * 用途：把 data/*.js 的匯出產物組成可查詢的索引，並提供反查／搜尋／組字拆解／
 *       十八章格子四組運算。**純邏輯、不碰 DOM、零依賴**（家族 DESIGN_GUIDELINES §4.2）。
 *
 * 資料來源：public/apps/siddham-registry/data/*.js，由 db_siddham 匯出
 *          （My Projects/Siddham/export/s4-export.js）。**產物是生成物，不手改。**
 *
 * ⚠️ 一律依產物自己宣告的 `SID_*_COLS` 解包，不寫死欄位位置——
 *    否則匯出器的欄序一改，這裡就靜默錯位（產物那邊的紀律 2 的消費端）。
 *
 * ⚠️ 三種「沒有」在本 app 裡意思不同，不可混用（治理 §5 規則 11）：
 *      glyph.syl === null          這個字形本來就沒有音（群組／筆順／咒輪／文章記號）
 *      composition[i] === null     來源沒有登錄組字
 *      composition[i] 含 -1        來源以 〇 標示：那裡**有**組件，只是登錄裡沒有可指名的字形
 *    ⚠️ 另有第四種，而它最容易被寫錯：`composition[i] === [i]`（組件就是自己）
 *      ＝**基本字**，來源說它拆到自己為止。把它顯示成「一個組件的組字」是錯的。
 *
 * Public API：
 *   SiddhamLib.build(win)                → index（下面所有函式的第一個參數）
 *   SiddhamLib.glyph(ix, i)              → { char, code, face, syl }
 *   SiddhamLib.syllableOf(ix, i)         → { notation, siddham, latin } | null
 *   SiddhamLib.writingsOf(ix, sylIdx)    → 該音節的所有字形索引（多對一的那個「多」）
 *   SiddhamLib.compositionOf(ix, i)      → { state, parts }
 *   SiddhamLib.reverseLookup(ix, text)   → 逐字元對回 unicode siddham
 *   SiddhamLib.search(ix, q, limit)      → 音節索引陣列
 *   SiddhamLib.chapterGrid(ix, no)       → { chapter, rows: [[cell|null …12] …] }
 *   SiddhamLib.codepoints(str)           → 'U+11595 U+115B2'
 */
(function (window) {
  'use strict';

  /** 依欄名解包一列 */
  function unpack(cols, row) {
    var o = {}, i;
    for (i = 0; i < cols.length; i++) o[cols[i]] = row[i];
    return o;
  }

  /**
   * 碼位字串。⚠️ 不可用 lpad/padStart 固定 4 位——悉曇碼位是 5 位十六進位，
   * 補零函式在字串較長時的行為（截斷或不動）會讓 U+11595 變成看起來仍然合法的 U+1159。
   * 只在 BMP 內補零。
   */
  function codepoints(str) {
    var out = [], cp;
    for (var ch of String(str)) {
      cp = ch.codePointAt(0);
      out.push('U+' + (cp < 0x10000
        ? cp.toString(16).toUpperCase().padStart(4, '0')
        : cp.toString(16).toUpperCase()));
    }
    return out.join(' ');
  }

  /** 由 window 上的匯出產物組索引。缺任何一份就丟例外，不要半套跑下去。 */
  function build(win) {
    var need = ['SID_GLYPHS', 'SID_GLYPH_COLS', 'SID_SYLLABLES', 'SID_SYL_COLS',
                'SID_FACES', 'SID_FACE_COLS', 'SID_COMPOSITION', 'SID_META', 'SID_FONTS'];
    for (var k = 0; k < need.length; k++) {
      if (!win[need[k]]) throw new Error('缺少資料產物：' + need[k]);
    }

    var ix = {
      meta: win.SID_META,
      fonts: win.SID_FONTS,
      glyphCols: win.SID_GLYPH_COLS,
      sylCols: win.SID_SYL_COLS,
      faceCols: win.SID_FACE_COLS,
      cellCols: win.SID_CELL_COLS || null,
      glyphs: win.SID_GLYPHS,
      syllables: win.SID_SYLLABLES,
      faces: win.SID_FACES,
      composition: win.SID_COMPOSITION,
      chapters: win.SID_CHAPTERS || null,
      cells: win.SID_CELLS || null,
      byChar: new Map(),
      bySyllable: new Map(),
      faceByCode: new Map(),
    };

    if (ix.composition.length !== ix.glyphs.length) {
      throw new Error('SID_COMPOSITION 與 SID_GLYPHS 不等長——產物不一致，請重跑匯出器');
    }

    var i, g;
    for (i = 0; i < ix.faces.length; i++) {
      var f = unpack(ix.faceCols, ix.faces[i]);
      ix.faceByCode.set(f.code, f);
    }
    for (i = 0; i < ix.glyphs.length; i++) {
      g = unpack(ix.glyphCols, ix.glyphs[i]);
      ix.byChar.set(g.char, i);
      if (g.syl !== null) {
        if (!ix.bySyllable.has(g.syl)) ix.bySyllable.set(g.syl, []);
        ix.bySyllable.get(g.syl).push(i);
      }
    }
    return ix;
  }

  function glyph(ix, i) {
    if (i == null || i < 0 || i >= ix.glyphs.length) return null;
    var g = unpack(ix.glyphCols, ix.glyphs[i]);
    g.index = i;
    g.faceInfo = ix.faceByCode.get(g.face) || null;
    return g;
  }

  function syllableOf(ix, i) {
    if (i == null || i < 0 || i >= ix.syllables.length) return null;
    var s = unpack(ix.sylCols, ix.syllables[i]);
    s.index = i;
    s.codepoints = codepoints(s.siddham);
    return s;
  }

  /** 這個音節有哪些寫法（多對一的那個「多」）。回傳字形索引，依 face 排序值。 */
  function writingsOf(ix, sylIdx) {
    var list = (ix.bySyllable.get(sylIdx) || []).slice();
    list.sort(function (a, b) {
      var fa = ix.faceByCode.get(unpack(ix.glyphCols, ix.glyphs[a]).face);
      var fb = ix.faceByCode.get(unpack(ix.glyphCols, ix.glyphs[b]).face);
      return ((fa && fa.sort) || 0) - ((fb && fb.sort) || 0) || a - b;
    });
    return list;
  }

  /**
   * 組字拆解。**四種狀態各自回一個不同的 state**——這是本 lib 最容易寫錯的地方：
   *   'none'      來源沒有登錄組字（468 個）
   *   'atomic'    基本字，來源說它拆到自己為止（57 個）
   *   'composed'  真的可拆（其餘）
   * parts 的元素：{ index } 或 { placeholder: true }——後者是來源的 〇：
   * **那個位置有組件，只是登錄裡沒有可指名的字形**，不是「空位」（治理 Q4，2026-08-17 定案）。
   */
  function compositionOf(ix, i) {
    var arr = ix.composition[i];
    if (arr === null || arr === undefined) return { state: 'none', parts: [] };
    if (arr.length === 1 && arr[0] === i) return { state: 'atomic', parts: [] };
    return {
      state: 'composed',
      parts: arr.map(function (k) {
        return k === -1 ? { placeholder: true } : { index: k };
      }),
    };
  }

  /**
   * 反查：把一段用造字寫成的文字逐字元對回 unicode siddham。
   * 回傳逐字元的結果，**不合併、不跳過**——呼叫端要看得出哪幾個字對不到。
   *   { ch, glyph|null, syllable|null }
   * ⚠️ 用 for…of 逐「碼位」而非 charAt——載體字元多在 BMP 內，但不保證永遠是。
   */
  function reverseLookup(ix, text) {
    var out = [];
    for (var ch of String(text || '')) {
      var gi = ix.byChar.has(ch) ? ix.byChar.get(ch) : null;
      var g = gi === null ? null : glyph(ix, gi);
      out.push({
        ch: ch,
        glyph: g,
        syllable: g && g.syl !== null ? syllableOf(ix, g.syl) : null,
      });
    }
    return out;
  }

  /**
   * 搜尋音節。**述詞同時吃記法／悉曇串／羅馬／載體字元／Big5 碼**——
   * 少吃一種，使用者就會用那一種找不到東西（DESIGN_GUIDELINES §6.2 的那一半）。
   * 回傳音節索引。
   */
  function search(ix, q, limit) {
    q = String(q || '').trim();
    if (!q) return [];
    var lower = q.toLowerCase();
    var hits = [], seen = new Set(), i, s;

    // 先試「這是不是一個造字／Big5 碼」——命中就直接跳到它的音節
    var direct = ix.byChar.get(q);
    if (direct === undefined) {
      for (i = 0; i < ix.glyphs.length; i++) {
        if (unpack(ix.glyphCols, ix.glyphs[i]).code.toLowerCase() === lower) { direct = i; break; }
      }
    }
    if (direct !== undefined) {
      var dg = glyph(ix, direct);
      if (dg && dg.syl !== null) { hits.push(dg.syl); seen.add(dg.syl); }
    }

    for (i = 0; i < ix.syllables.length && hits.length < (limit || 400); i++) {
      if (seen.has(i)) continue;
      s = unpack(ix.sylCols, ix.syllables[i]);
      if ((s.notation && s.notation.toLowerCase().indexOf(lower) >= 0)
        || (s.latin && s.latin.toLowerCase().indexOf(lower) >= 0)
        || (s.siddham && s.siddham.indexOf(q) >= 0)) {
        hits.push(i); seen.add(i);
      }
    }
    return hits;
  }

  /**
   * 十八章的格子。回傳 rows：每列固定 12 格，沒有字的格子是 null
   * （最後一列會短，用 null 補滿——版面才對得齊）。
   * ⚠️ 列數以實際格子算，**不用來源宣稱的 charCount**（第 18 章那兩個數字不符，治理 §9-Q3）。
   */
  function chapterGrid(ix, no) {
    if (!ix.chapters || !ix.cells) throw new Error('本頁未載入 siddham-chapters.js');
    var meta = null, i, c;
    for (i = 0; i < ix.chapters.length; i++) {
      if (ix.chapters[i][0] === no) {
        meta = {
          no: ix.chapters[i][0], label: ix.chapters[i][1], name: ix.chapters[i][2],
          alias: ix.chapters[i][3], charCountDeclared: ix.chapters[i][4],
          rowCount: ix.chapters[i][5], colCount: ix.chapters[i][6],
          lastRowCharCount: ix.chapters[i][7], note: ix.chapters[i][8],
        };
        break;
      }
    }
    if (!meta) return null;

    var grid = [];
    var actual = 0;
    for (i = 0; i < ix.cells.length; i++) {
      c = unpack(ix.cellCols, ix.cells[i]);
      if (c.ch !== no) continue;
      actual++;
      while (grid.length <= c.row) grid.push(new Array(meta.colCount || 12).fill(null));
      grid[c.row][c.col] = c.glyph;
    }
    meta.charCountActual = actual;
    return { chapter: meta, rows: grid };
  }

  window.SiddhamLib = {
    build: build,
    unpack: unpack,
    glyph: glyph,
    syllableOf: syllableOf,
    writingsOf: writingsOf,
    compositionOf: compositionOf,
    reverseLookup: reverseLookup,
    search: search,
    chapterGrid: chapterGrid,
    codepoints: codepoints,
  };
})(window);
