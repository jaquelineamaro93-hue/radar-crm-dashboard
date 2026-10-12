(function(){
"use strict";
const $=id=>document.getElementById(id);
const rows=[
{id:"1",type:"comunidade",name:"Lucas",state:"SP",text:"Abrir um projeto social para crianças e ajudar outras pessoas a sonhar mais alto.",x:24,y:33,color:"#afefff"},
{id:"2",type:"vida",name:"Marta",state:"BA",text:"Ter a minha casa própria e um jardim onde eu possa reunir quem amo.",x:67,y:26,color:"#ffefae"},
{id:"3",type:"carreira",name:"Pedro",state:"RS",text:"Crescer profissionalmente e inspirar outras pessoas a confiarem no seu potencial.",x:31,y:49,color:"#c5b4ff"},
{id:"4",type:"aprendizado",name:"Ana",state:"RJ",text:"Conhecer o mundo, aprender novas culturas e levar esses aprendizados para o que faço.",x:79,y:43,color:"#98f5d4"},
{id:"5",type:"vida",name:"Thiago",state:"CE",text:"Construir uma vida melhor para minha família, com tempo, cuidado e segurança.",x:25,y:66,color:"#ffd0b2"},
{id:"6",type:"empreender",name:"Beatriz",state:"MG",text:"Ter o meu próprio negócio de artes e ver minhas ideias ganharem o mundo.",x:76,y:65,color:"#b2e7ff"}
];
const themes={carreira:"TRABALHO E CARREIRA",aprendizado:"APRENDIZADO",comunidade:"COMUNIDADE E IMPACTO",vida:"VIDA E FAMÍLIA",empreender:"EMPREENDER"};
const songs={ana:{name:"Amarelo, azul e branco",artist:"ANAVITÓRIA ao vivo com Orquestra Ouro Preto",iframe:"https://www.youtube-nocookie.com/embed/riSNfxIDa1I?rel=0&playsinline=1",link:"https://www.youtube.com/watch?v=riSNfxIDa1I",height:220},wilian:{name:"Lua de Cristal",artist:"Wilian Metlei",iframe:"https://embed.music.apple.com/br/album/lua-de-cristal/1839994030?i=1839994031",link:"https://music.apple.com/us/album/lua-de-cristal/1839994030?i=1839994031",height:175}};
let own=null,index=0,focusReturn=null,showList=false,song="ana",paused=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const water=new Map();
const data=()=>own?[...rows,own]:rows;
function scroll(el){el.scrollIntoView({behavior:paused?"auto":"smooth",block:"start"})}
function orb(d,i){
const b=document.createElement("button");b.type="button";b.className="wish-orb";b.dataset.id=d.id;
b.style.setProperty("--x",d.x+"%");b.style.setProperty("--y",d.y+"%");b.style.setProperty("--glow",d.color);b.style.setProperty("--delay",(-i*.7)+"s");
b.setAttribute("aria-label","Abrir o sonho "+(d.mine?"que você plantou":"de "+d.name)+": "+d.text);
const light=document.createElement("span");light.className="wish-light";light.setAttribute("aria-hidden","true");
const msg=document.createElement("span");msg.className="wish-label";msg.textContent="“"+(d.text.length>57?d.text.slice(0,54)+"...":d.text)+"”";
const by=document.createElement("span");by.className="wish-author";by.textContent=d.mine?"Meu sonho":d.name+" · "+d.state;
b.append(light,msg,by);b.onclick=()=>open(d.id,b);return b
}
function drawTree(){
$("dreamOrbs").replaceChildren(...data().map(orb));
$("dreamCount").textContent=rows.length+" sonhos ilustrativos"+(own?" + o seu":"")
}
function drawList(){
const query=$("searchDream").value.trim().toLocaleLowerCase("pt-BR"),type=$("filterDream").value;
const found=data().filter(d=>(type==="all"||d.type===type)&&(d.text+" "+d.name).toLocaleLowerCase("pt-BR").includes(query));
const target=$("dreamList");target.replaceChildren();
if(!found.length){const empty=document.createElement("p");empty.textContent="Nenhum sonho encontrado nesta prévia. Tente outra palavra.";target.append(empty);return}
for(const d of found){
const b=document.createElement("button");b.type="button";b.className="list-dream";
const tag=document.createElement("span");tag.className="list-category";tag.textContent=themes[d.type]||"MEU SONHO";
const q=document.createElement("strong");q.textContent=d.text;
const by=document.createElement("small");by.textContent=d.mine?"Seu sonho, nesta visita":d.name+" · "+d.state+" · exemplo ilustrativo";
b.append(tag,q,by);b.onclick=()=>open(d.id,b);target.append(b)
}
}
function view(list,doScroll){
showList=list;$("garden").hidden=list;$("listSection").hidden=!list;
$("switchView").textContent=list?"✳ Ver em árvore":"☷ Ver em lista";$("switchView").setAttribute("aria-pressed",String(list));
if(list)drawList();if(doScroll)scroll($(list?"listSection":"garden"))
}
function open(id,trigger){
const d=data().find(x=>x.id===id);if(!d)return;
focusReturn=trigger||document.activeElement;
$("dreamModalCategory").textContent=themes[d.type]||"MEU SONHO";
$("dreamModalTitle").textContent=d.mine?"Seu sonho começou a florescer":"Toda luz guarda uma história";
$("dreamModalBody").textContent=d.text;
$("dreamModalBy").textContent=d.mine?"Seu sonho · nesta visita":d.name+" · "+d.state;
$("waterDream").dataset.id=id;$("waterCount").textContent=String(water.get(id)||0);
$("wishOverlay").hidden=false;document.body.classList.add("no-scroll");$("dreamDialog").focus()
}
function close(type){
$(type==="dream"?"wishOverlay":"plantOverlay").hidden=true;
if($("wishOverlay").hidden&&$("plantOverlay").hidden)document.body.classList.remove("no-scroll");
const old=focusReturn;focusReturn=null;if(old&&old.focus)old.focus()
}
function plant(){focusReturn=document.activeElement;$("plantOverlay").hidden=false;$("plantForm").hidden=false;$("plantSuccess").hidden=true;document.body.classList.add("no-scroll");$("plantDialog").focus()}
function submit(e){
e.preventDefault();
if(!$("plantForm").reportValidity())return;
const text=$("plantText").value.trim();
if(text.length<12){$("plantText").setCustomValidity("Escreva ao menos 12 caracteres.");$("plantForm").reportValidity();return}
own={id:"meu-sonho",mine:true,type:$("plantCategory").value,name:$("plantName").value.trim()||"Você",text:text,x:52,y:58,color:"#ffe6b8"};
$("plantPreview").textContent="“"+text+"”";
$("plantForm").hidden=true;$("plantSuccess").hidden=false;drawTree();drawList()
}
function selectMusic(key){
const s=songs[key];if(!s)return;song=key;
$("musicPanel").querySelectorAll("[data-music]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.music===key)));
const frame=document.createElement("iframe");frame.src=s.iframe;frame.title="Player oficial: "+s.name+", "+s.artist;frame.height=String(s.height);frame.loading="lazy";frame.allow="autoplay; encrypted-media; fullscreen; picture-in-picture";frame.setAttribute("referrerpolicy","strict-origin-when-cross-origin");$("musicEmbed").replaceChildren(frame);
$("musicExternal").href=s.link;$("musicExternal").textContent="Ouvir "+s.name+" na plataforma oficial ↗"
}
function toggleMusic(){
const el=$("musicPanel");el.hidden=!el.hidden;$("musicToggle").setAttribute("aria-expanded",String(!el.hidden));
if(!el.hidden){if(!$("musicEmbed").firstElementChild)selectMusic(song);$("closeMusic").focus()}
}
function stars(){
const frag=document.createDocumentFragment();
for(let i=0;i<120;i++){let x=document.createElement("span");x.className="star";
x.style.cssText="--x:"+((i*53+7)%100)+"%;--y:"+((i*71+17)%100)+"%;--size:"+(i%7?1.2:2.3)+"px;--opacity:"+(.45+(i%8)*.06)+";--time:"+(4+i%8)+"s;--delay:-"+(i%9)+"s";
frag.append(x)}$("starSky").append(frag)
}
function trap(e){
if(e.key!=="Tab")return;const modal=!$("plantOverlay").hidden?$("plantDialog"):!$("wishOverlay").hidden?$("dreamDialog"):null;if(!modal)return;
const els=[...modal.querySelectorAll("button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled])")].filter(x=>x.getClientRects().length);
if(!els.length)return;
if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus()}
else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus()}
}
$("plantDream").onclick=plant;$("gardenPlant").onclick=plant;
$("plantForm").addEventListener("submit",submit);
$("plantText").addEventListener("input",()=>{$("plantText").setCustomValidity("");$("wordCounter").textContent=$("plantText").value.length+" / 360"});
$("seeNewWish").onclick=()=>{close("plant");view(false,true);setTimeout(()=>$("dreamOrbs").querySelector('[data-id="meu-sonho"]')?.focus(),paused?0:600)};
$("waterDream").onclick=()=>{let id=$("waterDream").dataset.id;water.set(id,(water.get(id)||0)+1);$("waterCount").textContent=String(water.get(id))};
$("switchView").onclick=()=>view(!showList,true);$("backToTree").onclick=()=>view(false,true);
$("findDream").onclick=()=>{view(true,true);$("searchDream").focus({preventScroll:true})};
$("searchDream").oninput=drawList;$("filterDream").onchange=drawList;
$("gardenPrev").onclick=()=>{index=(index+data().length-1)%data().length;open(data()[index].id,$("gardenPrev"))};
$("gardenNext").onclick=()=>{index=(index+1)%data().length;open(data()[index].id,$("gardenNext"))};
$("pauseMotion").onclick=()=>{paused=!paused;document.body.classList.toggle("motion-off",paused);$("pauseMotion").textContent=paused?"▶ Retomar movimento":"Ⅱ Pausar movimento";$("pauseMotion").setAttribute("aria-pressed",String(paused))};
$("fullscreenButton").onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $("dreamExperience").requestFullscreen()}catch(e){$("fullscreenButton").textContent="⛶ Indisponível"}};
document.addEventListener("fullscreenchange",()=>{$("fullscreenButton").textContent=document.fullscreenElement?"⊠ Sair da tela cheia":"⛶ Tela cheia";$("fullscreenButton").setAttribute("aria-pressed",String(!!document.fullscreenElement))});
document.querySelectorAll('[data-close="dream"]').forEach(b=>b.onclick=()=>close("dream"));
document.querySelectorAll('[data-close="plant"]').forEach(b=>b.onclick=()=>close("plant"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("wishOverlay").hidden)close("dream");else if(!$("plantOverlay").hidden)close("plant");else if(!$("musicPanel").hidden)toggleMusic()}trap(e)});
$("musicToggle").onclick=toggleMusic;$("closeMusic").onclick=()=>{toggleMusic();$("musicToggle").focus()};
$("musicPanel").querySelectorAll("[data-music]").forEach(b=>b.onclick=()=>selectMusic(b.dataset.music));
let raf=0;$("treeScene").addEventListener("pointermove",e=>{
if(paused||e.pointerType!=="mouse")return;cancelAnimationFrame(raf);const box=$("treeScene").getBoundingClientRect();
const x=((e.clientX-box.left)/box.width-.5)*9,y=((e.clientY-box.top)/box.height-.5)*8;
raf=requestAnimationFrame(()=>$("treeScene").style.transform="translate3d("+x+"px,"+y+"px,0)")
});
$("treeScene").addEventListener("pointerleave",()=>$("treeScene").style.transform="");
stars();drawTree();drawList();document.body.classList.toggle("motion-off",paused);
if(paused){$("pauseMotion").textContent="▶ Retomar movimento";$("pauseMotion").setAttribute("aria-pressed","true")}
})();