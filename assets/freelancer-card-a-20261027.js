/* Variante A: compact Freelancer cards. Optional fields are displayed only when declared by owner. */
(()=>{'use strict';
const safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const photo=url=>/^https:\/\/rwkbpafpniwzvlkfngag\.supabase\.co\/storage\/v1\/object\/public\/freelancer-avatars\/[a-f\d-]{36}\/[a-f\d-]{36}\.(?:png|jpg|webp)$/.test(url||'')?url:'';
const initials=name=>(String(name||'').trim().split(/\s+/).slice(0,2).map(n=>n[0]||'').join('').toUpperCase()||'CR');
const tags=f=>String(f.ferramentas||'').split(/[,;]/).map(v=>v.trim()).filter(Boolean).slice(0,3);
const title=f=>String(f.titulo||f.categoria||'Profissional freelancer');
const formatMoney=n=>Number.isFinite(Number(n))&&Number(n)>=0?'R$ '+Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2})+'/h':'';
const meta=f=>[
 Number.isInteger(Number(f.anos_experiencia))&&f.anos_experiencia!==null&&f.anos_experiencia!==''?Number(f.anos_experiencia)+' anos':'',
 f.localidade||'',
 f.idiomas||'',
 ({remoto:'Remoto',hibrido:'Híbrido',presencial:'Presencial',flexivel:'Flexível'})[f.modalidade]||'',
 f.valor_hora!=null&&f.valor_hora!==''?formatMoney(f.valor_hora):'',
 ({disponivel:'Disponível',sob_consulta:'Disponibilidade sob consulta',indisponivel:'Indisponível no momento'})[f.disponibilidade]||''
].filter(Boolean);
const reputation=reviews=>{
 const ratings=reviews.map(x=>Number(x.nota)).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);
 return ratings.length?'<span class="cx-fa-review-star" aria-hidden="true">★</span> '+(ratings.reduce((a,b)=>a+b,0)/ratings.length).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' <small>('+ratings.length+' avaliações)</small>':'<span class="cx-fa-new">Novo na comunidade</span>';
};
function contactLinks(f,index){
 let html='';
 if(f.linkedin)html+='<button type="button" class="cx-fa-contact" data-crm-contact="freelancers" data-index="'+index+'" data-channel="linkedin">LinkedIn</button>';
 if(f.contato)html+='<button type="button" class="cx-fa-contact" data-crm-contact="freelancers" data-index="'+index+'" data-channel="whatsapp">WhatsApp</button>';
 const url=typeof crmSafeUrl==='function'?crmSafeUrl(f.portfolio):'';
 if(url)html+='<a class="cx-fa-contact" href="'+safe(url)+'" rel="noopener noreferrer" target="_blank">Portfólio</a>';
 return html;
}
function avatar(f){
 const url=photo(f.foto_url);
 return '<span class="cx-fa-avatar">'+(url?'<img src="'+safe(url)+'" alt="Foto de '+safe(f.nome)+'" loading="lazy" width="50" height="50">':safe(initials(f.nome)))+'</span>';
}
function render(f,index,reviews){
 const info=meta(f),skill=tags(f),extra=String(f.ferramentas||'').split(/[,;]/).filter(s=>s.trim()).length-skill.length;
 return '<article class="pro-card cx-fa-card" data-cx-freelancer-id="'+safe(f.id)+'">'+
 '<div class="cx-fa-head">'+avatar(f)+'<div class="cx-fa-identity"><h3>'+safe(f.nome||'Profissional')+'</h3><p>'+safe(title(f))+'</p><span class="cx-fa-tag">'+safe(f.categoria||'Freelancer')+'</span></div></div>'+
 (info.length?'<div class="cx-fa-meta">'+info.map(x=>'<span>'+safe(x)+'</span>').join('')+'</div>':'')+
 '<p class="cx-fa-bio">'+safe(f.bio||'Este profissional ainda não informou uma apresentação.')+'</p>'+
 (skill.length?'<div class="cx-fa-skills">'+skill.map(x=>'<span>'+safe(x)+'</span>').join('')+(extra>0?'<span>+'+extra+'</span>':'')+'</div>':'')+
 '<div class="cx-fa-actions"><button class="cx-fa-proposal" type="button" onclick="CXConnections.request('+index+')">Solicitar proposta</button><button type="button" class="cx-fa-profile" onclick="CXFreelancerCards.open('+index+')">Ver perfil</button></div>'+
 '<div class="cx-fa-bottom"><span>'+reputation(reviews)+'</span><button type="button" class="cx-fa-review-trigger" onclick="CXFreelancerCards.open('+index+',true)">Avaliar</button></div></article>';
}
function open(index,openReview=false){
 const f=typeof FREELANCERS!=='undefined'?FREELANCERS[index]:null;
 if(!f)return;
 const reviews=(window.FL_REVIEWS||[]).filter(r=>r.freelancer_nome===f.nome);
 document.getElementById('cxFreelancerDetails')?.remove();
 const host=document.createElement('div');host.id='cxFreelancerDetails';host.className='cx-fa-overlay';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Perfil freelancer');
 host.innerHTML='<section class="cx-fa-modal"><div class="cx-fa-modal-head">'+avatar(f)+'<div><h2>'+safe(f.nome||'Profissional')+'</h2><p>'+safe(title(f))+'</p></div><button class="cx-fa-close" type="button" aria-label="Fechar detalhes">Fechar</button></div>'+
 (meta(f).length?'<div class="cx-fa-meta">'+meta(f).map(x=>'<span>'+safe(x)+'</span>').join('')+'</div>':'')+
 '<h3>Sobre</h3><p class="cx-fa-fullbio">'+safe(f.bio||'Apresentação não informada.')+'</p>'+
 (f.ferramentas?'<h3>Competências</h3><div class="cx-fa-skills">'+String(f.ferramentas).split(/[,;]/).filter(Boolean).map(v=>'<span>'+safe(v.trim())+'</span>').join('')+'</div>':'')+
 (contactLinks(f,index)?'<h3>Contato</h3><div class="cx-fa-contacts">'+contactLinks(f,index)+'</div>':'')+
 (typeof crmReviewSection==='function'?crmReviewSection('freelancer',f.nome,reviews):'')+
 '<footer class="cx-fa-modal-footer"><button type="button" class="cx-fa-proposal" onclick="CXConnections.request('+index+')">Solicitar proposta</button><button class="cx-fa-own" type="button" onclick="CXConnections.request('+index+',true)">Este perfil é meu</button></footer></section>';
 const close=()=>{document.removeEventListener('keydown',key);host.remove();};
 const key=e=>{if(e.key==='Escape')close();};
 host.querySelector('.cx-fa-close').addEventListener('click',close);
 host.addEventListener('click',e=>{if(e.target===host)close();});
 document.addEventListener('keydown',key);document.body.append(host);
 if(openReview){const d=host.querySelector('.crm-review-box details');if(d)d.open=true;}
 host.querySelector('.cx-fa-close').focus();
}
window.CXFreelancerCards=Object.freeze({render,open});
})();
