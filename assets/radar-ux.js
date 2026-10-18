/* Radar UX: filtro compacto sem controles de IA.
 * Não altera consultas, estados, tabelas, scraping ou lógica de Match.
 */
(function(){
  'use strict';
  const visibleIds=['filtro-categoria','filtro-cargo','filtro-nivel','filtro-modalidade'];
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
    if(clear){action.insertBefore(toggle,clear);clear.addEventListener('click',()=>setExpanded(false));}
    else action.append(toggle);
    // Quando filtros avançados já têm valores, mantenha-os visíveis.
    for(const el of grid.querySelectorAll('.crm-filter-extra input,.crm-filter-extra select')){
      if(el.id==='filtro-ordem-hub'||el.id==='filtro-periodo-hub')continue;
      if(el.value && el.value!=='Todas'){setExpanded(true);break;}
    }
  }
  function init(){initFilters();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
