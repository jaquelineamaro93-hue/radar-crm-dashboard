/* Radar UX: compactação progressiva dos filtros e IA junto ao CTA da vaga.
 * Não altera consultas, estados, tabelas, scraping ou lógica de Match.
 */
(function(){
  'use strict';
  const visibleIds=['filtro-categoria','filtro-cargo','filtro-modalidade'];
  function initFilters(){
    const select=document.getElementById('filtro-categoria');
    const grid=select?.parentElement?.parentElement;
    const box=grid?.parentElement;
    if(!grid||!box||!box.querySelector('#btn-buscar')||grid.classList.contains('crm-radar-fields'))return;
    const children=Array.from(grid.children);
    if(children.length<9 || !children.every(el=>el.tagName==='DIV'))return;
    const ids=children.map(el=>el.querySelector('input:not([hidden]),select:not([hidden])')?.id||'');
    if(!visibleIds.every(id=>ids.includes(id)))return;
    const action=box.querySelector('#btn-buscar')?.parentElement;
    if(!action)return;
    box.classList.add('crm-radar-filterbox');
    grid.classList.add('crm-radar-fields');
    action.classList.add('crm-radar-actions');
    for(const item of children){
      const primary=visibleIds.some(id=>item.querySelector('#'+id));
      if(!primary)item.classList.add('crm-filter-extra');
    }
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.id='crm-radar-more-filters';
    toggle.className='crm-radar-more-filters';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls',grid.id||(grid.id='crm-radar-fields-grid'));
    const count=children.filter(item=>item.classList.contains('crm-filter-extra')).length;
    const setExpanded=expanded=>{
      box.classList.toggle('is-expanded',expanded);
      toggle.setAttribute('aria-expanded',String(expanded));
      toggle.textContent=expanded?'Menos filtros':'Mais filtros ('+count+')';
    };
    setExpanded(false);
    toggle.addEventListener('click',()=>{
      const expand=!box.classList.contains('is-expanded');
      setExpanded(expand);
      if(expand){
        const next=children.find(item=>item.classList.contains('crm-filter-extra'));
        next?.querySelector('input,select')?.focus({preventScroll:true});
      }
    });
    const clear=box.querySelector('#btn-limpar');
    if(clear)action.insertBefore(toggle,clear);
    else action.append(toggle);
    // Quando filtros avançados já têm valores, mantenha-os visíveis.
    for(const el of grid.querySelectorAll('.crm-filter-extra input,.crm-filter-extra select')){
      if(el.value && el.value!=='Todas'){setExpanded(true);break;}
    }
  }
  function improveCard(card){
    if(!card||card.classList.contains('crm-radar-ai-enhanced')||!card.querySelector('h3'))return;
    const footer=Array.from(card.children).find(el=>el.style?.marginTop==='auto');
    if(!footer)return;
    card.dataset.crmJob='true';
    card.classList.add('crm-radar-ai-enhanced');
    const actions=document.createElement('div');
    actions.className='crm-radar-card-actions';
    const apply=footer.querySelector('[data-job-apply]');
    const button=card.querySelector('[data-analyze-job]')||document.createElement('button');
    button.type='button';
    button.dataset.analyzeJob='true';
    button.classList.add('crm-radar-ai-button');
    button.textContent='Analisar com IA';
    button.setAttribute('aria-label','Analisar esta vaga com IA');
    button.setAttribute('title','A IA ajuda a interpretar a vaga. Confira sempre o anúncio original.');
    actions.append(button);
    if(apply)actions.append(apply);
    footer.classList.add('crm-radar-card-footer');
    footer.append(actions);
  }
  function initCards(){
    const container=document.getElementById('vagasContainerHub');
    if(!container||container.dataset.crmUxObserved==='1')return;
    container.dataset.crmUxObserved='1';
    const enhance=()=>Array.from(container.children).forEach(improveCard);
    // Apenas inserções/remoções de CARD como filho direto. Nada de subtree:
    // mover botões dentro dos cards jamais reinicia o observer.
    const observer=new MutationObserver(enhance);
    observer.observe(container,{childList:true,subtree:false});
    enhance();
  }
  function init(){
    initFilters();
    initCards();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
