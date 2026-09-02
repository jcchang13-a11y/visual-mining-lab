/* 《剛吃飽》第八版：既有原圖／figure slot renderer
 * 原則：不仿畫、不猜圖、不改正文。只有明確 [[FIGURE: ...]] 標記才處理。
 * 缺 src 時永遠輸出 slot；只有標記本身明寫 src= 才接原圖。
 */
(function () {
  'use strict';

  const OPEN = '[[FIGURE:';
  const CLOSE = '[[/FIGURE]]';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function parseSpec(raw) {
    const parts = String(raw).split('｜').map(s => s.trim()).filter(Boolean);
    const spec = { title: parts.shift() || '既有原圖', src: '', note: '' };
    const notes = [];
    for (const part of parts) {
      const m = part.match(/^src\s*=\s*(.+)$/i);
      if (m) {
        spec.src = m[1].trim();
      } else {
        notes.push(part);
      }
    }
    spec.note = notes.join('｜');
    return spec;
  }

  function slotHTML(spec) {
    const note = spec.note ? `<div class="figure-slot-note">${esc(spec.note)}</div>` : '';
    return `<div class="figure-slot" data-figure-title="${esc(spec.title)}"><div class="figure-slot-title">${esc(spec.title)}</div>${note}</div>`;
  }

  function figureHTML(spec) {
    const caption = spec.note || spec.title;
    return `<figure class="existing-figure" data-figure-title="${esc(spec.title)}"><img src="${esc(spec.src)}" alt="${esc(spec.title)}" loading="lazy"><figcaption>${esc(caption)}</figcaption></figure>`;
  }

  function renderMarkedText(text) {
    if (!text || !text.includes(OPEN)) return text;
    let out = '';
    let cursor = 0;
    while (true) {
      const start = text.indexOf(OPEN, cursor);
      if (start < 0) {
        out += text.slice(cursor);
        break;
      }
      out += text.slice(cursor, start);
      const headEnd = text.indexOf(']]', start);
      if (headEnd < 0) {
        out += text.slice(start);
        break;
      }
      const close = text.indexOf(CLOSE, headEnd + 2);
      if (close < 0) {
        out += text.slice(start);
        break;
      }
      const raw = text.slice(start + OPEN.length, headEnd).trim();
      const spec = parseSpec(raw);
      out += spec.src ? figureHTML(spec) : slotHTML(spec);
      cursor = close + CLOSE.length;
    }
    return out;
  }

  function apply(root) {
    const el = root || document.getElementById('article') || document.body;
    if (!el || el.dataset.figureRendererDone === '1') return;
    if (!el.innerHTML.includes(OPEN)) return;
    el.innerHTML = renderMarkedText(el.innerHTML);
    el.dataset.figureRendererDone = '1';
  }

  window.GCBFigureRenderer = { parseSpec, renderMarkedText, apply };
})();
