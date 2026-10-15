/* Conexão CRM Avatar Studio: layered, freely combinable physical traits */
(function(){
'use strict';
const groups=[
['liso','Lisos',['Liso curto','Bob liso','Liso longo','Chanel assimétrico','Rabo de cavalo','Coque com franja']],
['ondulado','Ondulados',['Ondas suaves','Long bob ondulado','Ondulado longo','Ondulado com franja','Semi preso','Coque ondulado']],
['cacheado','Cacheados',['Cachos curtos','Cachos médios','Cachos longos','Cacheado volumoso','Coque cacheado','Cachos definidos com franja']],
['crespo','Crespos',['Crespo curtinho','Crespo arredondado','Crespo longo','Puff alto','Coque crespo','Crespo definido']],
['afro','Afro',['Black power curto','Afro médio','Afro volumoso','Afro arredondado','Afro com faixa','Afro lateral']],
['trancado','Tranças e protetivos',['Duas tranças','Trança lateral','Box braids longas','Box braids curtas','Coque com tranças','Bantu knots']],
['masculino','Masculinos e curtos',['Buzz cut','Crew cut','French crop','Risca lateral','Degradê baixo','Cabelo social']]
];

const extendedHairNames={
 liso:['Curto com risca lateral','Bob com franja leve','Longo em camadas','Assimétrico com volume','Rabo de cavalo lateral','Coque baixo','Curto repicado','Bob com franja cortina','Longo meio preso','Corte lateral definido','Rabo alto','Coque duplo'],
 ondulado:['Ondas com risca lateral','Bob com movimento','Ondas longas em camadas','Franja ondulada','Ondas presas de lado','Coque baixo ondulado','Curto com textura','Bob com franja cortina','Longo semi preso','Ondulado com volume','Rabo alto ondulado','Coque ondulado duplo'],
 cacheado:['Curto com risca','Cachos médios em camadas','Cachos longos com franja','Cacheado lateral','Coque cacheado baixo','Curly puff','Curto arredondado','Cachos bob com franja','Cachos longos semi presos','Cachos definidos laterais','Coque alto com cachos','Dois puffs cacheados'],
 crespo:['Crespo com risca lateral','Crespo médio definido','Crespo longo em camadas','Puff lateral','Coque crespo baixo','Crespo emoldurando o rosto','Taper crespo','Crespo com franja','Crespo longo semi preso','Puff alto com volume','Coque crespo duplo','Crespo volumoso definido'],
 afro:['Afro com divisão lateral','Afro médio em camadas','Afro grande volumoso','Afro com franja','Afro preso atrás','Afro em camadas','Afro curto definido','Afro com detalhe frontal','Afro longo','Afro assimétrico','Afro alto','Afro duplo'],
 masculino:['Fade médio','Fade alto','Undercut','Quiff','Pompadour','Side part','Slick back','Mullet curto','Caesar cut','Texturizado médio','Cacheado curto','Afro taper'],
 trancado:['Tranças com divisão lateral','Tranças médias','Box braids em camadas','Tranças com franja','Coque baixo de tranças','Twists médios','Tranças finas laterais','Tranças com risca central','Box braids longas em camadas','Tranças laterais presas','Coque alto com tranças','Twists com volume']
};
const hairs=groups.flatMap(([group,label,names])=>[...names,...extendedHairNames[group]].map((name,i)=>({id:group+'-'+String(i+1).padStart(2,'0'),name,group,groupLabel:label,cost:i<6?0:i>=15?null:60+(i-6)*10,unlock:i>=15?'Conquista':null})));
const colors=[
 ['color-01','Preto','#1d1a21'],['color-02','Castanho escuro','#39231f'],
 ['color-03','Castanho médio','#714735'],['color-04','Castanho claro','#9d6a46'],
 ['color-05','Loiro escuro','#a8834e'],['color-06','Loiro claro','#e5bf7b'],
 ['color-07','Ruivo cobre','#bc5a2e',35],['color-08','Grisalho','#8c8f99',35],
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
const lashes=[{id:'none',name:'Sem cílios marcados',cost:0},{id:'light',name:'Cílios discretos',cost:0},{id:'defined',name:'Cílios definidos',cost:0}];
const shirts=[
{id:'crm',name:'CRM não é disparo',cost:0},{id:'cx',name:'Cliente no centro',cost:55},
{id:'ti',name:'API é vida',cost:85},{id:'mentor',name:'Mentoria transforma',cost:null},
{id:'dados',name:'Dados conectam',cost:0},{id:'comunidade',name:'Comunidade é conexão',cost:0},
{id:'jornada',name:'Jornada importa',cost:65},{id:'humano',name:'Pessoas primeiro',cost:65},
{id:'growth',name:'Growth com propósito',cost:75},{id:'martech',name:'Martech na prática',cost:75},
{id:'cxlover',name:'Eu amo CX',cost:85},{id:'ia',name:'IA + criatividade',cost:85}
];
const backgrounds=[{id:'sunset',name:'Laranja Conexão',cost:0},{id:'lilac',name:'Lavanda',cost:0},{id:'orbit',name:'Universo CRM',cost:0},{id:'grid',name:'Laboratório',cost:0},{id:'ocean',name:'Oceano',cost:0},{id:'forest',name:'Floresta',cost:0},{id:'dusk',name:'Pôr do sol',cost:55},{id:'rose',name:'Rosa antigo',cost:55},{id:'mint',name:'Menta',cost:65},{id:'night',name:'Noite estrelada',cost:65}];
const accessories=[{id:'none',name:'Sem acessório',cost:0},{id:'glasses',name:'Óculos',cost:0},{id:'headphones',name:'Fones',cost:0},{id:'coffee',name:'Café',cost:0},{id:'sunglasses',name:'Óculos de sol',cost:0},{id:'roundglasses',name:'Óculos redondos',cost:0},{id:'earrings',name:'Brincos',cost:45},{id:'hoops',name:'Argolas',cost:45},{id:'cap',name:'Boné',cost:65},{id:'beanie',name:'Gorro',cost:65},{id:'bow',name:'Laço de cabelo',cost:75},{id:'necklace',name:'Colar',cost:75}];
const badges=[{id:'star',name:'Primeira conexão',cost:0},{id:'admin',name:'Equipe Conexão CRM',cost:null},{id:'mic',name:'Host de webinar',cost:null},{id:'flame',name:'Criador de conteúdo',cost:null},{id:'crown',name:'Destaque da comunidade',cost:null}];
const defaultConfig={hair_style:'liso-01',hair_color:'color-02',skin:'skin-03',face:'face-01',eyes:'eyes-02',eye_color:'eye-color-02',lashes:'none',mouth:'mouth-01',presentation:'neutro',shirt:'crm',bg:'sunset',accessory:'none',badge:'star'};
const catalogs={hair_style:hairs,hair_color:colors,skin:skins,face:faces,eyes,eye_color:eyeColors,lashes,mouth:mouths,presentation,shirt:shirts,bg:backgrounds,accessory:accessories,badge:badges};
const labels={hair_style:'Penteados',hair_color:'Cor do cabelo',skin:'Tom de pele',face:'Formato de rosto',eyes:'Formato dos olhos',eye_color:'Cor dos olhos',lashes:'Cílios',mouth:'Expressão',presentation:'Apresentação',shirt:'Camisetas',bg:'Fundos',accessory:'Acessórios',badge:'Emblemas'};
const itemKey=(field,id)=>({hair_style:'hair-'+id,hair_color:id,skin:'skin-'+id,face:'face-'+id,eyes:'eyes-'+id,lashes:'lashes-'+id,mouth:'mouth-'+id,presentation:'presentation-'+id,shirt:'shirt-'+id,bg:'bg-'+id,accessory:'accessory-'+id,badge:'badge-'+id})[field];
const find=(field,id)=>catalogs[field]?.find(x=>x.id===id);
const attr=(x)=>String(x).replace(/[&"<>]/g,'');
// Single continuous silhouettes with soft highlights; no sticker-like detached pieces.
function hairShade(hex,shift){
 const h=String(hex||'#39231f').replace('#','');
 const n=parseInt(h,16);
 if(!Number.isFinite(n)||h.length!==6)return '#584035';
 const channels=[(n>>16)&255,(n>>8)&255,n&255].map(v=>shift>0?Math.round(v+(255-v)*shift):Math.round(v*(1+shift)));
 return '#'+channels.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
}
function hairSvg(group,variant,color){
 const v=((Math.max(1,Math.min(18,Number(variant)||1))-1)%6)+1;
 const ink=hairShade(color,-.24),light=hairShade(color,.26);
 const p=d=>'<path d="'+d+'" fill="'+color+'" stroke="'+ink+'" stroke-width="1.2" stroke-linejoin="round"/>';
 const line=(d,alpha=.55,w=2)=>'<path d="'+d+'" fill="none" stroke="'+light+'" stroke-width="'+w+'" opacity="'+alpha+'" stroke-linecap="round"/>';
 let out='';
 if(group==='masculino'){
  const styles=[68,75,86,90,77,92][v-1];
  out+=p('M95 143 Q91 '+(styles-25)+' 121 '+styles+' Q155 '+(styles-21)+' 185 '+styles+' Q212 '+(styles-10)+' 208 144 L199 137 Q179 '+(styles+17)+' 155 '+(styles+12)+' Q122 '+(styles+9)+' 105 141Z');
  out+=line('M116 '+(styles+6)+' Q150 '+(styles-6)+' 189 '+(styles+10),.35,2);
 }else if(group==='liso'){
  const lengths=[156,206,311,229,164,159];
  const L=lengths[v-1];
  const left=v===4?87:91,right=v===4?218:209;
  out+=p('M'+left+' 147 C78 96 91 62 130 57 C174 43 213 68 217 121 Q221 150 '+right+' '+(L-15)+
   ' Q'+(right-5)+' '+(L+8)+' '+(right-27)+' '+L+
   ' L187 138 Q186 101 152 100 Q116 102 114 138 L112 '+L+
   ' Q91 '+(L+6)+' '+left+' '+(L-12)+'Z');
  if(v===3)out+=line('M100 127 C94 184 105 240 101 288',.3,4)+line('M201 129 Q202 207 207 290',.35,3);
  if(v===4)out+=p('M184 115Q218 125 216 176Q222 207 229 225Q205 240 188 210Z');
  if(v===5)out+=p('M194 115Q230 98 234 149C231 184 220 223 200 249Q221 177 194 139Z');
  if(v===6)out+=p('M121 76C116 53 127 35 151 35C180 35 192 55 184 82Q153 102 121 76Z');
  out+=line('M111 91Q135 67 178 81',.42,3);
 }else if(group==='ondulado'){
  const L=[178,222,306,237,177,260][v-1];
  out+=p('M99 142 C77 113 90 77 112 63 C143 42 190 51 208 80 C229 110 212 135 225 158'+
  ' C240 178 217 197 224 221 C239 252 219 '+(L-19)+' 208 '+L+
  ' Q184 '+(L+9)+' 182 '+(L-13)+
  ' C196 194 171 163 190 133 C185 107 167 99 151 99 C120 97 111 113 111 140'+
  ' C121 167 102 190 116 216 C129 245 113 '+(L-12)+' 91 '+L+
  ' C69 '+(L-19)+' 81 238 75 216 C65 189 87 173 81 150Z');
  out+=line('M106 116Q92 155 102 173T105 215',.35,3)+line('M201 113Q209 151 200 175T208 215',.35,3);
  if(v===4)out+=line('M106 101Q149 85 190 113',.55,4);
  if(v===5)out+=p('M120 78C118 42 178 38 189 75Q166 98 120 78Z');
  if(v===6)out+=line('M101 196 Q93 213 104 235 M204 200Q213 220 204 241',.45,3);
 }else if(group==='cacheado'||group==='crespo'||group==='afro'){
  const afro=group==='afro',tight=group==='crespo';
  const w=(afro?[78,89,104,91,89,91]:tight?[68,78,88,79,82,91]:[71,79,90,91,79,86])[v-1];
  const top=afro?42:tight?51:54;
  const L=v===3?303:v===6?264:v===2?228:217;
  // Shaped flowing curls: scalloped outer contour integrated into one filled cap.
  let d='M '+(150-w)+' 161';
  for(let i=0;i<=14;i++){
   const angle=Math.PI+(Math.PI*i/14);
   const x=150+Math.cos(angle)*w,y=136+Math.sin(angle)*(136-top);
   const r=tight?7:afro?12:9;
   d+=' Q '+(x-r*Math.sin(angle)).toFixed(1)+' '+(y-r).toFixed(1)+' '+x.toFixed(1)+' '+y.toFixed(1);
  }
  d+=' Q '+(150+w+12)+' 176 '+(150+w-5)+' '+L+' Q '+(150+w-25)+' '+(L+13)+' 194 '+(L-6)+
  ' C190 224 193 172 192 137 Q175 108 149 112 Q115 109 108 137 C106 191 112 222 107 '+(L-3)+
  ' Q '+(150-w+8)+' '+(L+11)+' '+(150-w-5)+' '+L+' Q '+(150-w-17)+' 194 '+(150-w)+' 161Z';
  out+=p(d);
  if(v===2||v===3||v===6)out+=line('M90 158 Q100 182 91 207T96 '+(L-12),.35,3)+line('M210 164Q199 185 210 211T203 '+(L-13),.34,3);
  if(v===4)out+=p('M123 70C102 42 120 21 151 23C187 25 196 49 181 74Z');
  if(v===5)out+=p('M120 73C109 41 124 24 153 26C186 24 198 49 184 75Z');
  if(afro&&v===5)out+=line('M72 111 Q145 81 229 111',.85,6);
  if(tight)out+=line('M112 79 Q146 60 180 81',.32,2);
  else out+=line('M114 76 Q144 55 186 80',.44,2.4);
 }else{
  // Tranças: construção posterior apenas nas laterais do rosto. Nenhuma mecha
  // atravessa olhos, boca, pescoço ou a área reservada à tipografia da camiseta.
  out+=p('M96 145 Q85 98 115 74 Q153 53 190 76 Q217 101 207 147 L196 139 Q188 106 151 104 Q115 106 106 141Z');
  if(v!==6){
   const pairs=v===1?[[104,202],[111,195]]:v===2?[[198,207]]:v===3?[[97,201],[105,193],[113,185]]:v===4?[[99,203],[107,195]]:[[105,195],[113,187]];
   const length=v===4?242:v===2?278:255;
   for(const [left,right] of pairs){
    for(const x of [left,right]){
     const dir=x<150?-1:1;
     const d='M'+x+' 132 C'+(x+dir*11)+' 162 '+(x+dir*6)+' 190 '+(x+dir*10)+' '+length;
     out+='<path d="'+d+'" fill="none" stroke="'+ink+'" stroke-width="11" stroke-linecap="round"/>';
     out+='<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="8" stroke-linecap="round"/>';
    }
   }
  }else{
   for(const x of [113,150,187])out+=p('M'+(x-15)+' 81Q'+(x-17)+' 51 '+x+' 48Q'+(x+19)+' 52 '+(x+15)+' 81Q'+x+' 96 '+(x-15)+' 81Z');
  }
 }
 return out;
}
function hairFrontSvg(group,variant,color){
 const v=((Math.max(1,Math.min(18,Number(variant)||1))-1)%6)+1,light=hairShade(color,.28);
 const front={
 masculino:[
 'M96 136Q87 100 113 83Q152 61 188 82Q210 99 204 138Q182 108 154 114Q128 107 104 140Z',
 'M96 136Q91 89 126 75Q168 59 199 94Q209 115 204 138Q177 114 151 117Q122 112 104 143Z',
 'M96 136Q90 92 124 78Q163 67 193 85L196 104Q161 102 138 116L103 142Z',
 'M96 137Q89 92 126 80Q156 64 202 87Q193 108 157 111Q129 111 104 142Z',
 'M96 136Q87 101 116 82Q157 62 193 81Q213 100 205 141Q177 113 153 117Q124 112 104 140Z',
 'M96 136Q92 92 121 80Q162 67 195 86Q205 104 204 136Q177 109 153 112Q123 109 104 141Z'
 ],
 liso:[
  'M99 137Q94 103 114 78Q138 57 166 71Q195 77 204 115Q193 108 178 105Q162 103 146 117Q123 112 109 133Z',
  'M96 140Q91 96 119 72Q151 53 186 76Q207 92 206 137Q184 109 164 106Q143 103 128 117Q108 115 96 140Z',
  'M94 133Q91 92 123 69Q153 54 186 74Q212 97 209 133Q188 108 172 106Q136 101 111 130Z',
  'M95 138Q89 90 128 72Q166 60 204 95Q194 113 165 113Q139 101 113 143Z',
  'M96 137Q92 89 127 70Q160 57 190 79Q204 95 205 126Q173 100 149 108Q125 118 96 137Z',
  'M95 135Q94 92 126 71Q161 58 190 81Q210 98 205 131Q179 115 155 110Q130 96 110 127Z'
 ],
 ondulado:[
  'M95 139Q86 94 115 75Q147 51 187 73Q211 91 209 135Q190 103 171 111Q146 93 126 113Q105 109 95 139Z',
  'M94 138Q86 90 120 69Q160 48 195 79Q217 102 209 137Q182 108 162 111Q142 96 126 120Z',
  'M90 136Q84 88 115 67Q155 46 192 73Q215 96 209 141Q190 105 174 112Q146 91 129 111Q108 119 90 136Z',
  'M94 135Q88 87 125 72Q164 54 198 92Q173 114 158 112Q145 99 128 120Q110 116 94 135Z',
  'M94 139Q92 90 120 72Q158 53 192 83Q209 97 208 136Q182 100 161 115Q131 93 110 130Z',
  'M92 140Q87 85 123 69Q165 49 200 83Q209 104 210 137Q182 108 172 116Q141 92 124 114Z'
 ],
 cacheado:[],
 crespo:[],
 afro:[],
 trancado:[]
 };
 let d=(front[group]||[])[v-1];
 if(!d){
  d=group==='trancado'?'M94 135Q85 91 123 73Q160 56 194 83Q210 101 207 133Q176 101 155 107Q123 101 102 136Z':
  'M92 133Q85 85 114 69Q152 48 190 70Q216 91 208 134Q197 120 185 115Q164 95 148 109Q127 98 110 133Z';
 }
 let out='<path d="'+d+'" fill="'+color+'" stroke="'+hairShade(color,-.18)+'" stroke-width="1.15" stroke-linejoin="round"/>';
 if(group==='liso'||group==='ondulado'||group==='masculino'){
  out+='<path d="M115 92Q148 75 181 94" stroke="'+light+'" opacity=".32" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
 }
 if(['cacheado','crespo','afro'].includes(group)){
  // Curved lock highlights rather than circles stitched on top.
  out+='<path d="M106 108q14-18 25-6m9-10q14-10 25 3m11 6q12-5 19 13" stroke="'+light+'" opacity=".28" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
 }
 if(group==='trancado'&&v===1){
  out+='<path d="M149 85V108" stroke="'+light+'" opacity=".37" stroke-width="2" fill="none"/>';
 }
 return out;
}

function hairStyleDetail(group,variant,color){
 const n=Number(variant)||1;
 if(n<=6)return '';
 const tier=n<=12?1:2;
 const ink=hairShade(color,-.22),highlight=hairShade(color,.32);
 const stroke=(d,w=3)=>'<path d="'+d+'" fill="none" stroke="'+highlight+'" stroke-width="'+w+'" stroke-linecap="round" opacity=".62"/>';
 const fill=d=>'<path d="'+d+'" fill="'+color+'" stroke="'+ink+'" stroke-width="1.2" stroke-linejoin="round"/>';
 const offset=(n-7)%6;
 if(group==='masculino'){
   const offsets=['M105 104Q149 74 200 104','M106 110Q145 79 199 96','M112 98Q156 88 195 109','M109 112Q151 67 201 103','M101 111Q150 83 195 95','M112 97Q156 78 198 111'];
   const i=(n-7)%6;
   return stroke(offsets[i],tier===1?4:6)+(tier===2?fill('M105 132Q113 90 149 91Q185 88 199 124Q173 108 149 118Q124 110 105 132Z'):'');
 }
 if(group==='trancado'){
   // Acabamento exclusivo na coroa. As mechas laterais ficam na camada posterior.
   if(tier===1)return stroke('M119 85Q150 105 183 88',2.2);
   return fill('M124 77Q124 49 151 49Q182 48 181 78Q151 93 124 77Z')+stroke('M130 68Q151 57 173 69',2.2);
 }
 if(['cacheado','crespo','afro'].includes(group)){
   if(tier===1){
     return fill('M95 121 Q103 98 125 105 Q143 90 158 103 Q176 92 190 110 Q196 128 192 138 Q172 115 155 126 Q137 115 117 137Z')+
       stroke('M111 112 Q124 104 133 113 M149 108 Q161 102 174 114',2);
   }
   return fill('M118 72 Q109 42 132 39 Q148 22 167 38 Q192 38 189 68 Q165 90 118 72Z')+
     stroke('M124 64 Q148 44 178 63',3.2)+stroke('M98 140 Q90 160 100 176 M202 137 Q211 163 201 183',2.2);
 }
 if(tier===1){
   const side=offset%2===0?'M100 123 Q115 79 153 84 Q181 83 202 107 Q175 98 154 110 Q125 104 110 142Z':
                       'M201 124 Q185 78 148 84 Q120 84 98 111 Q128 98 152 111 Q178 103 190 142Z';
   return fill(side)+stroke('M118 93 Q146 83 182 98',2.8);
 }
 return fill('M124 79 Q117 57 139 52 Q156 44 171 53 Q190 61 181 81 Q152 95 124 79Z')+
   stroke('M128 75 Q152 60 177 75',2.6)+
   (group==='liso'?fill('M199 116 Q215 119 225 141 Q219 164 208 187 L204 176 Q215 144 195 137Z'):stroke('M100 137 Q92 157 105 184 M203 138 Q211 166 198 185',2));
}
let serial=0;
function renderSvg(input={},small=false){
 const c={...defaultConfig,...input};
 const skin=find('skin',c.skin)?.color||skins[2].color;
 const hairColor=find('hair_color',c.hair_color)?.color||colors[1].color;
 const [group,index]=String(c.hair_style).split('-');
 const bg={sunset:['#eabb92','#925839'],lilac:['#c7b6e4','#7e698d'],orbit:['#7579b1','#252c50'],grid:['#5f8a8e','#223437'],ocean:['#67abc7','#174965'],forest:['#88a985','#244634'],dusk:['#f8b581','#884b75'],rose:['#e5b3c5','#99596e'],mint:['#b3e4ca','#377b6c'],night:['#4b5b98','#101a33']}[c.bg]||['#eabb92','#925839'];
 const shirt={crm:['#f97316',['CRM não é','disparo']],cx:['#fffaf3',['Cliente','no centro']],ti:['#496c82',['API é','vida']],mentor:['#755092',['Mentoria','transforma']],dados:['#314e71',['Dados','conectam']],comunidade:['#89457c',['Comunidade','é conexão']],jornada:['#327965',['Jornada','importa']],humano:['#b95e53',['Pessoas','primeiro']],growth:['#5368a1',['Growth com','propósito']],martech:['#3f656d',['Martech na','prática']],cxlover:['#a94b70',['Eu amo','CX']],ia:['#604e96',['IA +','criatividade']]}[c.shirt]||['#f97316',['CRM não é','disparo']];
 const face=Number(c.face.slice(-2))||1,eye=Number(c.eyes.slice(-2))||1,mouth=Number(c.mouth.slice(-2))||1;
 const rx=[0,55,61,48,52,57,51][face],ry=[0,68,64,76,65,70,68][face];
 const faceShape=c.presentation==='masculino'
  ?'<path d="M'+(151-rx+9)+' '+(152-ry+11)+' Q151 '+(152-ry-11)+' '+(151+rx-9)+' '+(152-ry+11)+
   ' Q'+(151+rx+7)+' 125 '+(151+rx)+' 155 L'+(151+rx-6)+' 190 Q'+(151+rx-13)+' 214 165 '+(152+ry)+
   ' L137 '+(152+ry)+' Q'+(151-rx+14)+' 214 '+(151-rx+6)+' 190 L'+(151-rx)+' 155 Q'+(151-rx-7)+' 125 '+(151-rx+9)+' '+(152-ry+11)+'Z" fill="'+skin+'"/>'
  :'<ellipse cx="151" cy="152" rx="'+rx+'" ry="'+ry+'" fill="'+skin+'"/>';
 const eyecolor='#39221e',eyeY=148+(face===3?4:0);
 const eyeTypes=[[10,8,5.4],[12,6.5,5],[11,5,4],[12,10,6],[9,6,4.5],[11,7.5,5.5]];
 const dims=eyeTypes[eye-1]||eyeTypes[0],iris=find('eye_color',c.eye_color)?.color||'#785239';
 const dollEye=x=>{
  const rx=dims[0],ry=dims[1],y=eyeY;
  return '<path d="M'+(x-rx-2)+' '+y+'Q'+x+' '+(y-ry*1.65)+' '+(x+rx+2)+' '+y+'Q'+x+' '+(y+ry*.85)+' '+(x-rx-2)+' '+y+'Z" fill="#fff9ef" stroke="'+eyecolor+'" stroke-width="2.3"/>'+
  '<circle cx="'+x+'" cy="'+(y-.6)+'" r="'+dims[2]+'" fill="'+iris+'"/>'+
  '<circle cx="'+x+'" cy="'+(y-.6)+'" r="'+(dims[2]*.56)+'" fill="#292022"/>'+
  '<circle cx="'+(x-2)+'" cy="'+(y-3.4)+'" r="2" fill="#fff"/>'+
  (c.lashes==='defined'?'<path d="M'+(x-rx)+' '+y+'l-4 -6 M'+(x-rx+4)+' '+(y-ry*.85)+'l-3 -6 M'+(x+rx)+' '+y+'l4 -6" fill="none" stroke="'+eyecolor+'" stroke-width="2.2" stroke-linecap="round"/>':c.lashes==='light'?'<path d="M'+(x-rx)+' '+y+'l-2.4 -3 M'+(x+rx)+' '+y+'l2.4 -3" fill="none" stroke="'+eyecolor+'" stroke-width="1.5" stroke-linecap="round"/>':'');
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
 const extraAccessory={
  sunglasses:'<rect x="111" y="137" width="35" height="23" rx="8" fill="#302a32" stroke="#d7a97a" stroke-width="3"/><rect x="157" y="137" width="35" height="23" rx="8" fill="#302a32" stroke="#d7a97a" stroke-width="3"/><path d="M146 144h11" stroke="#d7a97a" stroke-width="4"/>',
  roundglasses:'<g stroke="#665147" stroke-width="3" fill="none"><circle cx="128" cy="149" r="17"/><circle cx="175" cy="149" r="17"/><path d="M145 149h13M111 145l-16-7M192 145l15-7"/></g>',
  earrings:'<circle cx="94" cy="185" r="5" fill="#ffdc9c"/><circle cx="209" cy="185" r="5" fill="#ffdc9c"/>',
  hoops:'<g stroke="#fbd289" stroke-width="4" fill="none"><ellipse cx="94" cy="185" rx="7" ry="12"/><ellipse cx="209" cy="185" rx="7" ry="12"/></g>',
  cap:'<path d="M94 114Q88 73 145 66Q197 62 211 109L197 126Q147 107 94 114Z" fill="#f97316" stroke="#693a29" stroke-width="3"/><path d="M118 117Q175 103 229 121Q185 139 124 129Z" fill="#e76318"/>',
  beanie:'<path d="M94 123Q88 63 149 54Q213 59 211 123Z" fill="#78549a"/><path d="M94 119Q151 109 211 119V136Q150 124 94 136Z" fill="#634581"/>',
  bow:'<path d="M139 81Q101 48 112 98L143 94Q167 58 195 75Q207 107 151 99Z" fill="#ef9bb1" stroke="#a95172" stroke-width="2"/><circle cx="148" cy="91" r="9" fill="#bd607f"/>',
  necklace:'<path d="M122 226Q150 257 182 226" fill="none" stroke="#ffd38c" stroke-width="4"/><path d="M151 243l9 12-9 12-9-12Z" fill="#ffd38c"/>'
 }[c.accessory]||'';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(small?'45 35 210 230':'0 0 300 340')+'" role="img" aria-label="Avatar com características combinadas" style="width:100%;height:100%">'+
 '<defs><linearGradient id="grad-'+id+'" x2="1" y2="1"><stop stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient><clipPath id="mask-'+id+'"><circle cx="150" cy="170" r="158"/></clipPath></defs>'+
 '<circle cx="150" cy="170" r="160" fill="#ffe0b4"/><circle cx="150" cy="170" r="157" fill="url(#grad-'+id+')"/>'+
 '<g clip-path="url(#mask-'+id+')">'+
 (c.bg==='grid'?'<path d="M0 110h300M0 164h300M0 218h300M60 0v340M120 0v340M180 0v340M240 0v340" fill="none" stroke="#eff" opacity=".19"/>':'')+
 '<path d="M27 340Q37 246 112 235Q150 225 188 235Q263 245 273 340Z" fill="'+shirt[0]+'" stroke="'+(c.shirt==='cx'?'#958578':'#231c18')+'" stroke-width="3"/>'+
 '<path d="M114 237Q151 257 188 237Q173 254 151 259Q128 254 114 237Z" fill="'+(c.shirt==='cx'?'#c9bbb0':'#30251d')+'" opacity=".76"/>'+neck+
 hairSvg(group,Number(index),hairColor)+
 faceShape+
 // Ears stay below hair. Hair-front layer naturally covers the ear when the style falls over it.
 '<path d="M96 155q-14-12-12 10t16 11M205 155q14-12 12 10t-16 11" fill="'+skin+'"/>'+
 '<path d="M118 136q10 '+(c.presentation==='masculino'?'-3':'-6')+' 21 0m24 0q10 '+(c.presentation==='masculino'?'-3':'-6')+' 21 0" stroke="#553b31" stroke-width="'+(c.presentation==='masculino'?'4':'3')+'" fill="none" stroke-linecap="round"/>'+
 '<g>'+eyeShape+'</g>'+blush+
 '<path d="M150 151l-4 20 7 2" stroke="#99694e" stroke-width="2.4" fill="none"/>'+
 '<g stroke="#9f635d" stroke-width="2.8" fill="none" stroke-linecap="round">'+smiles+'</g>'+
 hairFrontSvg(group,Number(index),hairColor)+hairStyleDetail(group,Number(index),hairColor)+
 '<g fill="none" stroke="#352d2b" stroke-width="3">'+overlay+'</g>'+extraAccessory+

 '<text x="150" y="282" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="850" fill="'+(c.shirt==='cx'?'#25201e':'#fff8eb')+'"><tspan x="150">'+shirt[1][0]+'</tspan><tspan x="150" dy="15">'+shirt[1][1]+'</tspan></text>'+
 '</g>'+(c.badge==='admin'?'<path d="M252 31L278 43V65Q272 84 252 91Q231 84 226 65V43Z" fill="#f97316" stroke="#ffe0b1" stroke-width="3.4"/><path d="M252 39L269 47V63Q265 78 252 83Q239 78 235 63V47Z" fill="#7d3614"/><text x="252" y="63" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11.5" font-weight="900" fill="#fff4e5">CRM</text>':'<circle cx="252" cy="60" r="25" fill="#251c17" stroke="#ffd2a2" stroke-width="4"/>')+
 (c.badge==='admin'?'':'<text x="252" y="70" text-anchor="middle" font-size="31" fill="#ffc282">'+badge+'</text>')+'</svg>';
}
window.CXAvatarCatalog={groups,hairs,colors,skins,faces,eyes,eyeColors,lashes,mouths,presentation,shirts,backgrounds,accessories,badges,catalogs,labels,defaultConfig,itemKey,find,renderSvg};
})();