/* Prêmio Conexão CRM 2027 · Jornada compacta V6
   Progressive enhancement; no interaction with voting, nomination or history state.
*/
(function(){
"use strict";
const wrapper=document.getElementById("journeyFlow");
if(!wrapper)return;
const tabs=Array.from(wrapper.querySelectorAll(".journey-step"));
const panel=document.getElementById("journeyPanel");
const stepIndex=document.getElementById("journeyStageIndex");
const heading=document.getElementById("journeyStageHeading");
const description=document.getElementById("journeyStageDescription");
const poster=document.getElementById("journeyPoster");
const stamp=document.getElementById("journeyStamp");
const caption=document.getElementById("journeyCaption");
const photo=document.getElementById("journeyPhoto");
const prev=document.getElementById("journeyPrev");
const next=document.getElementById("journeyNext");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
const stages=[
{tag:"01 / O CONVITE",heading:"Tudo começa com <em>um convite</em>",description:"Apresentamos as categorias e as regras para que todo mundo saiba como participar da nossa primeira edição",poster:"✳",stamp:"ESTREIA<br>2027",caption:"Tudo começa aqui",img:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=580&q=76"},
{tag:"02 / INDICAÇÕES",heading:"Tem alguém que merece <em>ser visto?</em>",description:"A comunidade poderá indicar profissionais, projetos e tecnologias que fizeram diferença. Cada indicação conta uma história",poster:"✷",stamp:"GENTE QUE<br>FAZ",caption:"Um nome de cada vez",img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=580&q=76"},
{tag:"03 / CURADORIA",heading:"Toda história merece <em>atenção</em>",description:"Conferimos critérios, evidências e elegibilidade. É o cuidado que dá credibilidade ao reconhecimento",poster:"✳",stamp:"CRITÉRIO<br>PRIMEIRO",caption:"Cada detalhe importa",img:"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=580&q=76"},
{tag:"04 / ESCOLHA",heading:"Chega a hora de <em>reconhecer</em>",description:"Pessoas poderão receber votos da comunidade, cases terão avaliação técnica e ferramentas seguirão critérios próprios, conforme o regulamento",poster:"✷",stamp:"UMA ESCOLHA<br>JUSTA",caption:"Com transparência",img:"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=580&q=76"},
{tag:"05 / A GRANDE NOITE",heading:"A primeira noite de <em>muitas histórias</em>",description:"A estreia reúne a comunidade para revelar os homenageados e inaugurar o Hall da Fama Conexão CRM",poster:"✳",stamp:"PRIMEIRAS<br>ESTRELAS",caption:"O palco é de vocês",img:"https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=580&q=76"}
];
let current=0,token=0;
function isMotionAllowed(){
return !reduced.matches&&!document.documentElement.classList.contains("motion-off");
}
function setStage(index,focus){
 index=Math.max(0,Math.min(stages.length-1,index));
 if(index===current&&wrapper.dataset.ready==="true"){
  if(focus)tabs[index].focus();
  return;
 }
 current=index;
 const s=stages[index];
 const render=()=>{
  stepIndex.textContent=s.tag;
  heading.innerHTML=s.heading;
  description.textContent=s.description;
  poster.textContent=s.poster;
  stamp.innerHTML=s.stamp;
  caption.textContent=s.caption;
  photo.src=s.img;
  panel.setAttribute("aria-labelledby",tabs[index].id);
  wrapper.dataset.step=String(index);
  tabs.forEach((tab,i)=>{
   tab.setAttribute("aria-selected",String(i===index));
   tab.tabIndex=i===index?0:-1;
  });
  prev.disabled=index===0;
  next.textContent=index===stages.length-1?"Rever a jornada ↺":"Próxima etapa →";
  wrapper.dataset.ready="true";
  if(focus)tabs[index].focus();
 };
 const scene=panel.querySelector(".journey-stage-content");
 const art=panel.querySelector(".journey-art");
 if(isMotionAllowed()&&window.gsap&&wrapper.dataset.ready==="true"){
  const g=window.gsap;
  g.killTweensOf([scene,art]);
  const id=++token;
  g.to([scene,art],{opacity:0,y:-13,duration:.17,ease:"power1.in",onComplete:()=>{
   if(id!==token)return;
   render();
   g.fromTo(scene,{opacity:0,y:22},{opacity:1,y:0,duration:.5,ease:"power3.out",clearProps:"opacity,transform"});
   g.fromTo(art,{opacity:0,x:32,rotate:4},{opacity:1,x:0,rotate:0,duration:.7,ease:"power3.out",clearProps:"opacity,transform"});
  }});
 }else{token++;render()}
}
tabs.forEach((tab,index)=>{
 tab.addEventListener("click",()=>setStage(index,false));
 tab.addEventListener("keydown",e=>{
  if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;
  e.preventDefault();
  const nextIndex=e.key==="Home"?0:e.key==="End"?stages.length-1:e.key==="ArrowRight"?(index+1)%stages.length:(index+stages.length-1)%stages.length;
  setStage(nextIndex,true);
 });
});
prev.addEventListener("click",()=>setStage(current-1,false));
next.addEventListener("click",()=>setStage(current===stages.length-1?0:current+1,false));
setStage(0,false);
})();