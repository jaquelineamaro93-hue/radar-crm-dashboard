'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('index.html'),css=read('assets/profile-modal-unified-20261027.css');
for(const route of ['404.html','freelancers/index.html','dashboard/index.html','open-to-work/index.html']){
 assert.equal(read(route),html,'SPA route must serve the same themed profile UI: '+route);
}
assert(html.includes('profile-modal-unified-20261027.css?v=20261027-modalall2'),'Modal stylesheet must load in document head with cache-bust');
assert(html.indexOf('profile-modal-unified-20261027.css')<html.indexOf('</head>'),'Must style before modal first paint');
assert(html.includes("dialog.className='crm-join-dialog crm-submission-dialog'"),'Verification dialog needs the new scoped visual class');
assert(html.includes('<div class="crm-submission-actions">'),'Verification buttons need a compact action group');
assert(html.includes("action:'issue',table")&&html.includes("action:'verify',id:challenge.id"),'Verification must still use real server challenge');
assert(html.includes("const quota=await authSb.rpc('crm_submission_status')"),'Anti-abuse submission quota preserved');
for(const selector of ['#profileModalOverlay.crm-profile-overlay','.crm-profile-modal-head','.cx-profile-tabs','.cx-profile-tab','.crm-profile-step-title','.crm-profile-chips','.crm-profile-footer','#flEditOverlay','#crmMatchResumeOverlay','dialog.crm-join-dialog.crm-submission-dialog','dialog.crm-submission-dialog .crm-submission-actions']){
 assert(css.includes(selector),'New unified modal CSS missing '+selector);
}
assert(css.includes('background:var(--cx-modal-accent)!important'),'Modals must use lilac instead of legacy orange');
assert(css.includes('background:var(--cx-modal-bg)!important'),'Modals must use navy instead of legacy brown');
assert(css.includes('@media(max-width:720px)')&&css.includes('@media(max-width:420px)'),'Responsive modal breakpoints missing');
assert(!css.includes('#f97316'),'Legacy orange must not appear in new modal stylesheet');
assert(css.includes('max-height:calc(100dvh - 36px)'),'Main editor must scroll on short screens');
assert(css.includes('body #profileModalOverlay .crm-profile-chips label:has(input:checked)'),'Selected tags need new palette');
assert(css.includes('.crm-profile-chips input:checked+span'),'Selected label must override retired orange child span');
assert(css.includes('position:relative!important;top:auto!important'),'Tabs must not overlap a wrapped sticky header');
let depth=0;for(const c of css){if(c==='{')depth++;else if(c==='}')depth--;assert(depth>=0,'premature CSS brace');}
assert.equal(depth,0,'Unclosed CSS braces');
console.log('PASS profile editor General/Freelancer/Open to Work, verified submission modal visual unification and unchanged security');
