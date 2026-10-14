/* Conexômetro 3.0 — contadores odômetro, tendência verificada e atualização automática. */
(() => {
  'use strict';
  const root = document.getElementById('crmConexometro');
  if (!root) return;
  const ENDPOINT = 'https://rwkbpafpniwzvlkfngag.supabase.co/rest/v1/rpc/crm_public_conexometro';
  const PUBLIC_KEY = 'sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C';
  const FIELDS = ['members','radar_mapped','community_published'];
  const TRENDS = {members:'members_new_7d',radar_mapped:'radar_new_7d',community_published:'community_new_7d'};
  const SUFFIX = {members:'novos membros em 7 dias',radar_mapped:'novas vagas em 7 dias',community_published:'novas publicações em 7 dias'};
  const LABELS = {members:'Membros cadastrados',radar_mapped:'Vagas no Radar',community_published:'Vagas da comunidade'};
  const fmt = new Intl.NumberFormat('pt-BR');
  const prefersReduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const status = document.getElementById('crmConexometroStatus');
  let last = null;
  let latest = null;
  let busy = false;
  let revealed = prefersReduced || !('IntersectionObserver' in window);
  let running = new Map();

  function setStatus(msg, online) {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle('is-online',!!online);
  }
  function stopAnimation(element) {
    const animations = running.get(element) || [];
    animations.forEach(a => { try {a.cancel();} catch (_) {} });
    running.delete(element);
  }
  function createDigit(target, old, position, shouldSpin, parent) {
    const column = document.createElement('span');
    column.className='crm-odometer-column';
    column.setAttribute('aria-hidden','true');
    const strip = document.createElement('span');
    strip.className='crm-odometer-strip';
    const digits = '0123456789';
    const rotations = shouldSpin ? 3 : 1;
    for (let n=0; n<rotations; n++) for (const d of digits) {
      const cell=document.createElement('span');
      cell.textContent=d;
      strip.appendChild(cell);
    }
    column.appendChild(strip);parent.appendChild(column);
    const finish = (shouldSpin ? 20 : 0)+target;
    const finalTransform='translate3d(0,-'+(finish*1.08)+'em,0)';
    strip.style.transform=finalTransform;
    if(shouldSpin && typeof strip.animate === 'function'){
      const start=(10+old)*1.08;
      const animation=strip.animate(
        [{transform:'translate3d(0,-'+start+'em,0)'},
         {transform:finalTransform}],
        {duration:1480+position*115,easing:'cubic-bezier(.12,.84,.22,1)',fill:'forwards'}
      );
      const list=running.get(parent)||[];
      list.push(animation);
      running.set(parent,list);
    }
  }
  function odometer(el, next, previous) {
    const text=fmt.format(next);
    const oldText=fmt.format(Number(previous)||0);
    const shouldSpin=!prefersReduced && !document.hidden && revealed && (previous===null||Number(previous)!==next);
    stopAnimation(el);
    el.replaceChildren();
    el.setAttribute('aria-label',text+' '+LABELS[el.dataset.conexometro]);
    const oldDigits=oldText.replace(/\D/g,'').split('');
    const newDigits=text.replace(/\D/g,'').split('');
    let ordinal=0;
    let cursor=0;
    for(const char of text){
      if(/\d/.test(char)){
        const oldIndex=oldDigits.length-newDigits.length+cursor;
        const old=oldIndex>=0 ? Number(oldDigits[oldIndex]) : 0;
        createDigit(Number(char),old,ordinal,shouldSpin,el);
        cursor++;ordinal++;
      } else {
        const separator=document.createElement('span');
        separator.className='crm-odometer-separator';
        separator.setAttribute('aria-hidden','true');
        separator.textContent=char;
        el.appendChild(separator);
      }
    }
  }
  function trendFor(field, data) {
    const wrapper=root.querySelector('[data-conexo-trend="'+field+'"]');
    if(!wrapper)return;
    const n=Number(data[TRENDS[field]]);
    const label=wrapper.querySelector('.crm-conexo-trend-text');
    if(!label)return;
    if(Number.isSafeInteger(n)&&n>0){
      wrapper.dataset.direction='up';
      label.textContent='+'+fmt.format(n)+' '+SUFFIX[field];
    }else{
      wrapper.dataset.direction='flat';
      label.textContent='Sem novas '+(field==='members'?'inscrições':field==='radar_mapped'?'vagas':'publicações')+' em 7 dias';
    }
  }
  function render(data){
    if(!data || FIELDS.some(k=>!Number.isSafeInteger(Number(data[k]))||Number(data[k])<0))throw new Error('Dados inválidos');
    latest=data;
    if(revealed){
      FIELDS.forEach(key=>{
        const el=root.querySelector('[data-conexometro="'+key+'"]');
        if(!el)return;
        const before=last?Number(last[key]):null;
        const after=Number(data[key]);
        if(before!==null && before===after)return;
        odometer(el,after,before);
        if(before!==null && after>before && !prefersReduced){
          const card=el.closest('.crm-conexo-card,.crm-conexo-feature');
          if(card){card.removeAttribute('data-flash');void card.offsetWidth;card.setAttribute('data-flash','true');
            window.setTimeout(()=>card.removeAttribute('data-flash'),1300);}
        }
      });
      last=data;
    }
    FIELDS.forEach(key=>trendFor(key,data));
    const measured=new Date(data.measured_at||Date.now());
    setStatus('Atualizado às '+(Number.isNaN(measured.getTime())?new Date():measured)
      .toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),true);
  }
  if(!revealed){
    root.classList.add('crm-conexo-enhanced');
    const revealers=Array.from(root.querySelectorAll('.crm-conexo-reveal'));
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      revealed=true;
      revealers.forEach((el,i)=>window.setTimeout(()=>el.classList.add('is-visible'),i*95));
      if(latest)render(latest);
      observer.disconnect();
    },{threshold:.11});
    observer.observe(root);
  }else{
    root.querySelectorAll('.crm-conexo-reveal').forEach(e=>e.classList.add('is-visible'));
  }
  async function refresh() {
    if(busy||document.hidden)return;
    busy=true;
    const abort=new AbortController();
    const timer=window.setTimeout(()=>abort.abort(),10000);
    try{
      const response=await fetch(ENDPOINT,{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:abort.signal});
      if(!response.ok)throw new Error('Falha HTTP '+response.status);
      render(await response.json());
    }catch(error){
      setStatus(latest?'Sem conexão · última atualização preservada':'Indicadores indisponíveis no momento',false);
      console.warn('[Conexometro] Falha ao buscar contadores',error);
    }finally{window.clearTimeout(timer);busy=false;}
  }
  refresh();
  window.setInterval(refresh,30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('online',refresh);
})();