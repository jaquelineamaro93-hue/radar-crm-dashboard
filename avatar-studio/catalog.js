/* Conexão CRM Avatar Studio: layered, freely combinable physical traits */
(function(){
'use strict';
const groups=[
['liso','Lisos',['Liso curto','Bob liso','Liso longo','Chanel assimétrico','Rabo de cavalo','Coque com franja']],
['ondulado','Ondulados',['Ondas suaves','Long bob ondulado','Ondulado longo','Ondulado com franja','Semi preso','Coque ondulado']],
['cacheado','Cacheados',['Cachos curtos','Cachos médios','Cachos longos','Cacheado volumoso','Coque cacheado','Cachos definidos com franja']],
['crespo','Crespos',['Crespo curtinho','Crespo arredondado','Crespo longo','Puff alto','Coque crespo','Crespo definido']],
['afro','Afro',['Black power curto','Afro médio','Afro volumoso','Afro arredondado','Afro com faixa','Afro lateral']],
['trancado','Tranças e protetivos',['Duas tranças','Trança lateral','Box braids longas','Box braids curtas','Coque com tranças','Bantu knots']]
];
const hairs=groups.flatMap(([group,label,names])=>names.map((name,i)=>({id:group+'-'+String(i+1).padStart(2,'0'),name,group,groupLabel:label,cost:i<2?0:i===5?null:[60,85,100][i-2],unlock:i===5?'Conquista':null})));
const colors=[
 ['color-01','Preto','#1d1a21'],['color-02','Castanho escuro','#39231f'],
 ['color-03','Castanho médio','#714735'],['color-04','Castanho claro','#9d6a46'],
 ['color-05','Loiro escuro','#a8834e'],['color-06','Loiro claro','#e5bf7b'],
 ['color-07','Ruivo cobre','#bc5a2e'],['color-08','Grisalho','#8c8f99'],
 ['color-09','Platinado','#dedbd7',35],['color-10','Rosa','#d3689b',45],
 ['color-11','Azul','#3d77ba',null],['color-12','Roxo','#8055ad',null]
 ].map(([id,name,color,cost=0])=>({id,name,color,cost}));
const skins=[
 ['skin-01','Clara rosada','#f7d5bd'],['skin-02','Clara neutra','#ebbc9c'],
 ['skin-03','Média dourada','#d69a79'],['skin-04','Média oliva','#b9805c'],
 ['skin-05','Escura quente','#855239'],['skin-06','Escura profunda','#4b2c23']
].map(([id,name,color])=>({id,name,color,cost:0}));
const faces=['Oval','Redondo','Alongado','Coração','Quadrado','Diamante'].map((name,i)=>({id:'face-'+String(i+1).padStart(2,'0'),name,cost:0}));
const eyes=['Naturais','Arredondados','Amendoados','Expressivos','Delicados','Definidos'].map((name,i)=>({id:'eyes-'+String(i+1).padStart(2,'0'),name,cost:0}));
const mouths=['Sorriso suave','Sorriso aberto','Neutro','Sorriso discreto','Expressivo','Lábios definidos'].map((name,i)=>({id:'mouth-'+String(i+1).padStart(2,'0'),name,cost:0}));
const presentation=[{id:'neutro',name:'Neutro',cost:0},{id:'feminino',name:'Feminino',cost:0},{id:'masculino',name:'Masculino',cost:0}];
const shirts=[{id:'crm',name:'CRM não é disparo',cost:0},{id:'cx',name:'Cliente no centro',cost:55},{id:'ti',name:'API é vida',cost:85},{id:'mentor',name:'Mentoria transforma',cost:null}];
const backgrounds=[{id:'sunset',name:'Laranja Conexão',cost:0},{id:'lilac',name:'Lavanda',cost:45},{id:'orbit',name:'Universo CRM',cost:75},{id:'grid',name:'Laboratório',cost:95}];
const accessories=[{id:'none',name:'Sem acessório',cost:0},{id:'glasses',name:'Óculos',cost:45},{id:'headphones',name:'Fones',cost:95},{id:'coffee',name:'Café',cost:65}];
const badges=[{id:'star',name:'Primeira conexão',cost:0},{id:'mic',name:'Host de webinar',cost:null},{id:'flame',name:'Criador de conteúdo',cost:null},{id:'crown',name:'Destaque da comunidade',cost:null}];
const defaultConfig={hair_style:'liso-01',hair_color:'color-02',skin:'skin-03',face:'face-01',eyes:'eyes-02',mouth:'mouth-01',presentation:'neutro',shirt:'crm',bg:'sunset',accessory:'none',badge:'star'};
const catalogs={hair_style:hairs,hair_color:colors,skin:skins,face:faces,eyes,mouth:mouths,presentation,shirt:shirts,bg:backgrounds,accessory:accessories,badge:badges};
const labels={hair_style:'Penteados',hair_color:'Cor do cabelo',skin:'Tom de pele',face:'Formato de rosto',eyes:'Olhos',mouth:'Expressão',presentation:'Apresentação',shirt:'Camisetas',bg:'Fundos',accessory:'Acessórios',badge:'Emblemas'};
const itemKey=(field,id)=>({hair_style:'hair-'+id,hair_color:id,skin:'skin-'+id,face:'face-'+id,eyes:'eyes-'+id,mouth:'mouth-'+id,presentation:'presentation-'+id,shirt:'shirt-'+id,bg:'bg-'+id,accessory:'accessory-'+id,badge:'badge-'+id})[field];
const find=(field,id)=>catalogs[field]?.find(x=>x.id===id);
const attr=(x)=>String(x).replace(/[&"<>]/g,'');
function hairSvg(group,variant,color){
 const v=Number(variant),dark=color,stroke='#ffffff26';
 let out='';
 const cluster=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+dark+'" stroke="'+stroke+'" stroke-width="1"/>';
 const roots='<path d="M92 132Q86 70 152 72Q219 70 208 134Q193 110 183 103Q150 88 120 104Q112 119 92 132Z" fill="'+dark+'"/>';
 if(group==='liso'){
  const paths=[
   'M96 128Q93 73 150 73Q216 74 206 128L201 155Q187 162 188 135Q185 94 150 94Q117 93 113 137L111 150Q97 155 96 128Z',
   'M94 132Q84 75 151 73Q218 74 211 130L215 197Q201 211 185 199L191 135Q187 95 151 94Q116 94 113 135L113 199Q99 211 84 196Z',
   'M92 128Q86 72 150 68Q215 67 213 128L228 279Q211 293 183 274L190 134Q189 94 149 94Q111 93 112 135L116 277Q93 294 70 281Z',
   'M89 128Q84 73 154 72Q223 75 203 138L227 206Q194 221 182 181L189 131Q185 93 155 97Q127 91 105 117L105 184Q88 194 80 176Z',
   'M94 130Q78 74 153 73Q208 75 205 129Q201 111 183 95Q140 94 118 114L112 154Q95 160 94 130Z',
   'M95 130Q89 75 150 71Q214 76 204 131L211 161Q182 154 187 127Q169 101 145 104Q121 101 110 129L110 151Q93 152 95 130Z'];
  out='<path d="'+paths[v-1]+'" fill="'+dark+'"/>';
  if(v===5)out+='<path d="M196 113Q239 93 233 159Q228 204 215 217L207 209Q228 151 201 132Z" fill="'+dark+'"/>';
  if(v===6)out+='<ellipse cx="155" cy="66" rx="29" ry="27" fill="'+dark+'"/>';
 }else if(group==='ondulado'){
  out='<path d="M94 130Q80 65 149 69Q223 61 210 135Q196 107 176 99Q143 85 119 108L110 134Z" fill="'+dark+'"/>';
  const n=v===1?3:v===2?5:v===3?8:v===4?5:v===5?4:6;
  for(let i=0;i<n;i++){
   const y=115+i*22;
   for(const side of [-1,1]){let x=150+side*(v===2?54:65);out+='<path d="M'+x+' '+y+'q'+(side*20)+' 9 0 20q'+(-side*9)+' 3 '+(side*2)+' 11" fill="none" stroke="'+dark+'" stroke-width="'+(v===3?20:17)+'" stroke-linecap="round"/>';}
  }
  if(v===4)out+='<path d="M112 94Q154 130 196 94" stroke="'+dark+'" stroke-width="17" fill="none"/>';
  if(v===5||v===6)out+='<ellipse cx="150" cy="68" rx="'+(v===5?35:43)+'" ry="21" fill="'+dark+'"/>';
 }else if(group==='cacheado'||group==='crespo'||group==='afro'){
  const afro=group==='afro',coily=group==='crespo';
  const rowCount=afro?6:coily?5:4;
  const radius=afro?24:coily?14:19;
  const hairWidth=afro?(v===3?103:v===1?77:90):coily?(v===1?62:76):v===4?85:70;
  const height=(v===1?65:v===3?110:v===4?87:80);
  for(let row=0;row<rowCount;row++){
   const y=115-row*16;
   const width=hairWidth*Math.sqrt(Math.max(.08,1-((y-118)/height)**2));
   const count=Math.max(4,Math.ceil(width*2/(radius*1.45)));
   for(let n=0;n<count;n++){const x=150-width+(count===1?0:(n*2*width/(count-1)));out+=cluster(Math.round(x),y,Math.round(radius*(.85+(row%2)*.1)));}
  }
  if(v===2||v===3||v===4||v===6){
   const length=v===3?245:v===4?169:v===6?199:180;
   const count=v===3?7:5;
   for(let side of [-1,1])for(let n=0;n<count;n++){
    const x=150+side*(57+n*5),y=125+(n%2)*10;
    for(let j=0;j<(length-y)/16;j++)out+=cluster(x+side*((j%2)*2),y+j*16,coily?13:afro?19:16);
   }
  }
  if(v===4)out+='<ellipse cx="150" cy="44" rx="39" ry="26" fill="'+dark+'"/>';
  if(v===5)out+='<ellipse cx="150" cy="54" rx="38" ry="29" fill="'+dark+'"/>';
  if(afro&&v===5)out+='<path d="M50 102Q150 52 251 102" fill="none" stroke="#e6ab74" stroke-width="8"/>';
 }else if(group==='trancado'){
  out=roots;
  if(v===5)out+='<ellipse cx="154" cy="57" rx="32" ry="24" fill="'+dark+'"/>';
  else if(v===6){
   for(let i=0;i<6;i++){const x=99+(i%3)*47,y=67+Math.floor(i/3)*32;out+=cluster(x,y,19);}
  }else{
   const n=v===1?2:v===2?1:v===3?11:v===4?9:7;
   for(let i=0;i<n;i++){
    const x=v===1?100+i*101:v===2?197:85+(i*130/Math.max(n-1,1));
    const y=124+(i%2)*7;
    const end=v===4?174:v===2?263:280;
    for(let j=0;j<(end-y)/13;j++){
     const yy=y+j*13,xx=x+Math.sin(j*2.8)*4;
     out+=cluster(Math.round(xx),yy,v===3||v===4?6:11);
    }
   }
  }
 }
 return out;
}
let serial=0;
function renderSvg(input={},small=false){
 const c={...defaultConfig,...input};
 const skin=find('skin',c.skin)?.color||skins[2].color;
 const hairColor=find('hair_color',c.hair_color)?.color||colors[1].color;
 const [group,index]=String(c.hair_style).split('-');
 const bg={sunset:['#eabb92','#925839'],lilac:['#c7b6e4','#7e698d'],orbit:['#7579b1','#252c50'],grid:['#5f8a8e','#223437']}[c.bg]||['#eabb92','#925839'];
 const shirt={crm:['#f97316',['CRM não é','disparo']],cx:['#f4d7c8',['Cliente','no centro']],ti:['#496c82',['API é','vida']],mentor:['#755092',['Mentoria','transforma']]}[c.shirt]||['#f97316',['CRM não é','disparo']];
 const face=Number(c.face.slice(-2))||1,eye=Number(c.eyes.slice(-2))||1,mouth=Number(c.mouth.slice(-2))||1;
 const rx=[0,55,61,48,52,57,51][face],ry=[0,68,64,76,65,70,68][face];
 const eyecolor='#3a251e',eyeY=147+(face===3?5:0);
 const eyeShape=eye===1?'<circle cx="128" cy="'+eyeY+'" r="4"/><circle cx="174" cy="'+eyeY+'" r="4"/>':
 eye===2?'<ellipse cx="128" cy="'+eyeY+'" rx="6" ry="4"/><ellipse cx="174" cy="'+eyeY+'" rx="6" ry="4"/>':
 eye===3?'<path d="M121 '+eyeY+'q7-7 14 0m32 0q7-7 14 0" fill="none" stroke="'+eyecolor+'" stroke-width="4"/>':
 eye===4?'<circle cx="128" cy="'+eyeY+'" r="5"/><circle cx="174" cy="'+eyeY+'" r="5"/>':
 eye===5?'<path d="M122 '+eyeY+'q6 6 12 0m34 0q6 6 12 0" fill="none" stroke="'+eyecolor+'" stroke-width="3"/>':
 '<ellipse cx="128" cy="'+eyeY+'" rx="3" ry="5"/><ellipse cx="174" cy="'+eyeY+'" rx="3" ry="5"/>';
 const smiles=[
 '<path d="M135 187q17 11 33 0"/>',
 '<path d="M133 184q18 21 37 0Z" fill="#9b4d52" stroke="#9b4d52"/><path d="M139 187h24" stroke="#f6e9dd" stroke-width="3"/>',
 '<path d="M141 188h20"/>',
 '<path d="M136 185q14 7 29 0"/>',
 '<path d="M135 181q16 17 33 0"/>',
 '<path d="M138 188q12 3 25 0"/>'][mouth-1];
 const id='cxavatar-'+(++serial),badge={star:'★',mic:'♫',flame:'✦',crown:'♛'}[c.badge]||'★';
 const neck='<path d="M133 200v33q17 16 34 0v-33" fill="'+skin+'"/>';
 const overlay=c.accessory==='glasses'?'<rect x="114" y="136" width="30" height="22" rx="8"/><rect x="159" y="136" width="30" height="22" rx="8"/><path d="M144 143h15"/>':
 c.accessory==='headphones'?'<path d="M91 152v-19q0-70 59-70t59 70v19"/><rect x="87" y="137" width="13" height="34" rx="6" fill="#292d35"/><rect x="204" y="137" width="13" height="34" rx="6" fill="#292d35"/>':
 c.accessory==='coffee'?'<path d="M225 264h25v27q-12 10-25 0zM250 267q15-1 9 16h-9" fill="#f9eada"/>':'';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" role="img" aria-label="Avatar com características combinadas" style="width:100%;height:100%">'+
 '<defs><linearGradient id="grad-'+id+'" x2="1" y2="1"><stop stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient><clipPath id="mask-'+id+'"><circle cx="150" cy="167" r="144"/></clipPath></defs>'+
 '<circle cx="150" cy="167" r="146" fill="#ffe0b4"/><circle cx="150" cy="167" r="143" fill="url(#grad-'+id+')"/>'+
 '<g clip-path="url(#mask-'+id+')">'+
 (c.bg==='grid'?'<path d="M0 110h300M0 164h300M0 218h300M60 0v340M120 0v340M180 0v340M240 0v340" fill="none" stroke="#eff" opacity=".19"/>':'')+
 '<path d="M27 340Q37 246 112 235Q150 225 188 235Q263 245 273 340Z" fill="'+shirt[0]+'"/>'+neck+
 '<ellipse cx="151" cy="152" rx="'+rx+'" ry="'+ry+'" fill="'+skin+'"/>'+
 '<path d="M96 155q-14-12-12 10t16 11M205 155q14-12 12 10t-16 11" fill="'+skin+'"/>'+
 '<path d="M118 136q10-6 21 0m24 0q10-6 21 0" stroke="#553b31" stroke-width="3.2" fill="none" stroke-linecap="round"/>'+
 '<g fill="'+eyecolor+'" stroke="'+eyecolor+'">'+eyeShape+'</g>'+
 '<path d="M150 151l-4 20 7 2" stroke="#99694e" stroke-width="2.4" fill="none"/>'+
 '<g stroke="#9f635d" stroke-width="2.8" fill="none" stroke-linecap="round">'+smiles+'</g>'+
 hairSvg(group,Number(index),hairColor)+
 '<g fill="none" stroke="#352d2b" stroke-width="3">'+overlay+'</g>'+
 '<text x="150" y="280" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="900" fill="'+(c.shirt==='cx'?'#4b3027':'#fff8eb')+'"><tspan x="150">'+shirt[1][0]+'</tspan><tspan x="150" dy="19">'+shirt[1][1]+'</tspan></text>'+
 '</g><circle cx="252" cy="60" r="25" fill="#251c17" stroke="#ffd2a2" stroke-width="4"/>'+
 '<text x="252" y="70" text-anchor="middle" font-size="31" fill="#ffc282">'+badge+'</text></svg>';
}
window.CXAvatarCatalog={groups,hairs,colors,skins,faces,eyes,mouths,presentation,shirts,backgrounds,accessories,badges,catalogs,labels,defaultConfig,itemKey,find,renderSvg};
})();