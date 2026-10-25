'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

test('Public LP survey is shipped with the new Figma design in initial HTML',()=>{
 assert.equal((html.match(/id="crmSurveyReminder"/g)||[]).length,1);
 assert.match(html,/<aside id="crmSurveyReminder" class="crm-survey-modern"/);
 assert.match(html,/id="crm-landing-notices-figma-20261025"/);
 const css=html.slice(html.indexOf('<style id="crm-landing-notices-figma-20261025">'),html.indexOf('</style>',html.indexOf('<style id="crm-landing-notices-figma-20261025">')));
 assert.match(css,/#crmSurveyReminder\.crm-survey-modern\s*\{/);
 assert.match(css,/\.crm-survey-primary\s*\{/);
 assert.match(css,/background:#7f40b1!important/);
 assert.match(css,/border-top:2px solid #9f6ac6!important/);
 assert.doesNotMatch(css,/#ff8a34|#ff9b54|#f97316/);
});
test('Dismissal, answered action and survey link remain functional',()=>{
 assert.match(html,/onclick="crmSurveyOpen\(\)"/);
 assert.match(html,/onclick="crmSurveyDismiss\('visit'\)"/);
 assert.match(html,/onclick="crmSurveyDismiss\('answered'\)"/);
 assert.match(html,/id="crmSurveyReminderTitle"/);
});
test('Newsletter uses the same design without changing subscription logic',()=>{
 assert.match(html,/#crmNewsletterPrompt\s*\{/);
 assert.match(html,/#crmNewsletterPrompt \[data-nl-yes\]\s*\{/);
 assert.match(html,/async function newsletterPrompt\(\)/);
 assert.match(html,/crm_newsletter_subscriptions/);
});
test('Accessible responsive layout and unrelated account modes remain intact',()=>{
 assert.match(html,/@media\(max-width:640px\)[\s\S]*#crmSurveyReminder\.crm-survey-modern/);
 assert.match(html,/#crmSurveyReminder\.crm-survey-modern :is\(a,button\):focus-visible/);
 assert.match(html,/id="crmPortalRole"/);
 assert.match(html,/id="membroVagasSalvas"/);
 assert.match(html,/id="membroVagasMatch"/);
});
