/* Case videos: authorized, local-only public assets. No member data is queried. */
(()=>{'use strict';
 const host=document.getElementById('case-videos');if(!host)return;
 const approvedPath=(s,extension)=>typeof s==='string'&&new RegExp('^/cases/videos/[a-z0-9-]+\\.'+extension+'$').test(s);
 const safeLabel=(v)=>typeof v==='string'?v.slice(0,160):'';
 let loaded=[];
 const locale=()=>window.CXLanguage?.getLocale?.()||(()=>{try{return localStorage.getItem('conexao:locale')||'pt-BR'}catch{return 'pt-BR'}})();
 const strings={'pt-BR':['Histórias em vídeo','Entrevistas originais com publicação autorizada.'],
   'en':['Video stories','Original interviews shared with permission.'],
   'es-419':['Historias en video','Entrevistas originales compartidas con autorización.']};
 function render(){
  const lang=['pt-BR','en','es-419'].includes(locale())?locale():'pt-BR';
  const clips=loaded.filter(v=>v&&v.authorized===true&&approvedPath(v.src,'mp4')&&
   typeof v.name==='string'&&v.title&&['pt-BR','en','es-419'].every(code=>typeof v.title[code]==='string'&&v.title[code].trim()));
  if(!clips.length){host.hidden=true;host.replaceChildren();return}
  const texts=strings[lang];host.hidden=false;host.replaceChildren();
  const container=document.createElement('div');container.className='wrap';
  const title=document.createElement('h2');title.textContent=texts[0];
  const intro=document.createElement('p');intro.textContent=texts[1];intro.className='method';
  const grid=document.createElement('div');grid.className='grid';
  clips.forEach(clip=>{
   const figure=document.createElement('figure');figure.className='card video-card';
   const video=document.createElement('video');video.controls=true;video.preload='metadata';video.playsInline=true;
   if(approvedPath(clip.poster,'(?:webp|png|jpg)'))video.poster=clip.poster;
   const source=document.createElement('source');source.src=clip.src;source.type='video/mp4';video.append(source);
   for(const [key,url] of Object.entries(clip.captions||{}))if(['pt-BR','en','es-419'].includes(key)&&approvedPath(url,'vtt')){
    const track=document.createElement('track');track.kind='subtitles';track.srclang=key;track.label=key;track.src=url;if(key===lang)track.default=true;video.append(track);
   }
   const caption=document.createElement('figcaption');caption.textContent=safeLabel(clip.title[lang])+' · '+safeLabel(clip.name);
   figure.append(video,caption);grid.append(figure);
  });
  container.append(title,intro,grid);host.append(container);
 }
 fetch('/cases/video-manifest.json',{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():{videos:[]}).then(data=>{
  loaded=Array.isArray(data.videos)?data.videos:[];render();
 }).catch(()=>{host.hidden=true;});
 window.addEventListener('cx:locale-change',render);
})();