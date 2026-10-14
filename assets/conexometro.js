/* Conexômetro 2.0: números agregados, motion responsivo e atualização automática.
 * Somente 'radar_mapped' é exibido, nunca o antigo status legado 'listed' como vagas ativas.
 */
(() => {
  'use strict';
  const ENDPOINT = 'https://rwkbpafpniwzvlkfngag.supabase.co/rest/v1/rpc/crm_public_conexometro';
  const PUBLIC_KEY = 'sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C';
  const REFRESH_MS = 30000;
  const KEYS = ['members', 'radar_mapped', 'community_published'];
  const format = new Intl.NumberFormat('pt-BR');
  const root = document.getElementById('crmConexometro');
  if (!root) return;
  const status = document.getElementById('crmConexometroStatus');
  const reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const animations = new Map();
  let previous = null;
  let latest = null;
  let busy = false;
  let visible = reduceMotion || !('IntersectionObserver' in window);
  const update = (label, live) => {
    if (!status) return;
    status.textContent = label;
    status.classList.toggle('is-online', !!live);
  };
  function animate(element, from, to) {
    const existing = animations.get(element);
    if (existing) cancelAnimationFrame(existing);
    if (reduceMotion || document.hidden || !visible || from === to) {
      element.textContent = format.format(to);
      return;
    }
    const start = performance.now();
    const duration = Math.min(1550, Math.max(650, Math.abs(to - from) * 6));
    const draw = now => {
      const ratio = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - ratio, 4);
      element.textContent = format.format(Math.round(from + (to - from) * ease));
      if (ratio < 1) animations.set(element, requestAnimationFrame(draw));
      else animations.delete(element);
    };
    animations.set(element, requestAnimationFrame(draw));
  }
  function paint(next, first = false) {
    for (const key of KEYS) {
      const el = root.querySelector('[data-conexometro="' + key + '"]');
      if (!el) continue;
      const after = Number(next[key]);
      const before = previous ? Number(previous[key]) : 0;
      animate(el, first && reduceMotion ? after : before, after);
      if (previous && after > before && !reduceMotion) {
        const card = el.closest('.crm-conexo-card,.crm-conexo-feature');
        if (card) {
          card.removeAttribute('data-flash');
          void card.offsetWidth;
          card.setAttribute('data-flash', 'true');
          window.setTimeout(() => card.removeAttribute('data-flash'), 1400);
        }
      }
    }
    previous = next;
  }
  function render(data) {
    if (!data || KEYS.some(key => !Number.isSafeInteger(Number(data[key])) || Number(data[key]) < 0)) {
      throw new Error('Indicadores inválidos');
    }
    latest = data;
    if (visible) paint(data, !previous);
    const measured = new Date(data.measured_at || Date.now());
    update('Sincronizado às ' + (Number.isNaN(measured.getTime()) ? new Date() : measured)
      .toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}), true);
  }
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('crm-conexo-enhanced');
    const reveal = [...root.querySelectorAll('.crm-conexo-reveal')];
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      visible = true;
      reveal.forEach((el,i) => {
        window.setTimeout(() => el.classList.add('is-visible'), i * 120);
      });
      if (latest && !previous) paint(latest, true);
      observer.disconnect();
    }, {threshold: .15});
    observer.observe(root);
  } else {
    root.querySelectorAll('.crm-conexo-reveal').forEach(el => el.classList.add('is-visible'));
  }
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'apikey': PUBLIC_KEY, 'Content-Type': 'application/json'},
        body: '{}', cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      render(await response.json());
    } catch (error) {
      update(latest ? 'Conexão instável · exibindo última atualização' : 'Indicadores temporariamente indisponíveis', false);
      console.warn('[Conexometro] Falha na atualização:', error);
    } finally {
      window.clearTimeout(timer);
      busy = false;
    }
  }
  refresh();
  window.setInterval(refresh, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('online', refresh);
})();
