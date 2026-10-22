'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fallback=fs.readFileSync(path.join(root,'404.html'),'utf8');
assert.equal(html,fallback,'public route fallback should match index');
const start=html.indexOf('function crmTrackSavedJobReminderEvent(userId){');
const end=html.indexOf('async function saveScrapedJob(',start);
assert(start>=0&&end>start,'safe event helper should be beside job-save action');
const helper=html.slice(start,end);
new vm.Script(helper);
const main=html.slice(end,html.indexOf('function calculateMatchScore(',end));
assert.match(main,/crmTrackSavedJobReminderEvent\(session\.user\.id\)/);
assert.match(main,/if\(retry\.ok && retry\.status !== 409\)crmTrackSavedJobReminderEvent\(newSess\.user\.id\)/);
assert.match(main,/if\(resp\.status === 409\)[\s\S]+?return;/);
assert.doesNotMatch(helper,/vaga_url|vaga_title|vaga_company|fetch\(|\.from\(|\.rpc\(|service_role|smtp|send-message|sendEmail/);
assert.match(helper,/CURRENT_PROFILE\?\.receive_community_updates!==true/);
assert.match(helper,/CURRENT_USER\?\.id!==userId/);
assert.match(helper,/crmInngageEvent\('VAGA_SALVA', \{area:'radar',versao:'1'\}\)/);
function run(user,consented,exists=true){
  const calls=[];
  const ctx={
    CURRENT_USER:{id:user},
    CURRENT_PROFILE:{receive_community_updates:consented},
    window:{crmInngageEvent:exists?(...args)=>calls.push(args):null}
  };
  const fn=vm.runInNewContext('(function(){'+helper+'return crmTrackSavedJobReminderEvent;})()',ctx);
  assert.doesNotThrow(()=>fn('user-1'));
  return calls;
}
assert.equal(run('user-1',true).length,1,'opted-in owner should create an event');
assert.equal(run('user-1',false).length,0,'opted-out member must not be tracked');
assert.equal(run('user-2',true).length,0,'other member must not be tracked');
assert.equal(run('user-1',true,false).length,0,'save works without Inngage');
const event=run('user-1',true)[0];
assert.equal(event[0],'VAGA_SALVA');
assert.deepEqual(Object.keys(event[1]).sort(),['area','versao']);
const instructions=fs.readFileSync(path.join(root,'docs/inngage-saved-jobs-reminder.md'),'utf8');
assert.match(instructions,/Nenhum envio, recorrência ou campanha foi ativado/);
assert.match(instructions,/Um único endereço no campo Para, nenhum Cc e nenhum Cco/);
assert.match(instructions,/user_id.*campaign_key/);
console.log('PASS: confirmed saves emit only privacy-safe opt-in events; no mass email or automatic dispatch.');
