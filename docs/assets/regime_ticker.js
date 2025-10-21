// regime_ticker.js
// Lightweight, dependency-free banner that displays the live regime snapshot.
// Usage (ESM):
//   import { initRegimeTicker } from './regime_ticker.js';
//   initRegimeTicker({ target: '#regimeTicker', src: 'regime_snapshot.json', autorefresh: 0 });
//
export async function initRegimeTicker(opts = {}) {
  const targetSel = opts.target || 'body';
  const src = opts.src || 'regime_snapshot.json';
  const autorefresh = Number(opts.autorefresh || 0); // seconds; 0 = no polling
  const theme = opts.theme || 'auto'; // 'auto' | 'dark' | 'light'

  const container = document.querySelector(targetSel);
  if (!container) {
    console.warn('regime_ticker: target not found:', targetSel);
    return;
  }

  // Basic styles (scoped via a unique id class)
  const TID = 'regime-ticker';
  const styleId = 'regime-ticker-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${TID} {
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: .75rem;
        align-items: center;
        border-radius: 9999px;
        padding: .5rem .75rem;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(15,23,42,.7);
        color: #e2e8f0;
        backdrop-filter: blur(8px);
      }
      .${TID}.light {
        background: rgba(250,250,250,.8);
        color: #0f172a;
        border-color: rgba(0,0,0,.08);
      }
      .${TID} .dot {
        width: .65rem; height: .65rem; border-radius: 9999px;
        box-shadow: 0 0 0 .15rem rgba(255,255,255,.1) inset;
      }
      .${TID} .dot.open { background: #10b981; }
      .${TID} .dot.closed { background: #ef4444; }
      .${TID} .label { font-weight: 700; letter-spacing: .01em; }
      .${TID} .vals { font-variant-numeric: tabular-nums; white-space: nowrap; overflow: auto; }
      .${TID} .vals code { background: none; padding: 0; }
      .${TID} .ts { font-size: .8rem; opacity: .75; }
      .${TID} a { color: inherit; text-decoration: underline; text-decoration-color: rgba(255,255,255,.35); }
      .${TID}.light a { text-decoration-color: rgba(0,0,0,.35); }
    `;
    document.head.appendChild(style);
  }

  const el = document.createElement('section');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.className = `${TID} ${theme === 'light' ? 'light' : theme === 'dark' ? '' : ''}`;

  const dot = document.createElement('span'); dot.className = 'dot';
  const label = document.createElement('div'); label.className = 'label'; label.textContent = 'REGIME';
  const vals = document.createElement('div'); vals.className = 'vals';
  const ts   = document.createElement('div'); ts.className = 'ts';

  el.append(dot, label, vals, ts);
  container.innerHTML = '';
  container.appendChild(el);

  async function load() {
    try {
      const res = await fetch(src, {cache: 'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const open = !!j.regime_open;
      dot.classList.toggle('open', open);
      dot.classList.toggle('closed', !open);
      label.textContent = open ? 'REGIME · OPEN' : 'REGIME · CLOSED';

      const tri = typeof j.tri_sigma === 'number' ? `${j.tri_sigma.toFixed(2)}σ` : '—';
      const p   = typeof j.p_value === 'number' ? j.p_value.toFixed(3) : '—';
      const w   = typeof j.wtap === 'number' ? `${Math.round(j.wtap*100)}%` : '—';
      const kgf = typeof j.kinetic_gain_factor === 'number' ? `${j.kinetic_gain_factor.toFixed(2)}x` : '—';
      const act = (j.action || '').toString();

      vals.innerHTML = [
        `TRI* <code>${tri}</code>`,
        `p <code>${p}</code>`,
        `Wtap <code>${w}</code>`,
        `Kinetic <code>${kgf}</code>`,
        act ? `<strong>${act}</strong>` : ''
      ].filter(Boolean).join(' · ');

      if (j.timestamp) {
        const d = new Date(j.timestamp);
        const iso = isFinite(d) ? d.toISOString().replace('T',' ').replace('Z',' UTC') : j.timestamp;
        ts.textContent = `Last update ${iso}`;
      } else {
        ts.textContent = '';
      }
    } catch (e) {
      label.textContent = 'REGIME · UNKNOWN';
      dot.classList.remove('open','closed');
      vals.textContent = 'No snapshot available';
      ts.textContent = '';
      console.warn('regime_ticker: load failed:', e);
    }
  }

  await load();
  if (autorefresh > 0) {
    setInterval(load, autorefresh * 1000);
  }
}
