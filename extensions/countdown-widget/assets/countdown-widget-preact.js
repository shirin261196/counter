// Preact-based countdown widget (loads Preact UMD at runtime if needed)
(function () {
  const PREACT_URL = 'https://unpkg.com/preact@10.11.3/dist/preact.umd.js';
  const HOOKS_URL = 'https://unpkg.com/preact@10.11.3/hooks/dist/hooks.umd.js';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src='"+src+"']`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  function ensurePreact() {
    // If preact is already present (window.preact), resolve immediately
    if (window.preact && window.preactHooks) return Promise.resolve();
    // Load preact then hooks
    return loadScript(PREACT_URL).then(() => loadScript(HOOKS_URL));
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;
    if (hh > 0) return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  async function fetchTimer(shop, productId) {
    try {
      const url = new URL(`/api/timer/${encodeURIComponent(shop)}`, window.location.origin);
      url.searchParams.set('productId', productId);
      const res = await fetch(url.toString(), { credentials: 'same-origin' });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success || !json.timers || json.timers.length === 0) return null;
      return json.timers[0];
    } catch (e) {
      console.error('countdown fetch error', e);
      return null;
    }
  }

  function mountAll() {
    document.querySelectorAll('.countdown-widget').forEach(async (el) => {
      const productId = el.dataset.productId;
      const shop = el.dataset.shop || (window.Shopify && window.Shopify.shop);
      const blockSettings = (function () { try { return JSON.parse(el.dataset.blockSettings || '{}'); } catch(e) { return {}; } })();
      if (!productId || !shop) return;

      await ensurePreact();
      const { h, render } = window.preact;
      const { useState, useEffect } = window.preactHooks;

      function Timer() {
        const [timer, setTimer] = useState(null);
        const [now, setNow] = useState(Date.now());

        useEffect(() => {
          let mounted = true;
          fetchTimer(shop, productId).then((t) => { if (mounted) setTimer(t); });
          return () => { mounted = false; };
        }, []);

        useEffect(() => {
          const iv = setInterval(() => setNow(Date.now()), 1000);
          return () => clearInterval(iv);
        }, []);

        if (!timer) return h('div', { class: 'countdown-placeholder' }, '');

        const end = new Date(timer.endTime).getTime();
        const remain = Math.max(0, end - now);
        const isUrgent = timer.urgencyMinutes && remain <= timer.urgencyMinutes * 60 * 1000;

        const style = {
          background: (blockSettings.background_color || (timer.styles && timer.styles.background_color)) || '#fff',
          color: (blockSettings.text_color || (timer.styles && timer.styles.text_color)) || '#111',
          padding: '12px 18px',
          borderRadius: '10px',
          display: 'inline-block',
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
        };

        if (isUrgent) style.transform = 'scale(1.02)';

        return h('div', { style }, [
          h('div', { style: { fontSize: 12, marginBottom: 8 } }, blockSettings.title || (timer.styles && timer.styles.title) || timer.message || 'Offer ends in'),
          h('div', { style: { fontWeight: 700, fontSize: 18 } }, formatTime(remain))
        ]);
      }

      // mount into container
      render(h(Timer, {}), el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }

})();
