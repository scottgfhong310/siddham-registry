/**
 * chapters — 悉曇十八章頁的控制器
 *
 * 純運算（章格佈局）在 siddham-registry-lib.js 的 chapterGrid()；本檔只碰 DOM。
 * 明細卡與字形對照頁共用 glyph-detail.js（§4.1 的第三種模組）。
 */
(function (window, document) {
  'use strict';

  var L = window.SiddhamLib;
  var ix = null;
  var current = 1;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var t = function (k, p) { return window.I18n ? window.I18n.t(k, p) : k; };

  /**
   * 章名的白名單渲染。
   * ⚠️ 來源的章名自帶 `<sub>(引)</sub>`（18 章有 7 章），與家族 §8「使用者內容一律 escape」
   *    正面相撞：整段跳脫會印出字面的 `<sub>`，整段信任則是把資料當 markup 用。
   *    正解是**只放行 <sub>**——先全跳脫，再把跳脫後的 &lt;sub&gt; 換回真標籤。
   */
  function chapterName(raw) {
    return esc(raw)
      .replace(/&lt;sub&gt;/g, '<sub>')
      .replace(/&lt;\/sub&gt;/g, '</sub>');
  }

  function cellHtml(gi) {
    if (gi === null) return '<div class="cell empty"></div>';
    var g = L.glyph(ix, gi);
    var s = g.syl === null ? null : L.syllableOf(ix, g.syl);
    var comp = L.compositionOf(ix, gi);
    // 每格恆顯示組字拆解——十八章的教學意義就在構成規律，而 6,442 格 100% 都有組字。
    var compTxt = comp.state === 'composed'
      ? comp.parts.map(function (p) { return p.placeholder ? '〇' : L.glyph(ix, p.index).char; }).join('')
      : (comp.state === 'atomic' ? '—' : '');
    return '<div class="cell" data-glyph="' + gi + '">'
      + '<span class="cell-src">' + esc(g.char) + '</span>'
      + '<span class="cell-sid">' + esc(s ? s.siddham : '') + '</span>'
      + '<span class="cell-lat">' + esc(s ? (s.latin || '') : '') + '</span>'
      + '<span class="cell-comp">' + esc(compTxt) + '</span>'
      + '</div>';
  }

  function renderChapter(no) {
    current = no;
    var g = L.chapterGrid(ix, no);
    if (!g) return;

    $('chap-title').innerHTML = esc(g.chapter.label) + '　' + chapterName(g.chapter.name)
      + (g.chapter.alias ? ' <span class="count">（' + esc(g.chapter.alias) + '）</span>' : '');

    // ⚠️ 兩個數字不符時要講出來，不要挑一個顯示（治理 §9-Q3：兩個值都留著）
    var sub = t('chapters.cells', { n: g.chapter.charCountActual });
    if (g.chapter.charCountDeclared !== g.chapter.charCountActual) {
      sub += '　' + t('chapters.declaredMismatch', {
        declared: g.chapter.charCountDeclared, actual: g.chapter.charCountActual,
      });
    }
    $('chap-sub').textContent = sub;

    $('grid').innerHTML = g.rows.map(function (row) {
      return row.map(cellHtml).join('');
    }).join('');

    document.querySelectorAll('#chap-chips .chip-btn').forEach(function (b) {
      b.classList.toggle('active', Number(b.getAttribute('data-ch')) === no);
    });
    $('count').textContent = t('count.total', { n: ix.syllables.length });
  }

  function renderChips() {
    $('chap-chips').innerHTML = ix.chapters.map(function (c) {
      return '<button class="chip-btn" data-ch="' + c[0] + '">'
        + esc(t('chapters.chapter', { n: c[0] })) + '</button>';
    }).join('');
  }

  function init() {
    try {
      ix = L.build(window);
    } catch (e) {
      document.querySelector('main').innerHTML = '<p class="d-empty">' + esc(e.message) + '</p>';
      return;
    }
    window.GlyphDetail.install(ix);
    window.FontProbe.applyBodyClass(ix);   // 見 font-probe.js

    $('chap-chips').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ch]') : null;
      if (b) renderChapter(Number(b.getAttribute('data-ch')));
    });
    $('grid').addEventListener('click', function (e) {
      var cell = e.target.closest ? e.target.closest('.cell[data-glyph]') : null;
      if (cell) window.GlyphDetail.openGlyph(Number(cell.getAttribute('data-glyph')));
    });

    $('setting-mode').addEventListener('click', function () {
      var cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = cur;
      document.documentElement.classList.toggle('dark-mode', cur === 'dark');
      document.documentElement.classList.toggle('light-mode', cur === 'light');
      try { localStorage.setItem('siddham-registry-theme', cur); } catch (e) { }
    });
    $('setting-lang').addEventListener('click', function () {
      if (!window.I18n) return;
      var next = window.I18n.cycle();
      window.M.toast({ html: window.I18n.t('toast.lang', { name: window.I18n.name(next) }), classes: 'teal' });
    });

    document.addEventListener('i18n:changed', function () {
      renderChips();
      renderChapter(current);
      window.GlyphDetail.refresh();
    });

    if (window.I18n) window.I18n.apply(document);
    renderChips();
    renderChapter(1);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
