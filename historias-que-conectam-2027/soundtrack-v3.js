/* Shared sonic continuity · Prologue ("O futuro tem nome") · Conexão CRM 2027
   This controls the soundtrack throughout the prologue and hands off playhead/preferences
   to the awards page through per-tab sessionStorage. It does not store story responses.
*/
(function(){
"use strict";
const audio=document.getElementById("dreamSoundtrack");
const playButton=document.getElementById("dreamAudioPlay");
const muteButton=document.getElementById("dreamAudioMute");
const bar=document.getElementById("dreamAudioBar");
const label=document.getElementById("dreamAudioStatus");
if(!audio||!playButton||!muteButton||!bar)return;
const key="conexaocrm_awards_soundtrack_state_v1";
let previous=null;
try{previous=JSON.parse(sessionStorage.getItem(key)||"null")}catch(e){}
let manuallyPaused=!!(previous&&previous.paused===true);
let needsGesture=false;
let restored=false;
let lastSaved=0;
let pendingTime=previous&&Number.isFinite(Number(previous.time))?Math.max(0,Number(previous.time)):0;
audio.volume=.42;
audio.muted=!!(previous&&previous.muted);
audio.loop=true;
function isPlaying(){return !audio.paused&&!audio.ended}
function restoreTime(){
 if(restored)return;
 if(!audio.duration||!Number.isFinite(audio.duration))return;
 restored=true;
 if(pendingTime>0.5){
  try{audio.currentTime=Math.min(pendingTime,Math.max(0,audio.duration-0.5))}catch(e){}
 }
}
audio.addEventListener("loadedmetadata",restoreTime);
if(audio.readyState>=1)restoreTime();
function syncUI(){
 const playing=isPlaying();
 playButton.textContent=playing?"❚❚ Pausar":needsGesture?"▶ Ativar trilha":"▶ Tocar";
 playButton.setAttribute("aria-label",playing?"Pausar trilha do prêmio":"Tocar trilha do prêmio");
 playButton.setAttribute("aria-pressed",String(playing));
 muteButton.textContent=audio.muted?"🔇 Silenciado":"🔊 Som";
 muteButton.setAttribute("aria-label",audio.muted?"Ativar o som da trilha":"Silenciar trilha sonora");
 muteButton.setAttribute("aria-pressed",String(audio.muted));
 bar.classList.toggle("needs-gesture",needsGesture&&!manuallyPaused&&!playing);
 if(label)label.textContent=playing?(audio.muted?"Trilha reproduzindo sem som":"Trilha reproduzindo"):(manuallyPaused?"Trilha pausada":"Trilha pronta para tocar");
}
function saveState(force){
 let t=0;
 try{t=Number(audio.currentTime)||0}catch(e){}
 if(!restored&&pendingTime>0.5&&t<0.5)t=pendingTime;
 const now=Date.now();
 if(!force&&now-lastSaved<1750)return;
 lastSaved=now;
 try{sessionStorage.setItem(key,JSON.stringify({time:t,paused:manuallyPaused,muted:audio.muted,source:"Five Armies",updatedAt:now}))}catch(e){}
}
function tryPlay(manual){
 if(manual)manuallyPaused=false;
 if(manuallyPaused||isPlaying()){syncUI();return}
 let pending;
 try{pending=audio.play()}catch(e){needsGesture=e&&e.name==="NotAllowedError";syncUI();return}
 if(pending&&typeof pending.then==="function"){
  pending.then(()=>{
   if(manuallyPaused)audio.pause();
   needsGesture=false;
   syncUI();
   saveState(true);
  }).catch(e=>{
   needsGesture=!!(e&&e.name==="NotAllowedError");
   syncUI();
  })
 }else syncUI();
}
function pause(){
 manuallyPaused=true;
 needsGesture=false;
 audio.pause();
 syncUI();saveState(true);
}
playButton.addEventListener("click",()=>{
 if(isPlaying())pause();
 else tryPlay(true);
});
muteButton.addEventListener("click",()=>{
 audio.muted=!audio.muted;
 if(!isPlaying()&&!manuallyPaused)tryPlay(true);
 syncUI();saveState(true);
});
audio.addEventListener("play",()=>{needsGesture=false;syncUI();saveState(true)});
audio.addEventListener("playing",()=>{needsGesture=false;syncUI();saveState(true)});
audio.addEventListener("pause",()=>{syncUI();saveState(true)});
audio.addEventListener("volumechange",()=>{syncUI();saveState(true)});
audio.addEventListener("timeupdate",()=>saveState(false));
audio.addEventListener("error",()=>{bar.classList.add("audio-error");syncUI()});
/* This first-gesture fallback is needed by Chrome / Safari autoplay policies. */
function firstGesture(e){
 if(manuallyPaused||isPlaying())return;
 if(e&&e.isTrusted===false)return;
 const node=e&&e.target;
 if(node&&typeof node.closest==="function"&&node.closest("#dreamAudioPlay,#dreamAudioMute"))return;
 tryPlay(false);
}
document.addEventListener("click",firstGesture,false);
document.addEventListener("keydown",e=>{
 if(e.key==="Enter"||e.key===" ")firstGesture(e);
},false);
window.addEventListener("pagehide",()=>saveState(true));
document.addEventListener("visibilitychange",()=>{
 if(!document.hidden&&!manuallyPaused&&!isPlaying())tryPlay(false);
});
window.addEventListener("pageshow",e=>{
 if(e.persisted&&!manuallyPaused&&!isPlaying())tryPlay(false);
});
/* A page navigation necessarily replaces the HTML audio element, so we restore the
   position on the next page rather than promising sample-perfect uninterrupted playback. */
document.querySelectorAll('a[href*="premio-2027-interno-k7m4q9"]').forEach(a=>{
 a.addEventListener("click",()=>saveState(true));
});
syncUI();
if(!manuallyPaused)tryPlay(false);
})();