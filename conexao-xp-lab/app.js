/* Conexão XP Lab · dados totalmente fictícios · nenhum acesso ao Supabase */
(()=>{
'use strict';
const KEY='conexaocrm_xp_lab_v1';
const $=id=>document.getElementById(id);
const DEFAULT={coins:360,xp:580,equipped:{hair:'bob',shirt:'crm',bg:'sunset',accessory:'none',badge:'star'},owned:[],missions:[],recommendations:[]};
const CATS=[['hair','Cabelos'],['shirt','Roupas'],['bg','Fundos'],['accessory','Acessórios'],['badge','Emblemas']];
const ITEMS=[
{id:'hair-bob',type:'hair',value:'bob',name:'Corte clássico',symbol:'✂',cost:0,description:'Um clássico para começar.'},
{id:'hair-curly',type:'hair',value:'curly',name:'Cachos com estilo',symbol:'〰',cost:70,description:'Cachos com volume natural.'},
{id:'hair-pixie',type:'hair',value:'pixie',name:'Pixie criativo',symbol:'✂',cost:95,description:'Novo visual, novas ideias.'},
{id:'hair-blue',type:'hair',value:'blue',name:'Mechas futuristas',symbol:'✦',cost:130,description:'Cor para inovar.'},
{id:'shirt-crm',type:'shirt',value:'crm',name:'CRM não é disparo',symbol:'▤',cost:0,description:'A frase favorita de quem vive CRM.'},
{id:'shirt-cx',type:'shirt',value:'cx',name:'Cliente no centro',symbol:'♡',cost:55,description:'Coleção CX e CS.'},
{id:'shirt-ti',type:'shirt',value:'ti',name:'API é vida',symbol:'⌘',cost:85,description:'Coleção Dados e Tecnologia.'},
{id:'shirt-mentor',type:'shirt',value:'mentor',name:'Mentoria transforma',symbol:'♛',cost:null,unlock:'webinar',description:'Exclusiva de quem conduz um webinar.'},
{id:'bg-sunset',type:'bg',value:'sunset',name:'Pôr do sol laranja',symbol:'◒',cost:0,description:'A assinatura da comunidade.'},
{id:'bg-orbit',type:'bg',value:'orbit',name:'Universo CRM',symbol:'✧',cost:75,description:'Conexões em órbita.'},
{id:'bg-grid',type:'bg',value:'grid',name:'Laboratório digital',symbol:'▦',cost:95,description:'Para explorar ideias.'},
{id:'bg-lilac',type:'bg',value:'lilac',name:'Lavanda suave',symbol:'◌',cost:45,description:'Uma nova cor de fundo.'},
{id:'accessory-none',type:'accessory',value:'none',name:'Sem acessórios',symbol:'○',cost:0,description:'Um visual clean.'},
{id:'accessory-glasses',type:'accessory',value:'glasses',name:'Óculos geek',symbol:'◎',cost:45,description:'Para quem ama uma boa análise.'},
{id:'accessory-headphones',type:'accessory',value:'headphones',name:'Fone de concentração',symbol:'♫',cost:95,description:'Modo foco ativado.'},
{id:'accessory-coffee',type:'accessory',value:'coffee',name:'Café de reunião',symbol:'☕',cost:65,description:'Prioridades e café.'},
{id:'badge-star',type:'badge',value:'star',name:'Primeira conexão',symbol:'★',cost:0,description:'Seu primeiro emblema.'},
{id:'badge-mic',type:'badge',value:'mic',name:'Host da Comunidade',symbol:'♬',cost:null,unlock:'webinar',description:'Só para quem compartilha conhecimento.'},
{id:'badge-flame',type:'badge',value:'flame',name:'Conector incansável',symbol:'✦',cost:null,unlock:'content',description:'Conteúdo original aprovado.'},
{id:'badge-crown',type:'badge',value:'crown',name:'Lenda Conexão XP',symbol:'♛',cost:null,minXP:1000,description:'Alcance 1.000 XP.'}
];
const SKILLS=[['CRM Estratégico',28],['Salesforce',24],['Customer Experience',19],['Marketing Cloud',16],['Análise de Dados',12]];
const MISSIONS=[
{id:'webinar',name:'Ministrar um webinar gratuito',subtitle:'Aula de demonstração concluída',icon:'♬',xp:120,coins:75},
{id:'content',name:'Publicar conteúdo original',subtitle:'Publicação de demonstração aprovada',icon:'✎',xp:90,coins:55},
{id:'welcome',name:'Ajudar alguém da comunidade',subtitle:'Contribuição de demonstração verificada',icon:'♡',xp:50,coins:35}
];
const RANKINGS={
profissionais:{description:'Destaques por recomendações nas cinco principais habilidades.',unit:'recomendações',
 items:[
 {name:'Marina Lopes',role:'CRM & Lifecycle',points:84,hair:'curly',shirt:'crm',bg:'sunset',badge:'star'},
 {name:'Rafa Dias',role:'Customer Success',points:72,hair:'pixie',shirt:'cx',bg:'lilac',badge:'mic'},
 {name:'Lívia Souza',role:'Salesforce Marketing',points:65,hair:'blue',shirt:'ti',bg:'orbit',badge:'star'},
 {name:'Pedro Reis',role:'Growth & Analytics',points:54,hair:'bob',shirt:'ti',bg:'grid',badge:'flame'},
 {name:'Cami Andrade',role:'Customer Experience',points:47,hair:'curly',shirt:'cx',bg:'lilac',badge:'star'},
 {name:'Alex Lima',role:'RevOps',points:40,hair:'pixie',shirt:'crm',bg:'grid',badge:'star'}]},
comunidade:{description:'Pessoas que compartilham conhecimento e ajudam outros membros.',unit:'XP de contribuição',
 items:[
 {name:'Bruno Costa',role:'Mentor de CRM',points:1450,hair:'pixie',shirt:'mentor',bg:'orbit',badge:'mic'},
 {name:'Ana Martins',role:'Liderança em CX',points:1220,hair:'curly',shirt:'cx',bg:'sunset',badge:'flame'},
 {name:'Luiza Rocha',role:'Community Builder',points:1080,hair:'blue',shirt:'crm',bg:'lilac',badge:'star'},
 {name:'Renan Melo',role:'Especialista em Dados',points:950,hair:'bob',shirt:'ti',bg:'grid',badge:'mic'},
 {name:'Bia Franco',role:'Professora de CRM',points:840,hair:'curly',shirt:'mentor',bg:'orbit',badge:'star'},
 {name:'Dani Alves',role:'Profissional de CS',points:780,hair:'pixie',shirt:'cx',bg:'sunset',badge:'star'}]},
empresas:{description:'Parceiras reconhecidas pelo impacto comprovado na comunidade, não por patrocínio.',unit:'pontos de impacto',
 items:[
 {name:'Empresa Aurora',role:'Formação e webinars',points:980,logo:'A'},
 {name:'Empresa Prisma',role:'Vagas e oportunidades',points:860,logo:'P'},
 {name:'Empresa Horizonte',role:'Eventos de carreira',points:740,logo:'H'},
 {name:'Empresa Vértice',role:'Mentorias gratuitas',points:660,logo:'V'},
 {name:'Empresa Nexo',role:'Conteúdo educacional',points:530,logo:'N'},
 {name:'Empresa Farol',role:'Apoio à comunidade',points:470,logo:'F'}]}
};
let state=load(),activeTab='hall',rankType='profissionais',period='mes',category='shirt',toastTimer=0;
const num=n=>Math.max(0,Math.floor(Number(n)||0));
function load(){
 try{
  const s=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!s||typeof s!=='object')return structuredClone(DEFAULT);
  return {coins:Math.min(99999,num(s.coins)),xp:Math.min(99999,num(s.xp)),
   equipped:{...DEFAULT.equipped,...Object.fromEntries(Object.entries(s.equipped||{}).filter(([type,value])=>CATS.some(c=>c[0]===type)&&ITEMS.some(i=>i.type===type&&i.value===value)))},
   owned:Array.isArray(s.owned)?s.owned.filter(x=>ITEMS.some(i=>i.id===x)).slice(0,40):[],
   missions:Array.isArray(s.missions)?s.missions.filter(x=>MISSIONS.some(m=>m.id===x)).slice(0,5):[],
   recommendations:Array.isArray(s.recommendations)?s.recommendations.filter(x=>SKILLS.some(k=>k[0]===x)).slice(0,5):[]};
 }catch{return structuredClone(DEFAULT);}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function notify(text){
 const node=$('toast');node.textContent=text;node.hidden=false;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.hidden=true,2800);
}
function level(){return Math.max(1,Math.floor(state.xp/100)+1);}
function unlocked(item){
 return item.cost!==null||Boolean((item.unlock&&state.missions.includes(item.unlock))||(item.minXP&&state.xp>=item.minXP));
}
function owned(item){return item.cost===0||state.owned.includes(item.id)||item.cost===null&&unlocked(item);}
function equip(item){
 if(!unlocked(item)){notify('Este item só é liberado por conquista.');return;}
 if(!owned(item)){
  if(state.coins<item.cost){notify('Você precisa de mais Coins para este item.');return;}
  state.coins-=item.cost;state.owned.push(item.id);
  notify(item.name+' adquirido!');
 }else notify(item.name+' equipado!');
 state.equipped[item.type]=item.value;save();render();
}
let svgSerial=0;
function avatarSvg(config={},compact=false){
 const c={...DEFAULT.equipped,...config};
 const backgrounds={
  sunset:['#e5b68a','#995a3e'],orbit:['#4a517b','#191f42'],
  grid:['#475d62','#202e35'],lilac:['#bba4db','#78648e']
 };
 const bg=backgrounds[c.bg]||backgrounds.sunset;
 const id='cx-xp-svg-'+(++svgSerial);
 const hair={
  bob:{base:'#29211e',front:'M51 98 Q48 29 97 29 Q151 24 151 93 L151 118 Q138 130 130 121 L126 75 Q101 57 74 78 L70 121 Q50 127 51 98Z'},
  curly:{base:'#4a2920',front:'M48 94 Q40 76 50 60 Q43 46 65 45 Q68 26 84 35 Q99 18 114 33 Q140 25 146 48 Q163 58 151 76 Q158 96 143 112 Q137 105 137 82 Q126 63 107 69 Q80 63 63 88 L62 113 Q46 112 48 94Z'},
  pixie:{base:'#603c25',front:'M54 84 Q50 47 78 38 Q93 25 116 35 Q146 34 145 67 Q124 62 113 52 Q99 73 71 74 L65 105 Q51 101 54 84Z'},
  blue:{base:'#213c55',front:'M46 89 Q45 28 92 28 Q152 23 150 94 L146 133 Q137 138 130 124 L128 77 Q107 52 74 80 L69 132 Q51 134 46 89Z'}
 };
 const h=hair[c.hair]||hair.bob;
 const tshirt={crm:['#f97316','CRM'],cx:['#e4c6bd','CX'],ti:['#4e7082','TI'],mentor:['#754d8e','MENTOR']};
 const sh=tshirt[c.shirt]||tshirt.crm;
 const acc=c.accessory==='glasses'?'<rect x="65" y="92" width="29" height="19" rx="8" fill="none" stroke="#262423" stroke-width="3"/><rect x="103" y="92" width="29" height="19" rx="8" fill="none" stroke="#262423" stroke-width="3"/><path d="M94 98h9" stroke="#262423" stroke-width="3"/>':
 c.accessory==='headphones'?'<path d="M56 105V83 Q56 37 100 37 Q144 37 144 83V105" stroke="#292929" stroke-width="8" fill="none"/><rect x="51" y="85" width="13" height="34" rx="6" fill="#1c2029"/><rect x="136" y="85" width="13" height="34" rx="6" fill="#1c2029"/>':
 c.accessory==='coffee'?'<path d="M154 164h22v21q-11 9-22 0z M176 169q16-2 7 13h-7" fill="#fcf2e6" stroke="#724f3b" stroke-width="2"/>':'';
 const badge={star:'★',mic:'♫',flame:'✦',crown:'♛'}[c.badge]||'★';
 const cx=100;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" role="img" aria-label="Avatar ilustrado personalizável">'+
 '<defs><linearGradient id="g-'+id+'" x1="0" x2="1" y1="0" y2="1"><stop stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient><clipPath id="clip-'+id+'"><circle cx="100" cy="105" r="87"/></clipPath></defs>'+
 '<circle cx="'+cx+'" cy="105" r="89" fill="#ffdaa9"/><circle cx="100" cy="105" r="87" fill="url(#g-'+id+')"/>'+
 '<g clip-path="url(#clip-'+id+')">'+
 (c.bg==='orbit'?'<circle cx="52" cy="59" r="3" fill="#ddd7ff"/><circle cx="148" cy="83" r="2" fill="#fff"/><path d="M13 112Q100 8 184 105" stroke="#8c8bca" fill="none" stroke-width="2"/>':'')+
 (c.bg==='grid'?'<path d="M0 65h200M0 105h200M0 145h200M48 0v210M100 0v210M150 0v210" fill="none" stroke="#94aaa8" opacity=".28"/>':'')+
 '<path d="M23 210 Q27 158 78 153 Q98 143 122 153 Q171 158 176 210Z" fill="'+sh[0]+'"/>'+
 '<path d="M78 155L99 178 122 155" fill="none" stroke="#ffffff" stroke-width="4" opacity=".4"/>'+
 '<path d="M87 143v23q13 14 26 0v-23" fill="#bd7a5b"/>'+
 '<ellipse cx="100" cy="104" rx="44" ry="54" fill="#d69a79"/>'+
 '<path d="M60 103q-13-9-9 7t14 9M140 103q13-9 9 7t-14 9" fill="#d69a79"/>'+
 '<path d="'+h.front+'" fill="'+h.base+'"/>'+
 '<path d="M74 96q8-5 16 1m20 0q8-6 16-1" fill="none" stroke="#493227" stroke-width="2.5" stroke-linecap="round"/>'+
 '<circle cx="83" cy="102" r="2.7" fill="#342720"/><circle cx="116" cy="102" r="2.7" fill="#342720"/>'+
 '<path d="M99 103l-2 13h6" fill="none" stroke="#b77456" stroke-width="2"/>'+
 '<path d="M91 125q9 7 19 0" fill="none" stroke="#9a574c" stroke-width="2.5" stroke-linecap="round"/>'+
 '<text x="99" y="199" fill="'+(c.shirt==='cx'?'#4f2d31':'#fff2d6')+'" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="'+(sh[1].length>3?'14':'22')+'">'+sh[1]+'</text>'+acc+
 '</g>'+
 '<circle cx="160" cy="36" r="22" fill="#211914" stroke="#ffc88b" stroke-width="4"/>'+
 '<text x="160" y="45" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="25" fill="#ffc387">'+badge+'</text>'+
 '</svg>';
}
function renderWallet(){
 $('topCoins').textContent=state.coins.toLocaleString('pt-BR');
 $('storeCoins').textContent=state.coins.toLocaleString('pt-BR')+' Coins';
 $('achieveXP').textContent=state.xp.toLocaleString('pt-BR')+' XP';
}
function renderRankings(){
 const data=RANKINGS[rankType];
 $('rankingDescription').textContent=data.description;
 document.querySelectorAll('[data-ranking]').forEach(b=>{const active=b.dataset.ranking===rankType;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const metric=(p)=>Math.round(p*(period==='geral'?2.5:1)).toLocaleString('pt-BR')+' '+data.unit;
 const face=(entry,cls)=>{
  if(entry.logo)return '<div class="'+cls.replace('face','logo')+'" aria-label="Logo ilustrativo">'+entry.logo+'</div>';
  return '<div class="'+cls+'">'+avatarSvg(entry,true)+'</div>';
 };
 const podiumOrder=[1,0,2];
 $('podium').innerHTML=podiumOrder.map(i=>{
  const r=data.items[i],value=Math.round(100*r.points/data.items[0].points);
  return '<article class="podium-card '+(i===0?'top':'')+'">'+
   '<span class="podium-place">'+(i+1)+'º</span><span class="podium-medal" aria-hidden="true">'+(i===0?'🥇':i===1?'🥈':'🥉')+'</span>'+
   face(r,'rank-face')+'<h3>'+r.name+'</h3><span class="role">'+r.role+'</span>'+
   '<strong class="points">'+metric(r.points)+'</strong><div class="podium-bar" aria-hidden="true"><span style="width:'+value+'%"></span></div></article>';
 }).join('');
 $('rankingRows').innerHTML=data.items.slice(3).map((r,i)=>
  '<div class="rank-row"><span class="rank-pos">'+(i+4)+'º</span>'+
   face(r,'row-face')+'<div class="row-copy"><strong>'+r.name+'</strong><span>'+r.role+'</span></div>'+
   '<span class="row-points">'+metric(r.points)+'</span></div>').join('');
}
function renderSkills(){
 $('skillsList').innerHTML=SKILLS.map(([name,count])=>{
  const recommended=state.recommendations.includes(name);
  return '<button class="skill-btn '+(recommended?'chosen':'')+'" type="button" data-skill="'+name+'" aria-pressed="'+recommended+'"><strong>'+
    (recommended?'✓ ':'+ ')+name+'</strong><span>'+(count+(recommended?1:0))+' recomendações</span></button>';
 }).join('');
}
function renderAvatar(){
 $('bigAvatar').innerHTML=avatarSvg(state.equipped);
 $('levelLabel').textContent='Nível '+level()+' · '+(level()>=10?'Referência':level()>=6?'Conector':'Explorador');
 $('levelMini').textContent='LV '+level();
 $('xpFill').style.width=(state.xp%100)+'%';
 $('xpText').textContent=state.xp+' XP · '+(100-(state.xp%100))+' XP para o próximo nível';
 document.querySelectorAll('[data-category]').forEach(btn=>{const active=btn.dataset.category===category;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
 $('avatarCategories').innerHTML=CATS.map(([id,name])=>'<button class="category-tab '+(category===id?'active':'')+'" type="button" data-category="'+id+'" aria-pressed="'+(category===id)+'">'+name+'</button>').join('');
 $('avatarItems').innerHTML=ITEMS.filter(i=>i.type===category).map(i=>itemCard(i,false)).join('');
}
function itemCard(item,store){
 const available=unlocked(item),has=owned(item),equipped=state.equipped[item.type]===item.value;
 const price=item.cost===null?(available?'Desbloqueado por conquista':item.minXP?item.minXP+' XP para desbloquear':'Desbloqueado por missão'):
 item.cost===0?'Gratuito':has?'Adquirido':item.cost+' Coins';
 const action=equipped?'Em uso':!available?'Bloqueado':has?'Equipar':state.coins>=item.cost?'Resgatar':'Coins insuficientes';
 const body='<span class="item-symbol" aria-hidden="true">'+item.symbol+'</span>'+
 '<span class="item-name">'+item.name+'</span><span class="item-note">'+price+'</span>'+
 (store?'<p>'+item.description+'</p>':'')+
 '<button class="item-action" type="button" data-item="'+item.id+'" '+(equipped||!available||(!has&&state.coins<item.cost)?'disabled':'')+'>'+action+'</button>';
 return store?'<article class="store-item">'+body+'</article>':'<div class="inventory-item '+(equipped?'equipped':'')+'">'+body+'</div>';
}
function renderStore(){
 $('storeCards').innerHTML=ITEMS.filter(i=>i.cost!==0).map(i=>itemCard(i,true)).join('');
}
function renderAchievements(){
 const data=[
  ['★','Primeira Conexão','Começou sua jornada no Conexão XP.',true],
  ['♬','Voz da Comunidade','Concluiu uma apresentação ou webinar.',state.missions.includes('webinar')],
  ['✎','Criador de Conteúdo','Compartilhou um conteúdo original.',state.missions.includes('content')],
  ['♡','Conector Solidário','Ajudou uma pessoa da comunidade.',state.missions.includes('welcome')],
  ['✦','Em Evolução','Alcançou o nível 6.',level()>=6],
  ['♛','Lenda Conexão XP','Alcançou 1.000 XP.',state.xp>=1000]
 ];
 $('achievementCards').innerHTML=data.map(([symbol,title,desc,unlocked])=>
  '<article class="achievement '+(unlocked?'':'locked')+'"><div class="achievement-icon" aria-hidden="true">'+(unlocked?symbol:'♧')+'</div><h3>'+title+'</h3><p>'+desc+'</p><div class="state">'+(unlocked?'Conquistado ✓':'Ainda não desbloqueado')+'</div></article>').join('');
 $('missionsList').innerHTML=MISSIONS.map(m=>{
  const done=state.missions.includes(m.id);
  return '<div class="mission-row"><span class="mission-icon" aria-hidden="true">'+m.icon+'</span>'+
  '<div class="copy"><strong>'+m.name+'</strong><span>'+m.subtitle+' · +'+m.xp+' XP · +'+m.coins+' Coins</span></div>'+
  '<button type="button" data-mission="'+m.id+'" '+(done?'disabled':'')+'>'+(done?'Concluída ✓':'Simular')+'</button></div>';
 }).join('');
}
function completeMission(id){
 const m=MISSIONS.find(x=>x.id===id);
 if(!m||state.missions.includes(id))return;
 state.missions.push(id);state.xp+=m.xp;state.coins+=m.coins;
 save();render();notify('Missão de demonstração concluída! +'+m.xp+' XP e +'+m.coins+' Coins');
}
function recommend(name){
 if(!SKILLS.some(([skill])=>skill===name))return;
 if(state.recommendations.includes(name)){notify('Você já recomendou esta habilidade na demonstração.');return;}
 state.recommendations.push(name);save();renderSkills();notify('Recomendação demonstrativa adicionada');
}
function switchTab(tab){
 if(!['hall','avatar','loja','conquistas'].includes(tab))tab='hall';
 activeTab=tab;
 document.querySelectorAll('.tab').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
 document.querySelectorAll('.pane').forEach(p=>p.hidden=p.id!=='pane-'+tab);
 if(location.hash!=='#'+tab)history.replaceState(null,'','#'+tab);
}
function render(){
 renderWallet();renderRankings();renderSkills();renderAvatar();renderStore();renderAchievements();
}
function celebrate(open){
 $('celebration').hidden=!open;
 if(open)$('closeCelebrate').focus();
 else $('celebrate').focus();
}
function reset(){
 if(!window.confirm('Recomeçar a demonstração? Isso zera somente seu progresso de teste neste navegador.'))return;
 state=structuredClone(DEFAULT);save();render();switchTab('hall');notify('Demonstração reiniciada');
}
function share(){
 const url='https://conexaocrm.com/conexao-xp-lab/';
 if(navigator.share){navigator.share({title:'Conexão XP · Conexão CRM',text:'Conheça o protótipo de gamificação do Conexão CRM.',url}).catch(()=>{});return;}
 if(navigator.clipboard?.writeText){navigator.clipboard.writeText(url).then(()=>notify('Link copiado')).catch(()=>window.prompt('Copie o endereço:',url));return;}
 window.prompt('Copie o endereço:',url);
}
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-tab]');if(tab){switchTab(tab.dataset.tab);return;}
 const rank=e.target.closest('[data-ranking]');if(rank){rankType=rank.dataset.ranking;renderRankings();return;}
 const cat=e.target.closest('[data-category]');if(cat){category=cat.dataset.category;renderAvatar();return;}
 const item=e.target.closest('[data-item]');if(item){const obj=ITEMS.find(x=>x.id===item.dataset.item);if(obj)equip(obj);return;}
 const skill=e.target.closest('[data-skill]');if(skill){recommend(skill.dataset.skill);return;}
 const mission=e.target.closest('[data-mission]');if(mission){completeMission(mission.dataset.mission);return;}
});
$('rankingPeriod').addEventListener('change',e=>{period=e.target.value;renderRankings();});
$('resetDemo').addEventListener('click',reset);
$('shareLab').addEventListener('click',share);
$('celebrate').addEventListener('click',()=>celebrate(true));
$('closeCelebrate').addEventListener('click',()=>celebrate(false));
$('celebrateOk').addEventListener('click',()=>celebrate(false));
$('celebration').addEventListener('click',e=>{if(e.target===$('celebration'))celebrate(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('celebration').hidden)celebrate(false);});
window.addEventListener('hashchange',()=>switchTab(location.hash.slice(1)));
render();switchTab(location.hash.slice(1)||'hall');
})();