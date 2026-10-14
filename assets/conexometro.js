/* Conexometro da home: leitura agregada do Supabase, sem dados pessoais.
 * As vagas do Radar incluem registros ainda não verificados. */
(() => {
  'use strict';
  const ENDPOINT = 'https://rwkbpafpniwzvlkfngag.supabase.co/rest/v1/rpc/crm_public_conexometro';
  const PUBLIC_KEY = 'sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C';
  const REFRESH_MS = 30000;
  const KEYS = ['members', 'radar_mapped', 'radar_verified', 'community_published'];
  const format = new Intl.NumberFormat('pt-BR');
  let last = null;
  let busy = false;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animations = new Map();
  const root = document.getElementById('crmConexometro');
  if (!root) return;
  const status = document.getElementById('crmConexometroStatus');
  const update = (msg, live) => {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle('is-online', !!live);
  };
  function animateCount(element, to, from) {
    const old = animations.get(element);
    if (old) cancelAnimationFrame(old);
    if (reduceMotion || !Number.isFinite(from) || from === to || document.hidden) {
      element.textContent = format.format(to);
      return;
    }
    const start = performance.now();
    const duration = Math.min(1150, Math.max(430, Math.abs(to - from) * 18));
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = format.format(Math.round(from + (to - from) * eased));
      if (t < 1) animations.set(element, requestAnimationFrame(step));
      else animations.delete(element);
    }
    animations.set(element, requestAnimationFrame(step));
  }
  function render(payload) {
    if (!payload || KEYS.some(key => !Number.isSafeInteger(Number(payload[key])) || Number(payload[key]) < 0)) {
      throw new Error('Indicadores inválidos');
    }
    for (const key of KEYS) {
      const element = root.querySelector('[data-conexometro="' + key + '"]');
      if (!element) continue;
      const next = Number(payload[key]);
      const previous = last ? Number(last[key]) : (reduceMotion ? next : 0);
      animateCount(element, next, previous);
    }
    last = payload;
    const time = new Date(payload.measured_at || Date.now());
    update('Sincronizado às ' + (isNaN(time.getTime()) ? new Date() : time).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}), true);
  }
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST', headers: {'apikey': PUBLIC_KEY, 'Content-Type': 'application/json'},
        body: '{}', cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      render(await response.json());
    } catch (error) {
      update(last ? 'Sem conexão · exibindo última atualização' : 'Indicadores temporariamente indisponíveis', false);
      console.warn('[Conexometro] Falha na atualização:', error);
    } finally {
      clearTimeout(timer);
      busy = false;
    }
  }
  refresh();
  window.setInterval(refresh, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('online', refresh);
})();
