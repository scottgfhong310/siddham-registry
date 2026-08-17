/**
 * glyph-detail — 明細卡（兩頁共用）
 *
 * 家族 DESIGN_GUIDELINES §4.1 的第三種模組：**碰 DOM、但跨頁共用**，
 * 所以既不進 `-lib.js`（那支不准碰 DOM），也不該在兩個控制器裡各抄一份。
 * markup 由本模組自己注入，差異行為用 callback 交給呼叫端。
 *
 * 形制照 §11.1 的明細卡骨架：.detail-head ＋ .detail-body ＋ .d-section × N ＋ .copy-row。
 *
 * Public API：
 *   GlyphDetail.install(ix)                  注入 markup、初始化 Modal
 *   GlyphDetail.openSyllable(sylIdx)         以音節開卡
 *   GlyphDetail.openGlyph(glyphIdx)          以字形開卡（先解到它的音節）
 *   GlyphDetail.refresh()                    切語言時重繪（卡開著時）
 */
(function (window, document) {
  'use strict';

  var L = null, ix = null, state = { syl: null, glyph: null };

  /**
   * ⚠️ 每次都跟 Materialize 要「當下那一個」實例，不要把 init() 的回傳值存起來。
   *    Materialize 的 init 對同一個元素跑第二次會先 destroy 舊實例（連同它的 click／
   *    keydown handler）再建一個新的，而握著舊實例的人**不會收到任何通知**。
   *    後果是：舊實例照樣開得起卡（open 只是加 class ＋ 貼 overlay），新實例的
   *    isOpen 卻一直是 false ⇒ close() 第一行就早退 ⇒ 這張卡關不掉，而畫面完全正常。
   *    這支模組是兩頁共用的，管不到呼叫端會不會再 init 一次，所以在自己這邊讓它不成立。
   */
  function modalInst() {
    var el = document.getElementById('glyph-detail');
    return window.M.Modal.getInstance(el) || window.M.Modal.init(el, { endingTop: '6%' });
  }

  function t(key, params) {
    return window.I18n ? window.I18n.t(key, params) : key;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function html() {
    return ''
      + '<div id="glyph-detail" class="modal detail-modal">'
      + '  <div class="modal-content">'
      + '    <div class="detail-head">'
      + '      <span class="d-sid" id="gd-sid"></span>'
      + '      <span class="d-meta">'
      + '        <span class="d-not" id="gd-not"></span><br>'
      + '        <span class="d-lat" id="gd-lat"></span><br>'
      + '        <span class="d-cp" id="gd-cp"></span>'
      + '      </span>'
      + '    </div>'
      + '    <div class="detail-body" id="gd-body"></div>'
      + '  </div>'
      + '  <div class="modal-footer">'
      + '    <a href="#!" class="modal-close btn-flat" data-i18n="detail.close">關閉</a>'
      + '  </div>'
      + '</div>';
  }

  function copyRow(pairs) {
    return '<div class="copy-row">' + pairs.map(function (p) {
      return '<button class="copy-btn" data-copy="' + esc(p[1]) + '">'
        + '<i class="material-icons">content_copy</i>' + esc(p[0]) + '</button>';
    }).join('') + '</div>';
  }

  /** 一段：這個音節有哪些寫法（多對一的那個「多」，本 app 的招牌） */
  function sectionWritings(sylIdx) {
    var list = L.writingsOf(ix, sylIdx);
    if (!list.length) return '';
    var byFace = new Map();
    list.forEach(function (gi) {
      var g = L.glyph(ix, gi);
      var name = (g.faceInfo && g.faceInfo.name) || g.face;
      if (!byFace.has(name)) byFace.set(name, []);
      byFace.get(name).push(g);
    });
    var out = '<div class="d-section"><h6>' + esc(t('detail.writings', { n: list.length })) + '</h6>'
      + '<div class="writings">';
    byFace.forEach(function (gs, name) {
      gs.forEach(function (g) {
        out += '<span class="writing" title="' + esc(name + ' / ' + g.code) + '">'
          + '<b>' + esc(g.char) + '</b><i>' + esc(name) + '</i></span>';
      });
    });
    return out + '</div></div>';
  }

  /**
   * 一段：組字拆解。⚠️ 四種狀態各講一句不同的話——
   * 併成一句的話，「來源說它是基本字」會被讀成「這筆資料壞了」（治理 §5 規則 11）。
   */
  function sectionComposition(glyphIdx) {
    if (glyphIdx == null) return '';
    var c = L.compositionOf(ix, glyphIdx);
    var head = '<div class="d-section"><h6>' + esc(t('detail.composition')) + '</h6>';
    if (c.state === 'none') return head + '<div class="d-empty">' + esc(t('detail.compNone')) + '</div></div>';
    if (c.state === 'atomic') return head + '<div class="d-empty">' + esc(t('detail.compAtomic')) + '</div></div>';
    var parts = c.parts.map(function (p) {
      if (p.placeholder) {
        return '<span class="comp-part ph" title="' + esc(t('detail.compPlaceholder')) + '">〇</span>';
      }
      return '<span class="comp-part">' + esc(L.glyph(ix, p.index).char) + '</span>';
    }).join('<span class="comp-op">+</span>');
    return head + '<div class="comp-row">' + parts + '</div></div>';
  }

  /** 一段：這個字形在十八章的位置（只有載入 chapters 資料的頁面才有） */
  function sectionChapter(glyphIdx) {
    if (glyphIdx == null || !ix.cells) return '';
    var cc = ix.cellCols, i, c;
    for (i = 0; i < ix.cells.length; i++) {
      c = L.unpack(cc, ix.cells[i]);
      if (c.glyph === glyphIdx) {
        return '<div class="d-section"><h6>' + esc(t('detail.chapter')) + '</h6>'
          + '<table class="facts-table"><tr><td class="fk">' + esc(t('detail.chapterPos')) + '</td>'
          + '<td class="fv">' + esc(t('detail.chapterAt', { ch: c.ch, row: c.row + 1, col: c.col + 1 }))
          + '</td></tr></table></div>';
      }
    }
    return '';
  }

  function render() {
    var syl = state.syl == null ? null : L.syllableOf(ix, state.syl);
    var g = state.glyph == null ? null : L.glyph(ix, state.glyph);

    document.getElementById('gd-sid').textContent = syl ? syl.siddham : (g ? g.char : '');
    document.getElementById('gd-not').textContent = syl ? (syl.notation || '') : '';
    document.getElementById('gd-lat').textContent = syl ? (syl.latin || '') : '';
    document.getElementById('gd-cp').textContent = syl ? syl.codepoints : '';

    var body = '';
    if (syl) {
      body += copyRow([
        [t('detail.copySiddham'), syl.siddham],
        [t('detail.copyNotation'), syl.notation || ''],
        [t('detail.copyLatin'), syl.latin || ''],
        [t('detail.copyCodepoints'), syl.codepoints],
      ]);
    }
    if (g) {
      body += '<div class="d-section"><h6>' + esc(t('detail.thisGlyph')) + '</h6>'
        + '<table class="facts-table">'
        + '<tr><td class="fk">' + esc(t('detail.carrier')) + '</td><td class="fv">'
        + esc(g.char) + '（' + esc(L.codepoints(g.char)) + '）</td></tr>'
        + '<tr><td class="fk">' + esc(t('detail.code')) + '</td><td class="fv">' + esc(g.code) + '</td></tr>'
        + '<tr><td class="fk">' + esc(t('detail.face')) + '</td><td class="fv">'
        + esc((g.faceInfo && g.faceInfo.name) || g.face) + '</td></tr>'
        + '</table></div>';
    }
    // ⚠️ 沒有音節時要講出來，不要留白（§11.1）——那是資料的事實，不是抽取漏掉
    if (g && g.syl === null) {
      body += '<div class="d-section"><h6>' + esc(t('detail.syllable')) + '</h6>'
        + '<div class="d-empty">' + esc(t('detail.noSyllable')) + '</div></div>';
    }
    body += sectionComposition(state.glyph);
    if (syl) body += sectionWritings(syl.index);
    body += sectionChapter(state.glyph);

    document.getElementById('gd-body').innerHTML = body;
    if (window.I18n) window.I18n.apply(document.getElementById('glyph-detail'));
  }

  function install(index) {
    ix = index;
    L = window.SiddhamLib;
    var host = document.createElement('div');
    host.innerHTML = html();
    document.body.appendChild(host.firstChild);
    window.M.Modal.init(document.getElementById('glyph-detail'), { endingTop: '6%' });

    // 複製：讀畫面上當下那個值（家族 v1.34 的判準）
    document.getElementById('glyph-detail').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.copy-btn') : null;
      if (!btn) return;
      var val = btn.getAttribute('data-copy');
      if (!val) { window.M.toast({ html: t('toast.emptyField'), classes: 'grey' }); return; }
      var done = function () {
        btn.classList.add('copied');
        setTimeout(function () { btn.classList.remove('copied'); }, 1200);
        window.M.toast({ html: t('toast.copied'), classes: 'teal' });
      };
      // clipboard 在非 HTTPS／非 localhost 不存在，且可能被拒——兩種都要有退路（§11.1）
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(done, function () {
          window.M.toast({ html: t('toast.copyFail'), classes: 'red' });
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = val; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); }
        catch (err) { window.M.toast({ html: t('toast.copyFail'), classes: 'red' }); }
        document.body.removeChild(ta);
      }
    });
  }

  window.GlyphDetail = {
    install: install,
    openSyllable: function (i) { state.syl = i; state.glyph = null; render(); modalInst().open(); },
    openGlyph: function (i) {
      var g = L.glyph(ix, i);
      state.glyph = i; state.syl = g ? g.syl : null; render(); modalInst().open();
    },
    refresh: function () { if (state.syl !== null || state.glyph !== null) render(); },
  };
})(window, document);
