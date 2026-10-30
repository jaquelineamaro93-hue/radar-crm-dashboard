'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const sync=html.slice(html.indexOf('function crmSyncAuth(){'),html.indexOf('function crmSetLanding(show){'));
// Token refresh must not replace the active public layout with the member shell.
for(const signed of [true,false]){
 const publicView={hidden:false},memberView={hidden:true};
 vm.runInNewContext(sync+';crmSyncAuth();',{
  crmSignedIn:()=>signed,crmWasSignedIn:signed,crmById:id=>id==='view-publica'?publicView:id==='view-logada'?memberView:null,window:{}
 });
 assert.equal(publicView.hidden,false);assert.equal(memberView.hidden,true);
}
assert(html.includes("crmHandleLocation();crmSyncAuth();document.documentElement.classList.remove('cx-route-boot');"),'direct route must initialize before session synchronization');
const css=fs.readFileSync('assets/portal-first-paint.css','utf8');
assert(!css.includes('#crmPublicWorkspace:not([hidden]){visibility:hidden'),'public content must not wait for optional layout JS');
assert(css.includes('html.cx-route-boot #view-publica > :not(.crm-navbar)'),'legacy landing must not flash on direct routes');
const xp=fs.readFileSync('assets/xp-embed.js','utf8');
for(const [path,target] of [['/avatar-studio/','/painel/avatar/'],['/rankings/','/painel/rankings/']]){
 let destination;
 const top={};vm.runInNewContext(xp,{location:{pathname:path,search:'?xp_recommend=member',replace:x=>destination=x},URLSearchParams,window:{top,self:top}});
 assert.equal(destination,target+'?xp_recommend=member');assert(!destination.includes('#'));
}
for(const slug of ['ajuda','boas-praticas','novidades'])assert.equal(fs.readFileSync('painel/'+slug+'/index.html','utf8'),html,'clean help URL serves the portal directly');
console.log('PASS clean route boot, token refresh, direct help and XP redirects with preserved parameters');
