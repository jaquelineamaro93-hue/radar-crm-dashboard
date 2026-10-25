const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const source=fs.readFileSync('index.html','utf8');
const code=source.slice(source.indexOf('async function crmRefreshAdmin(){'),source.indexOf('async function crmVerificationAPI('));
const d=new JSDOM('<button id="crmAdminNav" hidden></button><button id="crmTeamAdminNav" hidden></button>');
let resolve;const ctx={CURRENT_USER:{id:'a'},crmValidatedUserId:'a',crmAuthEpoch:1,crmAdminVerified:false,isAdminLoggedIn:false,crmById:id=>d.window.document.getElementById(id),crmSignedIn:()=>true,authSb:{rpc:()=>new Promise(r=>resolve=r)},document:d.window.document,Event:d.window.Event};vm.createContext(ctx);vm.runInContext(code,ctx);
(async()=>{
 let pending=ctx.crmRefreshAdmin();assert(ctx.crmById('crmAdminNav').hidden);resolve({data:true,error:null});await pending;
 const a=ctx.crmById('crmAdminNav');assert(!a.hidden);assert.equal(a.dataset.crmRoleOwner,'a');
 pending=ctx.crmRefreshAdmin();assert.equal(ctx.crmAdminVerified,false,'authorization closed during revalidation');assert(!a.hidden,'same verified account keeps menu geometry');resolve({data:true,error:null});await pending;assert.equal(ctx.crmAdminVerified,true);
 pending=ctx.crmRefreshAdmin();resolve({data:false,error:null});await pending;assert(a.hidden,'revoked role hides admin items');assert.equal(ctx.crmAdminVerified,false);
 pending=ctx.crmRefreshAdmin();resolve({data:true,error:null});await pending;
 ctx.CURRENT_USER={id:'b'};ctx.crmValidatedUserId='b';pending=ctx.crmRefreshAdmin();assert(a.hidden,'different account cannot retain admin navigation');assert.equal(ctx.crmAdminVerified,false);resolve({data:false,error:null});await pending;
 const dom=new JSDOM('<div id="publicHero"></div><div id="loggedHeader"><span id="loggedUserName"></span><span id="loggedUserHeadline"></span><div id="loggedAvatar"></div></div>');
 const user={id:'a',user_metadata:{full_name:'Pessoa Teste',avatar_url:'https://example.invalid/avatar.png'}};
 const profileCtx={document:dom.window.document,CURRENT_PROFILE:{},CURRENT_USER:user,escapeHtml:x=>x,crmSafeUrl:x=>x,crmRenderSavedProfile:()=>{},isAdminLoggedIn:false,currentUserEmail:null,openAccountModal:()=>{}};vm.createContext(profileCtx);
 vm.runInContext(source.slice(source.indexOf('function activateLoggedArea('),source.indexOf('function deactivateLoggedArea(')),profileCtx);
 profileCtx.activateLoggedArea();const image=dom.window.document.querySelector('#loggedAvatar img');profileCtx.activateLoggedArea();assert.equal(dom.window.document.querySelector('#loggedAvatar img'),image,'unchanged avatar must not be recreated');
 console.log('PASS sidebar stability: same-account menu preserved, pending authorization denied, revocation and account change hide items, avatar node stable');
})().catch(e=>{console.error(e);process.exitCode=1});
// Route changes must not retrigger root-hidden observers for an unchanged shell.
const routeSource=source.match(/const publicView=crmById\('view-publica'\),memberView=crmById\('view-logada'\);if\(publicView.hidden===isPublic\)publicView.hidden=!isPublic;if\(memberView.hidden!==isPublic\)memberView.hidden=isPublic;/)?.[0];
assert(routeSource,'route visibility is conditional');
const shells={'view-publica':{_hidden:true,writes:0},'view-logada':{_hidden:false,writes:0}};
for(const shell of Object.values(shells))Object.defineProperty(shell,'hidden',{get(){return this._hidden},set(value){this._hidden=value;this.writes++}});
vm.runInNewContext(routeSource,{isPublic:false,crmById:id=>shells[id]});
assert.equal(shells['view-publica'].writes+shells['view-logada'].writes,0,'member navigation leaves shell visibility untouched');
assert(source.indexOf('id="cx-soft-ui-20261014"')<source.indexOf('</head>'),'theme blocks first paint');
