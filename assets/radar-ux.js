/* Radar UX: filtro compacto sem controles de IA.
 * Não altera consultas, estados, tabelas, scraping ou lógica de Match.
 */
(function(){
  'use strict';
  const visibleIds=['filtro-categoria','filtro-cargo','filtro-nivel','filtro-modalidade','filtro-abrangencia'];
  const quickIds=['filtro-periodo-hub','filtro-ordem-hub'];
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
    const quick=document.createElement('div');
    quick.className='crm-radar-quick';
    quick.setAttribute('aria-label','Período e ordenação');
    for(const item of children){
      const primary=visibleIds.some(id=>item.querySelector('#'+id));
      const isQuick=quickIds.some(id=>item.querySelector('#'+id));
      if(isQuick){quick.append(item);item.classList.remove('crm-filter-extra');}
      else if(!primary)item.classList.add('crm-filter-extra');
    }
    box.insertBefore(quick,action);
    // Os filtros adicionais têm uma região própria, mantendo os mesmos inputs,
    // valores e listeners. Não clonamos controles nem alteramos a consulta.
    const extra=document.createElement('div');
    extra.id='crm-radar-extra-fields';
    extra.className='crm-radar-extra-fields';
    for(const item of children.filter(item=>item.classList.contains('crm-filter-extra')))extra.append(item);
    grid.insertAdjacentElement('afterend',extra);
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.id='crm-radar-more-filters';
    toggle.className='crm-radar-more-filters';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls',extra.id);
    const count=children.filter(item=>item.classList.contains('crm-filter-extra')).length;
    const setExpanded=expanded=>{
      box.classList.toggle('is-expanded',expanded);
      extra.hidden=!expanded;
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
    if(clear){action.insertBefore(toggle,clear);clear.addEventListener('click',()=>setExpanded(false));}
    else action.append(toggle);
    // Quando filtros avançados já têm valores, mantenha-os visíveis.
    for(const el of extra.querySelectorAll('input,select')){
      if(el.id==='filtro-ordem-hub'||el.id==='filtro-periodo-hub')continue;
      if(el.value && el.value!=='Todas'){setExpanded(true);break;}
    }
  }
  function init(){
    initFilters();
    const box=document.querySelector('#pageVagas .crm-radar-filterbox');
    if(!box||box.parentElement?.classList.contains('crm-radar-filter-disclosure'))return;
    const disclosure=document.createElement('details');
    disclosure.className='crm-radar-filter-disclosure';
    disclosure.open=!(window.matchMedia('(max-width:900px)').matches||(window.matchMedia('(pointer:coarse)').matches&&window.screen?.width>0&&window.screen.width<=600));
    const summary=document.createElement('summary');
    summary.textContent='Filtrar oportunidades';
    box.before(disclosure);disclosure.append(summary,box);
    // Scope is a primary decision and stays visible even with mobile filters closed.
    const scope=box.querySelector('#filtro-abrangencia');
    if(scope){
      const field=scope.parentElement;field.classList.add('crm-radar-scope');
      const label=field.querySelector('label');if(label)label.textContent='Local das vagas';
      disclosure.before(field);
      field.style.cssText='display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:12px 0';
      scope.style.maxWidth='280px';scope.style.minHeight='44px';
    }
    box.querySelector(':scope > h3')?.remove();
    // Não ocultar filtros preenchidos ao restaurar uma busca.
    if(box.querySelector('input:not([hidden])')?.value||box.classList.contains('is-expanded'))disclosure.open=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
