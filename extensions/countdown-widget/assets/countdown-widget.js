// countdown-widget.js
// Lightweight widget that finds countdown containers, fetches active timers from the app backend,
// and renders a simple countdown with urgency styling.

(function () {
  function formatHHMMSS(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;
    if (hh > 0) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
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
    } catch (err) {
      console.error('countdown fetch error', err);
      return null;
    }
  }

  function renderTimer(container, timer, blockSettings) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'countdown-wrapper';

    const title = document.createElement('div');
    title.className = 'countdown-title';
    title.textContent = blockSettings.title || timer.message || 'Offer ends in';

    const digits = document.createElement('div');
    digits.className = 'countdown-digits';

    wrapper.appendChild(title);
    wrapper.appendChild(digits);
    container.appendChild(wrapper);

    const end = new Date(timer.endTime).getTime();
    function tick() {
      const now = Date.now();
      const remain = end - now;
      if (remain <= 0) {
        digits.textContent = '00:00';
        clearInterval(iv);
        return;
      }
      digits.textContent = formatHHMMSS(remain);
      // urgency handling
      if (timer.urgencyMinutes && remain <= timer.urgencyMinutes * 60 * 1000) {
        wrapper.classList.add('is-urgent');
      } else {
        wrapper.classList.remove('is-urgent');
      }
    }

    tick();
    const iv = setInterval(tick, 1000);
  }

  function readBlockSettings(raw) {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const nodes = document.querySelectorAll('.countdown-widget');
    nodes.forEach(async (el) => {
      const productId = el.dataset.productId;
      const shop = el.dataset.shop || window.Shopify && window.Shopify.shop;
      const blockSettings = readBlockSettings(el.dataset.blockSettings);

      if (!productId || !shop) return;

      const timer = await fetchTimer(shop, productId);
      if (!timer) return;
      renderTimer(el, timer, blockSettings);
    });
  });

})();
