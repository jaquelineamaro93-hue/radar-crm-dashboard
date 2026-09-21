const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict'),{webcrypto}=require('crypto');
const tick=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 const d=new JSDOM('<body></body>',{url:'https://conexaocrm.com',runScripts:'outside-only'}),w=d.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;
 let config,calls=[],rejectToken=true;
 w.google={accounts:{id:{initialize(c){config=c},renderButton(el){el.textContent='Google'}}}};
 w.authSb={auth:{async signInWithIdToken(input){calls.push(input);return rejectToken?{error:{message:'Invalid signature'}}:{data:{session:{access_token:'mock-session'}}}}}};
 w.eval(fs.readFileSync('conexao-crm/assets/google-login.js','utf8'));
 await w.CXGoogleLogin.open();let old=config;assert.match(config.nonce,/^[a-f0-9]{64}$/);assert.equal(config.ux_mode,'popup');
 await Promise.all([config.callback({credential:'mock-id-token'}),config.callback({credential:'mock-id-token'})]);assert.equal(calls.length,1);assert.equal(w.document.querySelector('dialog').open,true);assert(w.document.querySelector('[data-google-status]').textContent.includes('Não foi possível'));
 assert.equal(Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(calls[0].nonce))).toString('hex'),old.nonce);
 rejectToken=false;await w.CXGoogleLogin.open();assert.notEqual(config.nonce,old.nonce);await old.callback({credential:'stale'});assert.equal(calls.length,1);await config.callback({credential:'new'});assert.equal(calls.length,2);assert.equal(w.document.querySelector('dialog').open,false);
 const a=new JSDOM('<section id="comPanelGrupos"></section>',{url:'https://test.invalid/',runScripts:'outside-only'}),v=a.window;let updates=0;
 v.HTMLDialogElement.prototype.showModal=function(){this.open=true};v.HTMLDialogElement.prototype.close=function(){this.open=false};
 v.crmRequireSession=async()=>true;v.crmRefreshAdmin=async()=>{};v.crmAdminVerified=true;v.crmFetchDirectory=async()=>[{id:7,nome:'Profissional'}];
 v.authSb={from(){const q={select(){return q},eq(){return q},order(){return q},limit(){return q},update(){updates++;return q},then(resolve){resolve({data:[{id:'claim',freelancer_id:7,owner_id:'owner',evidence:'Canal profissional para confirmar'}],error:null})}};return q}};
 v.eval(fs.readFileSync('conexao-crm/assets/connections.js','utf8'));
 // Admin markup is created by a later DOMContentLoaded handler in the app.
 const admin=v.document.createElement('div');admin.id='crmModerationList';v.document.body.append(admin);await tick();
 assert(v.document.querySelector('#cxClaimModeration'));await v.CXConnections.moderation();assert(v.document.querySelector('#cxClaimModeration [data-claim]'));assert.equal(updates,0);v.CXConnections.clear();assert.equal(v.document.querySelector('#cxClaimModeration').textContent,'');
 console.log('PASS: direct Google token exchange, nonce hash, rejected-token feedback, duplicate/stale callback prevention; delayed admin mount, visible pending claim, no automatic approval, logout cleanup');
})().catch(e=>{console.error(e);process.exit(1)});
