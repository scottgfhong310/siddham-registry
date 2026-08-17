/**
 * font-probe — 偵測 CBETA 造字字型在這台機器上到底有沒有生效
 *
 * 兩頁共用（§4.1 的第三種模組：碰 DOM、跨頁共用，所以不進 -lib.js、也不在兩個控制器各抄一份）。
 *
 * ⚠️ **不可以用寬度判斷。** 載體字元是 CJK 表意文字，在**任何**字型裡都恰好是 1em 全形寬
 *    ——實測 serif 與 CbetaSiddam 都是 100.0px。寬度永遠相同，於是寬度偵測**必然回報「沒裝」**，
 *    而畫面上字型其實好好地在作用。這個 app 第一版就是這樣掛著一張假的告示。
 *
 * ⚠️ 也不可以用 `document.fonts.check()`：實測對每一支候選都回 true
 *    （它答的是「這個字型在不在」，不是「它畫不畫得出這個字」）。
 *
 * 正解是量**像素**：把同一個字分別用目標字型與純後備畫進 canvas，比對墨跡。
 * 並且**自帶對照組**——拿一個不存在的字型再畫一次，它必須與純後備完全相同；
 * 不相同就表示這支探針本身不可信，一律回報 `unknown` 而不是猜一個答案。
 *
 * Public API：
 *   FontProbe.available(family, probeChar) → true | false | null（null ＝探針不可信）
 *   FontProbe.applyBodyClass(ix)           → 依偵測結果切 body.no-cbeta-font
 */
(function (window, document) {
  'use strict';

  function ink(font, ch) {
    var cv = document.createElement('canvas');
    cv.width = 80; cv.height = 80;
    var c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, 80, 80);
    c.fillStyle = '#000'; c.font = '64px ' + font; c.textBaseline = 'top';
    c.fillText(ch, 4, 4);
    var d = c.getImageData(0, 0, 80, 80).data, h = 0, i;
    for (i = 0; i < d.length; i += 4) h = (h * 31 + (d[i] < 128 ? 1 : 0)) | 0;
    return h;
  }

  /**
   * @returns {boolean|null} true=生效／false=沒生效／null=探針不可信（對照組沒通過）
   */
  function available(family, probeChar) {
    try {
      var base = ink('serif', probeChar);
      var bogus = ink("'__no_such_font__', serif", probeChar);
      if (base !== bogus) return null;          // 對照組失敗 → 不要給答案
      return ink("'" + family + "', serif", probeChar) !== base;
    } catch (e) {
      return null;
    }
  }

  /**
   * 依偵測結果切 body class。⚠️ **`null` 不掛告示**——
   * 探針不可信時，掛一張「你沒裝字型」的告示可能是在說謊，
   * 而沉默至少只是少講一句話（同治理 §5 規則 11 的精神：不確定不要編）。
   */
  function applyBodyClass(ix) {
    var fam = 'CbetaSiddam';
    var probe = '一';
    if (ix && ix.glyphs && ix.glyphs.length) {
      // 拿登錄裡真的存在的第一個載體字元當探針，比寫死一個字可靠
      probe = window.SiddhamLib.glyph(ix, 0).char;
    }
    var ok = available(fam, probe);
    document.body.classList.toggle('no-cbeta-font', ok === false);
    return ok;
  }

  window.FontProbe = { available: available, applyBodyClass: applyBodyClass };
})(window, document);
