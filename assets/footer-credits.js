/* Crédito profissional do rodapé. Somente apresentação: sem rede, dados ou acesso ao Supabase. */
(()=>{'use strict';
  const CREDIT_ID='crmDesignCredit';
  const URL='https://kimarrais.com.br/';
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  function authorLine(){
    // O rodapé público já contém o crédito "Criado por Jaqueline Amaro".
    // Ancorar nesse texto evita modificar outros rodapés ou a área logada.
    for(const link of document.querySelectorAll('a')){
      if(clean(link.textContent)!=='Jaqueline Amaro')continue;
      let node=link.parentElement;
      for(let depth=0;node&&depth<3;depth++,node=node.parentElement){
        const content=clean(node.textContent);
        if(/criado por/i.test(content)&&content.length<340)return node;
      }
    }
    return null;
  }
  function mount(){
    if(document.getElementById(CREDIT_ID))return true;
    const host=authorLine();
    if(!host)return false;
    const credit=document.createElement('span');
    credit.id=CREDIT_ID;
    credit.style.cssText='display:block;margin-top:7px;font-size:12px;line-height:1.55;letter-spacing:0;color:inherit;opacity:.9';
    credit.append(document.createTextNode('Responsável pelo UX Design / Product Design: '));
    const portfolio=document.createElement('a');
    portfolio.href=URL;
    portfolio.target='_blank';
    portfolio.rel='noopener noreferrer';
    portfolio.textContent='Kim Arrais';
    portfolio.title='Conhecer o portfólio de Kim Arrais';
    portfolio.style.cssText='color:#f97316;text-decoration:underline;text-underline-offset:3px;font-weight:600';
    credit.append(portfolio);
    host.append(credit);
    return true;
  }
  function init(){
    if(mount())return;
    // Tentativas limitadas para carregamento tardio do rodapé.
    [600,1800,4000].forEach(delay=>setTimeout(mount,delay));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
