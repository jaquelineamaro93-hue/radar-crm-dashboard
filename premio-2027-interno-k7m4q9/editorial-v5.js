/* CONEXÃO CRM Awards 2027, editorial experience V5
   Read-only interaction module: never modifies demo localStorage, votes or submissions.
   Three controlled scenes: people, independently judged cases, verified tech tools.
*/
(function(){
"use strict";
const root=document.documentElement;
const reel=document.getElementById("v5Reel");
if(!reel)return;
const title=document.getElementById("v5ReelTitle");
const desc=document.getElementById("v5ReelDescription");
const label=document.getElementById("v5ReelKicker");
const method=document.getElementById("v5ReelMethod");
const ratio=document.getElementById("v5ReelProgress");
const readout=document.getElementById("v5ReelReadout");
const panel=document.getElementById("v5ReelPanel");
const tabs=[...reel.querySelectorAll(".v5-reel-tab")];
const arts=[...reel.querySelectorAll(".v5-art-scene")];
const reM=window.matchMedia("(prefers-reduced-motion: reduce)");
const small=window.matchMedia("(max-width: 810px)");
const scenes=[
 {
  kicker:"01 / PESSOAS",
  heading:"O mercado é feito de <em>gente</em>",
  desc:"Em CRM, CX e CS existem trajetórias que inspiram, compartilham conhecimento e ajudam outras pessoas a crescer",
  method:"Proposta: indicação da comunidade → curadoria → voto popular"
 },
 {
  kicker:"02 / CASES",
  heading:"Ideias ganham valor quando <em>viram resultado</em>",
  desc:"Por trás de cada projeto há times que pensaram diferente, fizeram acontecer e deixaram aprendizados para o mercado",
  method:"Proposta: inscrição → evidências → avaliação por banca técnica"
 },
 {
  kicker:"03 / TECH AWARDS",
  heading:"A tecnologia também conta uma <em>história</em>",
  desc:"Reconhecer ferramentas é ouvir quem as utiliza de verdade e entender em quais contextos elas entregam valor",
  method:"Proposta: avaliações verificadas → qualificação → etapa final"
 }
];
let active=0,raf=0,hoverRaf=0;
function motionEnabled(){
 return !reM.matches&&!root.classList.contains("motion-off");
}
function setScene(i,initial){
 i=Math.min(2,Math.max(0,i));
 if(i===active&&!initial)return;
 active=i;
 reel.dataset.scene=String(i);
 const s=scenes[i];
 function switchText(){
  label.textContent=s.kicker;
  title.innerHTML=s.heading;
  desc.textContent=s.desc;
  method.textContent=s.method;
  if(readout)readout.textContent="0"+(i+1)+" / 03";
 }
 if(!initial&&motionEnabled()&&window.gsap){
  const g=window.gsap;
  g.killTweensOf([label,title,desc,method]);
  g.to([label,title,desc,method],{opacity:0,y:-14,duration:.2,stagger:.018,ease:"power1.in",onComplete:()=>{
   switchText();
   g.fromTo([label,title,desc,method],{opacity:0,y:25},{opacity:1,y:0,duration:.48,stagger:.06,ease:"power3.out",clearProps:"opacity,transform"})
  }});
 }else switchText();
 arts.forEach((el,j)=>{
  const shown=j===i;
  el.classList.toggle("is-active",shown);
  el.setAttribute("aria-hidden",String(!shown));
  el.style.transform="";
 });
 tabs.forEach((el,j)=>{
  const selected=j===i;
  el.setAttribute("aria-selected",String(selected));
  el.tabIndex=selected?0:-1;
 });
 if(ratio)ratio.style.transform="scaleX("+((i+1)/3)+")";
}
function frame(){
 raf=0;
 if(small.matches)return;
 const box=reel.getBoundingClientRect();
 const travel=Math.max(1,box.height-window.innerHeight);
 const p=Math.max(0,Math.min(1,-box.top/travel));
 const index=p>=.995?2:Math.min(2,Math.floor(p*3));
 setScene(index,false);
 if(ratio)ratio.style.transform="scaleX("+Math.max(.02,p)+")";
}
function onScroll(){
 if(!raf)raf=requestAnimationFrame(frame);
}
function go(index){
 if(small.matches){
  setScene(index,false);
  panel.scrollIntoView({behavior:reM.matches?"auto":"smooth",block:"nearest"});
  return;
 }
 const box=reel.getBoundingClientRect();
 const travel=Math.max(1,box.height-window.innerHeight);
 const scrollTop=window.scrollY+box.top;
 const target=scrollTop+travel*(index+.14)/3;
 window.scrollTo({top:target,behavior:reM.matches?"auto":"smooth"});
 setScene(index,false);
}
tabs.forEach((tab,i)=>{
 tab.addEventListener("click",()=>go(i));
 tab.addEventListener("keydown",e=>{
  if(!["ArrowRight","ArrowLeft","ArrowDown","ArrowUp","Home","End"].includes(e.key))return;
  e.preventDefault();
  let next=i;
  if(e.key==="Home")next=0;
  else if(e.key==="End")next=2;
  else next=(i+(e.key==="ArrowRight"||e.key==="ArrowDown"?1:2))%3;
  tabs[next].focus();go(next);
 });
});
setScene(0,true);
window.addEventListener("scroll",onScroll,{passive:true});
window.addEventListener("resize",onScroll,{passive:true});
small.addEventListener?.("change",()=>{
 if(!small.matches)frame();
 else setScene(active,true);
});
frame();
function pointerMove(e){
 if(small.matches||!motionEnabled())return;
 if(hoverRaf)cancelAnimationFrame(hoverRaf);
 const rect=reel.getBoundingClientRect();
 const rx=(e.clientX-rect.left)/rect.width-.5;
 const ry=(e.clientY-rect.top)/rect.height-.5;
 hoverRaf=requestAnimationFrame(()=>{
  const art=arts[active];
  if(art)art.style.transform="translate3d("+(rx*19).toFixed(2)+"px,"+(ry*14).toFixed(2)+"px,0) rotate("+(rx*1.1).toFixed(2)+"deg) scale(1)";
 });
}
reel.addEventListener("pointermove",pointerMove,{passive:true});
reel.addEventListener("pointerleave",()=>{
 if(hoverRaf)cancelAnimationFrame(hoverRaf);
 arts.forEach(a=>a.style.transform="");
});
const interlude=document.querySelector(".v5-interlude");
function syncMotion(){
 const enabled=motionEnabled();
 reel.dataset.motion=enabled?"on":"off";
 if(interlude)interlude.dataset.motion=enabled?"on":"off";
}
const ms=document.getElementById("motionSwitch");
ms?.addEventListener("click",()=>requestAnimationFrame(syncMotion));
reM.addEventListener?.("change",syncMotion);
syncMotion();
if("IntersectionObserver" in window){
 const o=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   const el=entry.target;
   el.querySelectorAll(".v5-mesh span").forEach(blob=>blob.style.animationPlayState=entry.isIntersecting?"running":"paused");
  });
 },{threshold:.02});
 o.observe(reel);if(interlude)o.observe(interlude);
}
const gsap=window.gsap;
const ST=window.ScrollTrigger;
if(gsap&&ST&&!reM.matches){
 gsap.registerPlugin(ST);
 const interludeText=document.querySelector(".v5-interlude h2");
 if(interlude&&interludeText){
  gsap.fromTo(interludeText,{scale:.78,rotation:-3},{scale:1,rotation:0,ease:"none",scrollTrigger:{trigger:interlude,start:"top bottom",end:"center center",scrub:1}});
  gsap.to(".v5-interlude .v5-mesh",{y:110,rotation:15,ease:"none",scrollTrigger:{trigger:interlude,start:"top bottom",end:"bottom top",scrub:1.5}});
 }
 gsap.fromTo(".v5-reel-art",{rotateY:-13,rotateZ:-4},{rotateY:0,rotateZ:0,duration:1.4,ease:"power3.out",scrollTrigger:{trigger:reel,start:"top 85%",once:true}});
}
})();