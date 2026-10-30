await Promise.all([figma.loadFontAsync({family:'IBM Plex Sans Condensed',style:'Bold'}),figma.loadFontAsync({family:'IBM Plex Sans Condensed',style:'Regular'})]);
const page=figma.root.children[0];await figma.setCurrentPageAsync(page);page.name='Report editorial';
const [db,clock]=await Promise.all([figma.importComponentByKeyAsync('4ea91694bc7341bf566292db29d8d46f25d6c4ec'),figma.importComponentByKeyAsync('e83c96c7856b0418ed4d0edd2c6706be845164d2')]);
const ids=[],color=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}),paint=h=>[{type:'SOLID',color:color(h)}];
function stack(parent,name,w,pad,bg){const f=figma.createAutoLayout('VERTICAL');ids.push(f.id);f.name=name;f.resize(w,100);f.primaryAxisSizingMode='AUTO';f.counterAxisSizingMode='FIXED';f.itemSpacing=24;f.paddingTop=f.paddingBottom=f.paddingLeft=f.paddingRight=pad;f.fills=bg?paint(bg):[];parent.appendChild(f);return f;}
function text(parent,name,value,size,hex,bold=true,w=1248){const t=figma.createText();ids.push(t.id);t.name=name;t.fontName={family:'IBM Plex Sans Condensed',style:bold?'Bold':'Regular'};t.fontSize=size;t.lineHeight={unit:'PERCENT',value:104};t.fills=paint(hex);t.characters=value;t.textAutoResize='HEIGHT';t.resize(w,t.height);parent.appendChild(t);return t;}
const cover=stack(page,'Desktop / capa editorial',1440,80,'#101628');cover.x=200;cover.y=0;cover.itemSpacing=32;
text(cover,'Marca','CONEXÃO CRM.  /  PESQUISAS 2026',18,'#d4b6ef');
text(cover,'Tema','IMPLEMENTAÇÃO DE CRM',20,'#b9a0e2');
text(cover,'Título','O CRM entra\nem operação.\nA complexidade\nvem antes.',112,'#faf7f1');
const row=figma.createAutoLayout('HORIZONTAL');ids.push(row.id);cover.appendChild(row);row.fills=[];row.itemSpacing=36;row.primaryAxisSizingMode='AUTO';row.counterAxisSizingMode='AUTO';
for(const [n,label] of [['62,1%','citam dados legados'],['55,2%','executam em modelo misto'],['29','respostas consolidadas']]){const item=stack(row,label,360,0,null);text(item,'Número',n,72,'#d6b7f5',true,360);text(item,'Legenda',label,23,'#ded9e7',false,360);}
text(cover,'Nota da base','Pesquisa da comunidade. Base exploratória de 29 respostas, sem representatividade do mercado.',18,'#bdb7cd',false);
const chapter=stack(page,'Desktop / gargalos e prazo',1440,80,'#f1eee8');chapter.x=200;chapter.y=cover.height+100;chapter.itemSpacing=32;
text(chapter,'Capítulo','01  /  ANTES DO GO-LIVE',20,'#7445a0');text(chapter,'Título','A base de dados chega\nantes da plataforma.',92,'#171426');
const icon=db.createInstance();ids.push(icon.id);chapter.appendChild(icon);icon.resize(56,56);
const chart=stack(chapter,'Gráfico de gargalos / base 29',1280,0,null);chart.itemSpacing=24;
for(const [label,n] of [['Dados legados',18],['Escopo e requisitos',14],['Processos e resistência interna',14],['Customizações e integrações',11]]){const item=stack(chart,label,1280,0,null);item.itemSpacing=8;text(item,'Rótulo',label+'     '+(n/29*100).toFixed(1).replace('.',',')+'%  ·  '+n+'/29',26,'#171426',false,1250);const track=figma.createAutoLayout('HORIZONTAL');ids.push(track.id);track.resize(1240,20);track.primaryAxisSizingMode='FIXED';track.counterAxisSizingMode='FIXED';track.fills=paint('#ded7e6');item.appendChild(track);const bar=figma.createRectangle();ids.push(bar.id);track.appendChild(bar);bar.resize(1240*n/29,20);bar.fills=paint('#8854b7');}
text(chapter,'Nota','Múltiplas respostas. Os percentuais usam 29 como base e não somam 100%.',20,'#5e566a',false);
const ci=clock.createInstance();ids.push(ci.id);chapter.appendChild(ci);ci.resize(40,40);
text(chapter,'Destaque prazo','41,4% citam de 3 a 6 meses',50,'#171426');text(chapter,'Nota prazo','12 de 29 respostas. Faixa mais citada, sem estimativa de prazo médio.',22,'#5e566a',false);
const all=[...cover.findAll(()=>true),...chapter.findAll(()=>true)];
return {createdNodeIds:ids,frames:[{id:cover.id,w:cover.width,h:cover.height},{id:chapter.id,w:chapter.width,h:chapter.height}],types:all.reduce((a,n)=>(a[n.type]=(a[n.type]||0)+1,a),{}),fonts:[...new Set(all.filter(n=>n.type==='TEXT').map(n=>n.fontName.family))],imageFilledNodes:all.filter(n=>Array.isArray(n.fills)&&n.fills.some(f=>f.type==='IMAGE')).map(n=>({id:n.id,name:n.name,type:n.type,w:n.width,h:n.height}))};
