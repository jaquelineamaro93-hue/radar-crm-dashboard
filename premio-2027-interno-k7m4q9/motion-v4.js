/* Conexão CRM Prêmio 2027
   Progressive enhancement over the established v3 interface.
   No localStorage writes, no form history or vote mutation.
   GSAP and ScrollTrigger are optional; CSS / IntersectionObserver fallback.
*/
(function(){
"use strict";
var doc=document,root=doc.documentElement;
var reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
var shouldAnimate=!reduce.matches;
var g=window.gsap,ST=window.ScrollTrigger;
var ctx=null,observer=null,started=false;
var progress=doc.getElementById("motionProgressFill");
var motionSwitch=doc.getElementById("motionSwitch");
var intro=doc.getElementById("intro");
var initObserver=null;
function setProgress(){
 if(!progress)return;
 var max=Math.max(1,root.scrollHeight-window.innerHeight);
 var fraction=Math.min(1,Math.max(0,window.scrollY/max));
 progress.style.transform="scaleX("+fraction+")";
}
window.addEventListener("scroll",setProgress,{passive:true});
window.addEventListener("resize",setProgress,{passive:true});
setProgress();
function setSwitchText(){
 if(!motionSwitch)return;
 motionSwitch.textContent=shouldAnimate?"Pausar movimento":"Ativar movimento";
 motionSwitch.setAttribute("aria-pressed",String(shouldAnimate));
}
setSwitchText();
function fallbackReveal(){
 if(observer){observer.disconnect();observer=null}
 root.classList.remove("motion-ready");
 if(!shouldAnimate||!("IntersectionObserver" in window))return;
 observer=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
   if(e.isIntersecting){e.target.classList.add("motion-in");observer.unobserve(e.target)}
  })
 },{threshold:.12,rootMargin:"0px 0px -4% 0px"});
 Array.prototype.forEach.call(doc.querySelectorAll("[data-reveal]"),function(el){observer.observe(el)});
}
function setupGsap(){
 if(!shouldAnimate){root.classList.add("motion-off");return}
 root.classList.remove("motion-off");
 if(!g||!ST){fallbackReveal();return}
 g.registerPlugin(ST);
 root.classList.add("motion-ready");
 ctx=g.context(function(){
  var isDesktop=window.innerWidth>=810;
  var all=doc.querySelectorAll("[data-reveal]");
  all.forEach(function(el){
   g.fromTo(el,{autoAlpha:0,y:el.classList.contains("section-heading")?65:42},{
    autoAlpha:1,y:0,duration:1.2,ease:"power3.out",clearProps:"transform,opacity,visibility",
    scrollTrigger:{trigger:el,start:"top 92%",once:true}
   })
  });
  var hero=doc.querySelector(".hero");
  if(hero){
   var parts=[".hero .eyebrow",".hero .hero-sans",".hero h1 em",".hero #heroHighlight",".hero .hero-sub",".hero .hero-actions",".hero .hero-foot"];
   var tl=g.timeline({paused:true,defaults:{ease:"power3.out"}});
   parts.forEach(function(sel,i){
    var node=doc.querySelector(sel);if(node)tl.fromTo(node,{y:i%2?68:34,autoAlpha:0},{y:0,autoAlpha:1,duration:.93,clearProps:"opacity,visibility,transform"},i<3?i*.16:Math.max(.3,i*.14))
   });
   [".hero-photo",".hero-cut-a",".hero-cut-b",".hero-handstamp",".hero-photo-label",".hero-film-caption"].forEach(function(sel,i){
    var node=doc.querySelector(sel);
    if(node){tl.fromTo(node,{scale:.78,autoAlpha:0,rotation:i%2?-15:15,y:55},{scale:1,autoAlpha:1,rotation:i===1?-8:i===2?8:i===4?8:i===0?2.5:i===5?-9:0,y:0,duration:1.4,ease:"expo.out",clearProps:"opacity,visibility"},Math.max(.15,i*.2))}
   });
   var startHero=function(){if(!started){started=true;tl.play(0)}};
   if(intro&&!intro.classList.contains("hidden")){
    var mo=new MutationObserver(function(){
     if(intro.classList.contains("hidden")){mo.disconnect();startHero()}
    });mo.observe(intro,{attributes:true,attributeFilter:["class"]});
   }else startHero();
   if(isDesktop){
    g.to(".hero-photo",{y:-90,rotation:0,scale:1.085,scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:1.1}});
    g.to(".hero-cut-a",{x:-80,y:120,rotation:-18,scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:1.2}});
    g.to(".hero-cut-b",{x:65,y:-140,rotation:18,scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:1.4}});
    g.to(".hero-inkring",{rotation:110,scale:1.3,scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:1.6}});
   }
  }
  doc.querySelectorAll(".star-tile").forEach(function(tile,i){
   g.fromTo(tile,{autoAlpha:0,y:100,rotation:i%2===0?-8:10,scale:.9},{autoAlpha:1,y:0,rotation:i%4===1?3:i%4===2?-3:i%4===3?2:-2,scale:1,duration:1.05,ease:"back.out(1.16)",scrollTrigger:{trigger:tile,start:"top 105%",once:true}})
   tile.addEventListener("pointerenter",function(){
    if(!shouldAnimate)return;
    var icon=tile.querySelector("svg");
    if(icon)g.to(icon,{rotation:55,duration:.5,ease:"power2.out"})
   });
   tile.addEventListener("pointerleave",function(){
    var icon=tile.querySelector("svg");
    if(icon)g.to(icon,{rotation:0,duration:.55,ease:"power2.out"})
   })
  });
  doc.querySelectorAll(".journey-row").forEach(function(el){
   ST.create({trigger:el,start:"top 65%",end:"bottom 40%",toggleClass:"is-active"});
   var count=el.querySelector(".journey-count");
   if(count){g.fromTo(count,{y:50,autoAlpha:.25,rotation:-8},{y:0,autoAlpha:1,rotation:0,ease:"power2.out",scrollTrigger:{trigger:el,start:"top 87%",end:"top 46%",scrub:1}})}
  });
  if(isDesktop){
   var process=doc.querySelector(".process-section");
   if(process){ /* Painel metodológico permanece legível durante a animação. */ }
   g.to(".walk-ribbon",{x:-80,scrollTrigger:{trigger:".walk-section",start:"top bottom",end:"bottom top",scrub:2}});
   g.to(".process-section .process-heading",{y:-33,scrollTrigger:{trigger:".process-section",start:"top bottom",end:"bottom top",scrub:2}});
  }
  doc.querySelectorAll(".tech-link").forEach(function(link,i){
   g.fromTo(link,{autoAlpha:0,y:38,rotation:i%2?4:-4},{autoAlpha:1,y:0,rotation:0,duration:.75,delay:i*.11,ease:"power2.out",scrollTrigger:{trigger:".tech-choices",start:"top 95%",once:true}})
  });
  var hall=doc.querySelector("#hall .hall-stage");
  if(hall){
   g.fromTo(hall,{clipPath:"inset(0 48% 0 48%)"},{clipPath:"inset(0 0% 0 0%)",duration:1.7,ease:"power4.inOut",scrollTrigger:{trigger:hall,start:"top 92%",once:true}});
  }
  if(intro&&!intro.classList.contains("hidden")){
   g.fromTo(".onboarding-copy",{autoAlpha:0,y:42},{autoAlpha:1,y:0,duration:1.05,ease:"power3.out"});
   g.fromTo(".invite-ticket",{autoAlpha:0,scale:.84,rotation:-8},{autoAlpha:1,scale:1,rotation:3,duration:1.3,ease:"expo.out",delay:.15});
  }
 });
 ST.refresh();
}
function reset(){if(observer){observer.disconnect();observer=null}if(ctx){ctx.revert();ctx=null}root.classList.remove("motion-ready");root.classList.remove("motion-off");doc.querySelectorAll(".journey-row").forEach(function(el){el.classList.remove("is-active")})}
function rebuild(){reset();if(shouldAnimate){setupGsap()}else root.classList.add("motion-off");setSwitchText();setProgress()}
if(motionSwitch)motionSwitch.addEventListener("click",function(){shouldAnimate=!shouldAnimate;started=false;rebuild()});
if(reduce.addEventListener)reduce.addEventListener("change",function(event){
 shouldAnimate=!event.matches;started=false;rebuild()
});
function setupProcess(){
 var tabs=Array.prototype.slice.call(doc.querySelectorAll(".process-tab"));
 var panels=Array.prototype.slice.call(doc.querySelectorAll(".process-panel"));
 if(!tabs.length||!panels.length)return;
 function activate(index,focus){
  tabs.forEach(function(t,i){t.setAttribute("aria-selected",String(i===index));t.setAttribute("tabindex",i===index?"0":"-1")});
  panels.forEach(function(p,i){p.hidden=i!==index});
  if(focus)tabs[index].focus();
  var panel=panels[index];
  if(shouldAnimate&&g){g.fromTo(panel,{autoAlpha:0,y:23},{autoAlpha:1,y:0,duration:.48,ease:"power2.out",clearProps:"opacity,visibility,transform"})}
 }
 tabs.forEach(function(tab,i){
  tab.addEventListener("click",function(){activate(i,false)});
  tab.addEventListener("keydown",function(e){
   if(["ArrowRight","ArrowDown","ArrowLeft","ArrowUp","Home","End"].indexOf(e.key)===-1)return;
   e.preventDefault();
   var next=e.key==="Home"?0:e.key==="End"?tabs.length-1:e.key==="ArrowRight"||e.key==="ArrowDown"?(i+1)%tabs.length:(i+tabs.length-1)%tabs.length;
   activate(next,true)
  })
 });
 activate(0,false)
}
function setupTech(){
 doc.querySelectorAll(".tech-link").forEach(function(button){
  button.addEventListener("click",function(){
   var id=button.getAttribute("data-tech-category");
   var all=doc.getElementById("calcada");
   var target=doc.querySelector('.star-tile[data-cat="'+id+'"]');
   if(!target){var chip=doc.querySelector('[data-filter="todos"]');if(chip)chip.click();target=doc.querySelector('.star-tile[data-cat="'+id+'"]')}
   if(target){
    target.scrollIntoView({behavior:reduce.matches?"auto":"smooth",block:"center"});
    if(shouldAnimate&&g){g.fromTo(target,{filter:"brightness(1.5)"},{filter:"brightness(1)",duration:1.2})}
    setTimeout(function(){target.focus({preventScroll:true})},reduce.matches?0:550)
   }else if(all)all.scrollIntoView({behavior:reduce.matches?"auto":"smooth"})
  })
 })
}
setupProcess();setupTech();
if(!g||!ST){fallbackReveal()}else setupGsap();
var lastWidth=window.innerWidth;
window.addEventListener("resize",function(){
 var width=window.innerWidth;
 if(Math.abs(width-lastWidth)>130){lastWidth=width;started=false;rebuild()}
},{passive:true});
})();