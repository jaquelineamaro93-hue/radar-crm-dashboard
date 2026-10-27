/* Course pricing navigation: one real filter, three accessible shortcuts. */
(()=>{'use strict';
function mount(){
 const sel=document.getElementById('cPreco');const container=document.getElementById('courseResults');
 if(!sel||!container||document.getElementById('cxCoursePriceQuick'))return;
 const shell=sel.closest('.filter-bar')||sel.parentElement;
 const row=document.createElement('div');row.className='cx-course-price-quick';row.id='cxCoursePriceQuick';row.setAttribute('role','group');row.setAttribute('aria-label','Filtrar cursos pelo valor');
 const choices=[['','Todos'],['Gratuito','Gratuito'],['Teste grátis','Teste grátis'],['Pago','Pago']];
 for(const [value,label] of choices){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.price=value;b.setAttribute('aria-pressed',String(sel.value===value));
  b.addEventListener('click',()=>{
   const found=[...sel.options].find(o=>o.value===value);
   if(!found)return;
   sel.value=value;sel.dispatchEvent(new Event('change',{bubbles:true}));
   refresh();
  });
  row.append(b);
 }
 const refresh=()=>row.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(sel.value===b.dataset.price)));
 sel.addEventListener('change',refresh);
 shell.after(row);refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
document.addEventListener('crm:route-changed',mount);
})();
