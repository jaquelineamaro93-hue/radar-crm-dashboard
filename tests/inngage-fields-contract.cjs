const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync('supabase/functions/crm-inngage-match-jobs/index.ts', 'utf8');
const html = fs.readFileSync('matchvagas-test.html', 'utf8');
const attributes = { NOME: 'Teste', VAGA_1_CARGO: 'CRM' };
const send = src.match(/const cf = (\{[\s\S]*?\n    \});/)[1];
const probe = src.match(/body: JSON.stringify\((\{ fieldsRequest:[\s\S]*?\}\})\)/)[1];
for (const expression of [send, probe]) {
 const payload = JSON.parse(JSON.stringify(vm.runInNewContext('(' + expression + ')', { appToken: 'test', email: 'test@example.com', attributes, fields: () => attributes, profile: {}, recs: [] })));
 assert.deepEqual(Object.keys(payload), ['fieldsRequest']);
 assert.equal(payload.fieldsRequest.identifier, 'test@example.com');
 assert.deepEqual(payload.fieldsRequest.custom_field, attributes);
}
const callSource = html.slice(html.indexOf('async function call('), html.indexOf('async function run('));
async function errorFor(detail) {
 const context = { sb: { functions: { invoke: async () => ({ error: { context: { text: async () => JSON.stringify(detail) } } }) } } };
 vm.runInNewContext(callSource, context);
 try { await context.call('probe_fields'); assert.fail('Must reject'); } catch (e) { return e.message; }
}
(async () => {
 assert.match(await errorFor({provider_error_code:'CUSTOM_FIELDS_400',provider_http_status:400}), /CUSTOM_FIELDS_400 \| HTTP 400/);
 assert.match(await errorFor({status:'already_checked_today',message:'Limite diário'}), /already_checked_today \| Limite diário/);
 assert.match(await errorFor({error:'FORBIDDEN'}), /^FORBIDDEN$/);
 console.log('Inngage payload and HTTP error regression tests passed');
})();
