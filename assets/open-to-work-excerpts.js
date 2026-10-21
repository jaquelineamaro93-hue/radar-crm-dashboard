/* CONEXÃO CRM — Open to Work: descrições expansíveis, sem truncar dados.
 * O escopo fica restrito a #pageSearch #searchResults .p-card.
 * Não realiza consultas, altera cadastros, lê contatos ou observa a página inteira.
 */
(()=>{
  'use strict';
  if(window.CXTalentExcerpts)return;

  const SELECTOR='#pageSearch #searchResults .p-card';
  const TEXT_SELECTOR='p,div,span,li,small';
  const MIN_LENGTH=210;
  let number=0,scheduled=false;
  const blocked='.cx-share-holder,.cx-share-card,.p-actions,.p-footer,.p-links,.p-contact,.p-social,.cx-otw-excerpt-toggle,button,a,input,textarea,select';
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  function chooseBlocks(card){
    if(!card||!card.matches('.p-card'))return [];
    const matches=Array.from(card.querySelectorAll(TEXT_SELECTOR)).filter(el=>{
      if(el.closest(blocked))return false;
      const value=clean(el.textContent);
      if(value.length<MIN_LENGTH)return false;
      // Evita limitar o card inteiro quando existe um parágrafo mais específico.
      const longChild=Array.from(el.children).some(child=>child.matches(TEXT_SELECTOR) && clean(child.textContent).length>=MIN_LENGTH);
      if(longChild)return false;
      // Mantém intactos botões, links e áreas com ações interativas.
      if(el.querySelector('a,button,input,textarea,select'))return false;
      // Descrições grandes podem conter quebras de linha ou spans semânticos.
      const direct=Array.from(el.childNodes).filter(x=>x.nodeType===3).map(x=>clean(x.textContent)).join(' ');
      const relevant=/(ferrament|tech|stack|bio|resum|sobre|descr|area|especial|texto|compet)/i.test(String(el.className||''));
      return clean(direct).length>=130 || !!el.querySelector('br') || relevant || el.children.length===0;
    });
    // Card pode ter resumo e ferramentas. Nunca aplicar no container inteiro.
    return matches.slice(0,3);
  }

  function addToggle(textNode){
    if(textNode.dataset.cxOtwExcerpt==='1')return false;
    textNode.dataset.cxOtwExcerpt='1';
    const ident=textNode.id||('cxOtwText'+(++number));
    textNode.id=ident;
    textNode.classList.add('cx-otw-excerpt');
    const button=document.createElement('button');
    button.type='button';
    button.className='cx-otw-excerpt-toggle';
    button.textContent='Ver mais';
    button.setAttribute('aria-controls',ident);
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click',()=>{
      const expanded=button.getAttribute('aria-expanded')!=='true';
      button.setAttribute('aria-expanded',String(expanded));
      button.textContent=expanded?'Ver menos':'Ver mais';
      // Remover a classe devolve integralmente o estilo original do parágrafo.
      textNode.classList.toggle('cx-otw-excerpt',!expanded);
    });
    textNode.insertAdjacentElement('afterend',button);
    return true;
  }
  function apply(card){
    if(card.dataset.cxOtwCardsReady==='1')return;
    card.dataset.cxOtwCardsReady='1';
    for(const text of chooseBlocks(card))addToggle(text);
  }
  function refresh(){
    scheduled=false;
    const results=document.getElementById('searchResults');
    if(!results||!results.closest('#pageSearch'))return;
    results.querySelectorAll('.p-card').forEach(apply);
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(refresh);
    else window.setTimeout(refresh,0);
  }
  function init(){
    const results=document.getElementById('searchResults');
    if(!results||!results.closest('#pageSearch'))return;
    schedule();
    // A busca/filtros substituem os cards diretamente dentro dessa lista.
    if(typeof MutationObserver==='function')
      new MutationObserver(schedule).observe(results,{childList:true,subtree:false});
    window.addEventListener('pageshow',schedule);
    window.addEventListener('hashchange',schedule);
  }
  window.CXTalentExcerpts=Object.freeze({chooseBlocks});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();