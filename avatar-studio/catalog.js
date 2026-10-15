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
const eyeColors=[['eye-color-01','Castanho escuro','#39261b'],['eye-color-02','Castanho mel','#785239'],['eye-color-03','Verde oliva','#688357'],['eye-color-04','Verde claro','#89aa7b'],['eye-color-05','Azul claro','#83a9ca'],['eye-color-06','Azul intenso','#437eaf'],['eye-color-07','Cinza','#9199a8'],['eye-color-08','Âmbar','#ad7840']].map(([id,name,color])=>({id,name,color,cost:0}));
const mouths=['Sorriso suave','Sorriso aberto','Neutro','Sorriso discreto','Expressivo','Lábios definidos'].map((name,i)=>({id:'mouth-'+String(i+1).padStart(2,'0'),name,cost:0}));
const presentation=[{id:'neutro',name:'Neutro',cost:0},{id:'feminino',name:'Feminino',cost:0},{id:'masculino',name:'Masculino',cost:0}];
const shirts=[{id:'crm',name:'CRM não é disparo',cost:0},{id:'cx',name:'Cliente no centro',cost:55},{id:'ti',name:'API é vida',cost:85},{id:'mentor',name:'Mentoria transforma',cost:null}];
const backgrounds=[{id:'sunset',name:'Laranja Conexão',cost:0},{id:'lilac',name:'Lavanda',cost:45},{id:'orbit',name:'Universo CRM',cost:75},{id:'grid',name:'Laboratório',cost:95}];
const accessories=[{id:'none',name:'Sem acessório',cost:0},{id:'glasses',name:'Óculos',cost:45},{id:'headphones',name:'Fones',cost:95},{id:'coffee',name:'Café',cost:65}];
const badges=[{id:'star',name:'Primeira conexão',cost:0},{id:'admin',name:'Equipe Conexão CRM',cost:null},{id:'mic',name:'Host de webinar',cost:null},{id:'flame',name:'Criador de conteúdo',cost:null},{id:'crown',name:'Destaque da comunidade',cost:null}];
const defaultConfig={hair_style:'liso-01',hair_color:'color-02',skin:'skin-03',face:'face-01',eyes:'eyes-02',eye_color:'eye-color-02',mouth:'mouth-01',presentation:'neutro',shirt:'crm',bg:'sunset',accessory:'none',badge:'star'};
const catalogs={hair_style:hairs,hair_color:colors,skin:skins,face:faces,eyes,eye_color:eyeColors,mouth:mouths,presentation,shirt:shirts,bg:backgrounds,accessory:accessories,badge:badges};
const labels={hair_style:'Penteados',hair_color:'Cor do cabelo',skin:'Tom de pele',face:'Formato de rosto',eyes:'Formato dos olhos',eye_color:'Cor dos olhos',mouth:'Expressão',presentation:'Apresentação',shirt:'Camisetas',bg:'Fundos',accessory:'Acessórios',badge:'Emblemas'};
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
  out='<path d="'+paths[v-1]+'" fill="'+dark+'"/><path d="M111 85Q151 60 190 89" stroke="#ffffff24" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  if(v===5)out+='<path d="M196 113Q239 93 233 159Q228 204 215 217L207 209Q228 151 201 132Z" fill="'+dark+'"/>';
  if(v===6)out+='<ellipse cx="155" cy="66" rx="29" ry="27" fill="'+dark+'"/>';
 }else if(group==='ondulado'){
  out='<path d="M91 138Q75 86 111 68Q151 43 190 67Q221 86 210 142Q191 108 176 101Q139 91 114 115L109 144Z" fill="'+dark+'"/>';
  const length=[166,204,278,228,179,242][v-1];
  for(const side of [-1,1]){
    const x=150+side*58;
    out+='<path d="M'+x+' 110C'+(x+side*29)+' 127 '+(x-side*12)+' 142 '+(x+side*17)+' 160S'+(x-side*7)+' 197 '+(x+side*14)+' 212S'+(x-side*7)+' 240 '+(x+side*10)+' '+length+'" stroke="'+dark+'" stroke-width="'+(v===3?29:23)+'" fill="none" stroke-linecap="round"/>';
    out+='<path d="M'+(x+side*3)+' 128Q'+(x+side*15)+' 143 '+(x+side*5)+' 166" fill="none" stroke="#ffffff28" stroke-width="2.3" stroke-linecap="round"/>';
  }
  if(v===4)out+='<path d="M103 101Q146 74 197 101Q158 112 129 136Z" fill="'+dark+'"/>';
  if(v===5)out+='<ellipse cx="151" cy="65" rx="37" ry="23" fill="'+dark+'"/>';
  if(v===6)out+='<path d="M111 89Q154 64 195 89Q165 115 142 106Z" fill="'+dark+'"/>';
 }else if(group==='cacheado'||group==='crespo'||group==='afro'){
  const afro=group==='afro',tight=group==='crespo';
  const width=afro?[80,91,105,91,94,95][v-1]:tight?[68,79,84,76,81,91][v-1]:[72,77,82,91,72,86][v-1];
  const top=afro?49:tight?58:63,radius=afro?17:tight?10:15;
  out+='<path d="M'+(150-width)+' 164 Q'+(150-width-17)+' 103 '+(150-width+12)+' 76 Q113 '+top+' 150 '+top+' Q197 '+top+' '+(150+width-12)+' 76 Q'+(150+width+17)+' 106 '+(150+width)+' 164 L'+(150+width-7)+' '+(v===3?270:213)+' L206 '+(v===3?268:208)+' Q214 135 187 113 Q149 94 113 116 Q89 142 96 '+(v===3?270:208)+' L'+(150-width+7)+' '+(v===3?270:213)+'Z" fill="'+dark+'"/>';
  for(let i=0;i<18;i++){
   const angle=Math.PI*1.02+Math.PI*.97*i/17;
   const x=150+Math.cos(angle)*(width-4),y=131+Math.sin(angle)*(131-top);
   out+='<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="'+(radius+i%3)+'" ry="'+(radius*.88+i%2).toFixed(1)+'" fill="'+dark+'"/>';
  }
  if(v===2||v===3||v===6){
   const length=v===3?272:v===6?238:215;
   for(const side of [-1,1])for(let i=0;i<3;i++){
    const x=150+side*(width-6-i*7);
    out+='<path d="M'+x+' 132 Q'+(x+side*13)+' 159 '+x+' 180 T'+x+' '+length+'" fill="none" stroke="'+dark+'" stroke-width="'+(tight?13:20)+'" stroke-linecap="round"/>';
   }
  }
  if(v===4||v===5)out+='<ellipse cx="150" cy="51" rx="'+(v===4?31:39)+'" ry="25" fill="'+dark+'"/>';
  if(afro&&v===5)out+='<path d="M'+(150-width)+' 114 Q150 77 '+(150+width)+' 114" fill="none" stroke="#d9ab89" stroke-width="7"/>';
  out+='<path d="M116 82Q150 67 179 83" fill="none" stroke="#ffffff26" stroke-width="2" stroke-linecap="round"/>';
 }else if(group==='trancado'){
  out=roots;
  if(v===6){
   for(let i=0;i<6;i++){
    const x=98+(i%3)*52,y=62+Math.floor(i/3)*35;
    out+='<ellipse cx="'+x+'" cy="'+y+'" rx="22" ry="19" fill="'+dark+'" stroke="#ffffff20" stroke-width="2"/>';
   }
  }else{
   const n=v===1?2:v===2?1:v===3?10:v===4?9:7;
   const bottom=v===4?210:v===2?270:286;
   for(let i=0;i<n;i++){
    const x=v===1?103+i*96:v===2?211:98+i*108/Math.max(1,n-1),y=125+(i%3)*4;
    const swing=n<=2?10:3;
    out+='<path d="M'+x+' '+y+'C'+(x+swing)+' '+(y+22)+' '+(x-swing)+' '+(y+30)+' '+x+' '+(y+45)+'S'+(x+swing)+' '+(bottom-21)+' '+x+' '+bottom+'" stroke="'+dark+'" stroke-width="'+(n<=2?21:10)+'" stroke-linecap="round" fill="none"/>';
    out+='<path d="M'+(x-3)+' '+(y+9)+'q8 8 0 16m0 5q8 8 0 16" stroke="#ffffff27" stroke-width="1.7" fill="none"/>';
   }
   if(v===5)out+='<ellipse cx="152" cy="65" rx="35" ry="24" fill="'+dark+'"/>';
  }

 }
 return out;
}
// Foreground is limited to the hairline so no wig piece covers the eyes or mouth.
function hairFrontSvg(group,variant,color){
 const v=Math.max(1,Math.min(6,Number(variant)||1));
 const top={
  liso:[
   'M97 128Q99 76 140 78Q185 74 203 125Q184 104 169 104Q148 102 129 114Q112 120 97 128Z',
   'M94 137Q92 78 144 75Q196 75 207 140Q196 111 180 106Q154 99 138 111Q112 130 94 137Z',
   'M91 128Q97 68 150 68Q199 68 209 129Q189 107 169 103Q133 101 111 123Z',
   'M98 124Q96 79 143 75Q195 71 208 131Q177 106 155 109Q132 102 108 140Z',
   'M94 129Q93 75 143 74Q190 74 208 128Q168 93 137 111Q110 130 94 129Z',
   'M95 135Q91 77 151 74Q198 76 207 130Q184 112 160 114Q138 91 114 113Z'
  ],
  ondulado:[
   'M94 136Q87 90 118 77Q160 56 192 82Q211 103 209 141Q193 111 177 112Q161 96 149 109Q119 92 94 136Z',
   'M90 139Q87 89 116 70Q154 54 191 74Q211 97 209 136Q189 107 169 112Q149 94 135 113Q113 108 90 139Z',
   'M89 131Q85 80 119 65Q166 49 195 79Q211 94 211 140Q186 108 172 114Q149 95 131 112Q113 111 89 131Z',
   'M92 137Q91 83 125 72Q168 55 202 88Q185 114 164 109Q151 97 138 110Q109 125 92 137Z',
   'M94 130Q86 86 124 75Q159 60 191 83Q202 94 209 137Q177 106 159 112Q132 95 111 127Z',
   'M91 135Q85 76 140 68Q187 67 211 132Q189 105 174 112Q146 95 130 114Q105 119 91 135Z'
  ],
  cacheado:[],
  crespo:[],
  afro:[],
  trancado:[]
 };
 const line=(top[group]||[])[v-1]||
 'M93 135Q85 81 115 73Q155 53 190 75Q215 96 207 145Q194 119 181 115Q162 93 142 106Q121 101 106 136Z';
 let out='<path d="'+line+'" fill="'+color+'"/>';
 if(['cacheado','crespo','afro'].includes(group)){
  const tight=group==='crespo',rad=tight?7:group==='afro'?13:10;
  const xs=[98,113,130,149,168,185,201];
  for(let i=0;i<xs.length;i++){
   const x=xs[i],y=[121,107,102,96,103,109,123][i];
   out+='<path d="M'+(x-rad)+' '+y+'q0 -'+rad+' '+rad+' -'+rad+'q'+rad+' 0 '+rad+' '+rad+'" fill="none" stroke="'+color+'" stroke-width="'+(rad*.95)+'" stroke-linecap="round"/>';
  }
 }else{
  out+='<path d="M110 97Q145 79 178 98" fill="none" stroke="#ffffff22" stroke-width="2.3" stroke-linecap="round"/>';
 }
 if(group==='trancado')out+='<path d="M149 79Q151 99 149 108" stroke="#ffffff45" stroke-width="2" fill="none"/>';
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
 const eyecolor='#39221e',eyeY=148+(face===3?4:0);
 const eyeTypes=[[10,8,5.4],[12,6.5,5],[11,5,4],[12,10,6],[9,6,4.5],[11,7.5,5.5]];
 const dims=eyeTypes[eye-1]||eyeTypes[0],iris=find('eye_color',c.eye_color)?.color||'#785239';
 const dollEye=x=>{
  const rx=dims[0],ry=dims[1],y=eyeY;
  return '<path d="M'+(x-rx-2)+' '+y+'Q'+x+' '+(y-ry*1.65)+' '+(x+rx+2)+' '+y+'Q'+x+' '+(y+ry*.85)+' '+(x-rx-2)+' '+y+'Z" fill="#fff9ef" stroke="'+eyecolor+'" stroke-width="2.3"/>'+
  '<circle cx="'+x+'" cy="'+(y-.6)+'" r="'+dims[2]+'" fill="'+iris+'"/>'+
  '<circle cx="'+x+'" cy="'+(y-.6)+'" r="'+(dims[2]*.56)+'" fill="#292022"/>'+
  '<circle cx="'+(x-2)+'" cy="'+(y-3.4)+'" r="2" fill="#fff"/>'+
  '<path d="M'+(x-rx)+' '+y+'l-4 -5 M'+(x-rx+4)+' '+(y-ry*.8)+'l-2 -5 M'+(x+rx)+' '+y+'l4 -5" fill="none" stroke="'+eyecolor+'" stroke-width="2" stroke-linecap="round"/>';
 };
 const eyeShape=dollEye(127)+dollEye(175);
 const smiles=[
 '<path d="M137 184Q151 194 166 184Q151 202 137 184Z" fill="#bf6b76" stroke="#a35463" stroke-width="1.1"/>',
 '<path d="M134 182Q151 206 169 182Q151 191 134 182Z" fill="#a6475c"/><path d="M140 186Q151 192 163 186" fill="none" stroke="#fff2e5" stroke-width="4"/>',
 '<path d="M142 187Q152 185 161 187" fill="none" stroke="#a75e65" stroke-width="3" stroke-linecap="round"/>',
 '<path d="M139 183Q155 190 167 181Q151 200 139 183Z" fill="#bf6d7d"/>',
 '<ellipse cx="151" cy="187" rx="9" ry="11" fill="#a6485c"/><ellipse cx="151" cy="185" rx="6" ry="3" fill="#ffdfd5"/>',
 '<path d="M135 186Q143 176 151 183Q160 177 168 186Q151 204 135 186Z" fill="#b85c74" stroke="#9c4056" stroke-width="1.4"/>'
 ][mouth-1];
 const blush='<ellipse cx="113" cy="174" rx="12" ry="6" fill="#d47a78" opacity=".22"/><ellipse cx="190" cy="174" rx="12" ry="6" fill="#d47a78" opacity=".22"/>';
 const id='cxavatar-'+(++serial),badge={star:'★',mic:'♫',flame:'✦',crown:'♛',admin:'◆'}[c.badge]||'★';
 const neck='<path d="M133 200v33q17 16 34 0v-33" fill="'+skin+'"/>';
 const overlay=c.accessory==='glasses'?'<rect x="114" y="136" width="30" height="22" rx="8"/><rect x="159" y="136" width="30" height="22" rx="8"/><path d="M144 143h15"/>':
 c.accessory==='headphones'?'<path d="M91 152v-19q0-70 59-70t59 70v19"/><rect x="87" y="137" width="13" height="34" rx="6" fill="#292d35"/><rect x="204" y="137" width="13" height="34" rx="6" fill="#292d35"/>':
 c.accessory==='coffee'?'<path d="M225 264h25v27q-12 10-25 0zM250 267q15-1 9 16h-9" fill="#f9eada"/>':'';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(small?'45 35 210 230':'0 0 300 340')+'" role="img" aria-label="Avatar com características combinadas" style="width:100%;height:100%">'+
 '<defs><linearGradient id="grad-'+id+'" x2="1" y2="1"><stop stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient><clipPath id="mask-'+id+'"><circle cx="150" cy="167" r="144"/></clipPath></defs>'+
 '<circle cx="150" cy="167" r="146" fill="#ffe0b4"/><circle cx="150" cy="167" r="143" fill="url(#grad-'+id+')"/>'+
 '<g clip-path="url(#mask-'+id+')">'+
 (c.bg==='grid'?'<path d="M0 110h300M0 164h300M0 218h300M60 0v340M120 0v340M180 0v340M240 0v340" fill="none" stroke="#eff" opacity=".19"/>':'')+
 '<path d="M27 340Q37 246 112 235Q150 225 188 235Q263 245 273 340Z" fill="'+shirt[0]+'"/>'+neck+
 hairSvg(group,Number(index),hairColor)+
 '<ellipse cx="151" cy="152" rx="'+rx+'" ry="'+ry+'" fill="'+skin+'"/>'+
 '<path d="M96 155q-14-12-12 10t16 11M205 155q14-12 12 10t-16 11" fill="'+skin+'"/>'+
 '<path d="M118 136q10-6 21 0m24 0q10-6 21 0" stroke="#553b31" stroke-width="3.2" fill="none" stroke-linecap="round"/>'+
 '<g>'+eyeShape+'</g>'+blush+
 '<path d="M150 151l-4 20 7 2" stroke="#99694e" stroke-width="2.4" fill="none"/>'+
 '<g stroke="#9f635d" stroke-width="2.8" fill="none" stroke-linecap="round">'+smiles+'</g>'+
 hairFrontSvg(group,Number(index),hairColor)+
 '<g fill="none" stroke="#352d2b" stroke-width="3">'+overlay+'</g>'+
 '<text x="150" y="280" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="900" fill="'+(c.shirt==='cx'?'#4b3027':'#fff8eb')+'"><tspan x="150">'+shirt[1][0]+'</tspan><tspan x="150" dy="19">'+shirt[1][1]+'</tspan></text>'+
 '</g>'+(c.badge==='admin'?'<path d="M252 31L278 43V65Q272 84 252 91Q231 84 226 65V43Z" fill="#f97316" stroke="#ffe0b1" stroke-width="3.4"/><path d="M252 39L269 47V63Q265 78 252 83Q239 78 235 63V47Z" fill="#7d3614"/><text x="252" y="63" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11.5" font-weight="900" fill="#fff4e5">CRM</text>':'<circle cx="252" cy="60" r="25" fill="#251c17" stroke="#ffd2a2" stroke-width="4"/>')+
 (c.badge==='admin'?'':'<text x="252" y="70" text-anchor="middle" font-size="31" fill="#ffc282">'+badge+'</text>')+'</svg>';
}
window.CXAvatarCatalog={groups,hairs,colors,skins,faces,eyes,eyeColors,mouths,presentation,shirts,backgrounds,accessories,badges,catalogs,labels,defaultConfig,itemKey,find,renderSvg};
})();