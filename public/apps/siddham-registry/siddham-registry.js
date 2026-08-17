/**
 * siddham-registry — 字形對照頁的控制器（碰 DOM 的那一層）
 *
 * 純運算全在 siddham-registry-lib.js；本檔只做選元素、綁事件、i18n 重繪、toast。
 */
(function (window, document) {
  'use strict';

  var L = window.SiddhamLib;
  var ix = null;
  var state = { mode: 'wall', query: '', list: [] };
  var WALL_LIMIT = 400;   // 一次貼 6,898 張卡會讓首屏很久；捲到底再追加

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var t = function (k, p) { return window.I18n ? window.I18n.t(k, p) : k; };

  // ── 音節牆 ──────────────────────────────────────────────────────────
  function wallCard(sylIdx) {
    var s = L.syllableOf(ix, sylIdx);
    var n = (ix.bySyllable.get(sylIdx) || []).length;
    return '<div class="syl-card" data-syl="' + sylIdx + '">'
      + '<span class="syl-sid">' + esc(s.siddham) + '</span>'
      + '<span class="syl-not">' + esc(s.notation || '—') + '</span><br>'
      + '<span class="syl-lat">' + esc(s.latin || '') + '</span>'
      + '<div class="syl-n">' + esc(t('wall.writings', { n: n })) + '</div>'
      + '</div>';
  }

  function renderWall() {
    var list = state.list;
    $('view-wall').innerHTML = list.slice(0, WALL_LIMIT).map(wallCard).join('');
    $('count').textContent = list.length > WALL_LIMIT
      ? t('count.shown', { n: WALL_LIMIT, total: list.length })
      : t('count.total', { n: list.length });
  }

  function allSyllables() {
    var out = [], i;
    for (i = 0; i < ix.syllables.length; i++) out.push(i);
    return out;
  }

  function applyQuery() {
    state.list = state.query ? L.search(ix, state.query, 2000) : allSyllables();
    if (state.mode === 'wall') renderWall();
  }

  // ── 反查 ────────────────────────────────────────────────────────────
  function renderReverse() {
    var text = $('rev-input').value;
    var res = L.reverseLookup(ix, text);
    if (!res.length) { $('rev-out').innerHTML = ''; $('count').textContent = ''; return; }

    var hit = 0;
    $('rev-out').innerHTML = res.map(function (r) {
      // ⚠️ 三種結果各自一種樣子，不可併成「找不到」：
      //    · 不在登錄裡（可能根本不是造字）
      //    · 在登錄裡、但本來就沒有音（群組／筆順／咒輪／文章記號）
      //    · 有音
      if (!r.glyph) {
        return '<div class="rev-cell miss"><span class="rev-src">' + esc(r.ch) + '</span>'
          + '<span class="rev-note">' + esc(t('reverse.unknown')) + '</span></div>';
      }
      if (!r.syllable) {
        return '<div class="rev-cell nosyl"><span class="rev-src">' + esc(r.ch) + '</span>'
          + '<span class="rev-note">' + esc(t('reverse.noSyllable')) + '</span></div>';
      }
      hit++;
      return '<div class="rev-cell" data-glyph="' + r.glyph.index + '">'
        + '<span class="rev-src">' + esc(r.ch) + '</span>'
        + '<span class="rev-sid">' + esc(r.syllable.siddham) + '</span>'
        + '<span class="rev-lat">' + esc(r.syllable.latin || '') + '</span></div>';
    }).join('');
    $('count').textContent = t('reverse.count', { n: hit, total: res.length });
  }

  // ── 模式切換 ────────────────────────────────────────────────────────
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.chip-btn[data-mode]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
    $('view-wall').style.display = mode === 'wall' ? 'grid' : 'none';
    $('view-reverse').style.display = mode === 'reverse' ? 'grid' : 'none';
    if (mode === 'wall') renderWall(); else renderReverse();
  }

  // ── 字型說明 ────────────────────────────────────────────────────────
  function renderFonts() {
    var installed = window.FontProbe.applyBodyClass(ix) === true;
    $('font-list').innerHTML = '<table class="facts-table">'
      + ix.fonts.map(function (f) {
        var status = f.redistributable === true
          ? t('font.bundled')
          : (installed && f.encoding ? t('font.local') : t('font.notInstalled'));
        // ⚠️ 兩種版本說法不可混用：隨 app 提供的那支，登錄版本**就是**你拿到的那支；
        //    走 local() 的則不然——CBETA 有兩個同名建置（v2.00／v1.062），
        //    family 與 PostScript name 全是 Siddam，local() 依名字比對，網頁分不出來。
        //    對它寫「版本 X」等於替使用者宣稱一件本頁查不到的事。
        // name ID 5 依慣例以 "Version " 開頭，而三語標籤自己已經有那個詞了
        // （不剝會印成「版本 Version 2.004」／"version Version 2.004"）。
        // 只剝開頭，剩下的原樣顯示——版本字串後面可能還有建置資訊，那是事實不是雜訊。
        var vs = f.version ? String(f.version).replace(/^version\s+/i, '') : '';
        var ver = vs
          ? t(f.redistributable === true ? 'font.version' : 'font.versionRegistered', { v: vs })
          : '';
        return '<tr><td class="fk">' + esc(f.family) + '</td><td class="fv">'
          + esc(status) + '｜' + esc(f.license || t('font.noLicense'))
          + (ver ? '<span class="f-ver">' + esc(ver) + '</span>' : '') + '</td></tr>';
      }).join('') + '</table>'
      + '<p class="d-empty">' + t('font.why') + '</p>';
  }

  // ── 起手 ────────────────────────────────────────────────────────────
  function init() {
    try {
      ix = L.build(window);
    } catch (e) {
      document.querySelector('main').innerHTML =
        '<p class="d-empty">' + esc(e.message) + '</p>';
      return;
    }
    window.GlyphDetail.install(ix);

    var fontOk = window.FontProbe.applyBodyClass(ix);   // 見 font-probe.js：量像素不量寬度

    // 搜尋
    var timer = null;
    $('search').addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.query = $('search').value.trim(); applyQuery(); }, 140);
    });
    // 模式
    document.querySelectorAll('.chip-btn[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });
    // 反查輸入
    var rtimer = null;
    $('rev-input').addEventListener('input', function () {
      clearTimeout(rtimer); rtimer = setTimeout(renderReverse, 140);
    });
    // 開明細（牆與反查共用一支委派）
    document.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('[data-syl]') : null;
      if (card) { window.GlyphDetail.openSyllable(Number(card.getAttribute('data-syl'))); return; }
      var cell = e.target.closest ? e.target.closest('[data-glyph]') : null;
      if (cell) window.GlyphDetail.openGlyph(Number(cell.getAttribute('data-glyph')));
    });

    // 側鍵
    // ⚠️ 只 init 這一頁自己的那一個 modal，**不要** M.Modal.init(document.querySelectorAll('.modal'))：
    //    明細卡是 GlyphDetail 自己 init 的，掃全部等於把它的實例 destroy 掉再換一個新的，
    //    而新的那個 isOpen 一直是 false（開卡的是被丟掉的那一個）⇒
    //    「關閉」／點遮罩／ESC 全部在 close() 的第一行早退，**那張卡關不掉**。
    //    畫面上完全正常——卡開得起來、長得對，只有關不掉，所以只能靠檢查釘住（verify 第 ⑮ 條）。
    window.M.Modal.init($('font-modal'), { endingTop: '6%' });
    $('setting-fonts').addEventListener('click', function () {
      renderFonts();
      window.M.Modal.getInstance($('font-modal')).open();
    });
    $('setting-mode').addEventListener('click', function () {
      var cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = cur;
      document.documentElement.classList.toggle('dark-mode', cur === 'dark');
      document.documentElement.classList.toggle('light-mode', cur === 'light');
      try { localStorage.setItem('siddham-registry-theme', cur); } catch (e) { }
    });
    $('setting-lang').addEventListener('click', function () {
      // ⚠️ 用共用件自己的 cycle()，不要在這裡另寫一份語言清單——
      //    那會變成第二個真相，而且新增語言時只會有一邊跟上。
      if (!window.I18n) return;
      var next = window.I18n.cycle();
      window.M.toast({ html: window.I18n.t('toast.lang', { name: window.I18n.name(next) }), classes: 'teal' });
    });

    document.addEventListener('i18n:changed', function () {
      applyQuery();
      if (state.mode === 'reverse') renderReverse();
      window.GlyphDetail.refresh();
    });

    if (window.I18n) window.I18n.apply(document);   // 無 init()：locale 檔自行 register，apply 會 ensureInit
    applyQuery();
    setMode('wall');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
