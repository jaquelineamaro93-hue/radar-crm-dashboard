/* Jardim dos Sonhos · ambient audio v8.
   The supplied 2m21 remix is ALREADY a clip. Playback starts at zero.
   Public deployment requires authorised audio file at ./assets/sonhos-remix-maycon.mp3 .
   Never changes award soundtrack or demo votes. */
(function(){
"use strict";
const audio=document.getElementById("gardenAmbientAudio");
const play=document.getElementById("gardenSoundPlay");
const mute=document.getElementById("gardenSoundMute");
const status=document.getElementById("gardenSoundStatus");
const dock=document.getElementById("gardenSoundDock")||document.querySelector(".garden-sound-dock");
const alternative=document.getElementById("gardenSoundFallback");
const upload=document.getElementById("gardenSoundLocalFile");
if(!audio||!play||!mute||!status||!dock)return;
const key="conexaocrm_dreams_sound_v8";
let preference=null;
try{preference=JSON.parse(sessionStorage.getItem(key)||"null")}catch(e){}
let deliberatePause=!!(preference&&preference.paused);
let gestureRequired=false,resourceFailed=false;
let playSeq=0;
audio.loop=true;
audio.volume=.42;
audio.muted=!!(preference&&preference.muted);
function active(){return !audio.paused&&!audio.ended}
function save(){
 try{sessionStorage.setItem(key,JSON.stringify({paused:deliberatePause,muted:audio.muted}))}catch(e){}
}
function paint(){
 const isActive=active();
 play.textContent=isActive?"❚❚ Pausar":gestureRequired?"▶ Ativar música":"▶ Tocar";
 play.setAttribute("aria-label",isActive?"Pausar música do Jardim dos Sonhos":"Tocar música do Jardim dos Sonhos");
 play.setAttribute("aria-pressed",String(isActive));
 mute.textContent=audio.muted?"🔇 Silenciado":"🔊 Som";
 mute.setAttribute("aria-pressed",String(audio.muted));
 mute.setAttribute("aria-label",audio.muted?"Reativar som da música":"Silenciar a música");
 dock.classList.toggle("waiting-for-gesture",gestureRequired&&!deliberatePause&&!isActive);
 if(resourceFailed){
  status.textContent="Arquivo ainda não hospedado nesta prévia. Use a versão oficial ou carregue seu MP3.";
  alternative.hidden=false;
 }else{
  status.textContent=isActive?(audio.muted?"Música tocando em silêncio":"Música ambiente tocando"):
    (deliberatePause?"Música pausada":gestureRequired?"Toque para ativar a trilha":"Preparando trilha dos sonhos");
  alternative.hidden=true;
 }
}
function start(manual){
 if(manual)deliberatePause=false;
 if(deliberatePause||resourceFailed)return paint();
 if(active()){gestureRequired=false;return paint()}
 let attempt;
 const seq=++playSeq;
 try{attempt=audio.play()}catch(e){
  gestureRequired=e&&e.name==="NotAllowedError";paint();return;
 }
 if(attempt&&typeof attempt.then==="function"){
  attempt.then(()=>{
   if(deliberatePause)audio.pause();
   gestureRequired=false;resourceFailed=false;
   paint();save();
  }).catch(e=>{
   if(seq!==playSeq)return;
   if(e&&e.name==="NotAllowedError")gestureRequired=true;
   else if(e&&e.name!=="AbortError")resourceFailed=true;
   paint();
  });
 }else{paint();save()}
}
function pause(){
 deliberatePause=true;gestureRequired=false;playSeq++;
 audio.pause();paint();save();
}
play.addEventListener("click",()=>active()?pause():start(true));
mute.addEventListener("click",()=>{
 audio.muted=!audio.muted;
 paint();save();
 if(!deliberatePause&&!active()&&!resourceFailed)start(false);
});
audio.addEventListener("loadeddata",()=>{resourceFailed=false;paint()});\naudio.addEventListener("canplay",()=>{resourceFailed=false;paint()});\naudio.addEventListener("playing",()=>{gestureRequired=false;resourceFailed=false;paint()});
audio.addEventListener("pause",paint);
audio.addEventListener("volumechange",()=>{paint();save()});
audio.addEventListener("error",()=>{resourceFailed=true;paint()});
function initialGesture(e){
 if(deliberatePause||active()||resourceFailed)return;
 if(e&&e.isTrusted===false)return;
 const el=e&&e.target;
 if(el&&typeof el.closest==="function"&&el.closest("#gardenSoundPlay,#gardenSoundMute,#gardenSoundLocalFile"))return;
 start(false);
}
document.addEventListener("pointerdown",initialGesture,{passive:true,capture:true});
document.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")initialGesture(e)},true);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!deliberatePause&&!active()&&!resourceFailed)start(false)});
window.addEventListener("pageshow",e=>{if(e.persisted&&!deliberatePause&&!active()&&!resourceFailed)start(false)});
const picker=document.getElementById("gardenSoundPickFile");
if(picker&&upload){
 picker.addEventListener("click",()=>upload.click());
 upload.addEventListener("change",()=>{
  const file=upload.files&&upload.files[0];
  if(!file||!(file.type==="audio/mpeg"||file.name.toLowerCase().endsWith(".mp3")))return;
  const previous=audio.dataset.localObjectUrl;
  const objectURL=URL.createObjectURL(file);
  audio.dataset.localObjectUrl=objectURL;
  audio.src=objectURL;audio.load();
  if(previous)URL.revokeObjectURL(previous);
  resourceFailed=false;deliberatePause=false;gestureRequired=false;
  paint();start(true);
 });
}
paint();
if(!deliberatePause)start(false);
})();