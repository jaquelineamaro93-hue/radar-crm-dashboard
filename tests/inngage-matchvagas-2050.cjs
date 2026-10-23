const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"supabase/functions/crm-inngage-match-jobs/index.ts"),"utf8");
const workflow=fs.readFileSync(path.join(root,".github/workflows/inngage-match-jobs-2050.yml"),"utf8");
const html=fs.readFileSync(path.join(root,"matchvagas-test.html"),"utf8");

for (const check of [
  'TEMPLATE_ID = "2050"',
  'provider_fields_verified === true',
  'if (action === "run" && !enabled)',
  '.eq("receive_community_updates", true)',
  '.eq("open_to_work", true)',
  'ALREADY_ATTEMPTED_THIS_WEEK',
  'matchvagas_2050_teste',
  'CUSTOM_FIELDS_',
  'if (action === "dry_run")',
  'if (action === "probe_fields")',
  'VALIDAR_CAMPOS_SEM_EMAIL_2050',
  'matchvagas_2050_probe_campos',
  'function scoreJob(',
  'function verifiedWorkMode(',
  'function opportunityKey(',
  'seenOpportunities.has(signature)',
  'unique_opportunities: uniqueOpportunities',
  'recs.length !== 5',
  'crm_newsletter_subscriptions',
  'seenUrls.has(link)',
  'companyCounts.get(companyKey)',
  'if (selected.length === 5) break',
  'const maxPages = 8',
  '.range(page * pageSize, (page + 1) * pageSize - 1)',
  'JOB_POOL_EXCEEDS_SAFE_LIMIT',
  'Empresa não divulgada',
  'managementTarget && jobLevel !== "management"',
  'fieldsRequest:',
  'recent_probe:',
]) {
  assert.ok(src.includes(check),"Missing production guard "+check);
}
for(const check of ["probeBlocked=true","data.recent_probe",'id="probe"','id="send"',"detail.provider_error_code","EU_AUTORIZO_TESTE_2050"]) {
  assert.ok(html.includes(check),"Missing admin UI guard "+check);
}
assert.ok(workflow.includes('0 12 * * 1'),"Weekly cron missing");
assert.ok(workflow.includes("SUPABASE_SERVICE_ROLE_KEY"),"Server-only workflow auth missing");

// Extract and execute the real pure helper, rather than repeating its implementation.
const keyFnSource=src.match(/function opportunityKey\(job: Job\): string \{[\s\S]*?\n\}/);
assert.ok(keyFnSource,"opportunityKey helper missing");
const executable=keyFnSource[0].replace("job: Job): string","job)");
const canonical=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const opportunityKey=new Function("splitRoleAndCompany","verifiedWorkMode","norm",executable+";return opportunityKey;")(
  job=>({role:job.title,company:job.company}),job=>job.workMode,canonical
);
const shared={title:"Head of Customer and Solutions Marketing - Remote Work",company:"BairesDev",workMode:"remoto"};
const locations=["São Paulo, Brasil","Minas Gerais, Brasil","Brasil"];
const remoteListings=locations.map((location,i)=>({...shared,location,url:"https://br.linkedin.com/jobs/view/"+i}));
assert.equal(new Set(remoteListings.map(opportunityKey)).size,1,"Remote posts by same employer and role must collapse");
assert.notEqual(opportunityKey(remoteListings[0]),opportunityKey({...shared,title:"CRM Manager - Remote Work",location:"Brasil"}),"Distinct roles remain");
assert.notEqual(opportunityKey({...shared,workMode:"hibrido",location:"São Paulo"}),opportunityKey({...shared,workMode:"hibrido",location:"Minas Gerais"}),"Hybrid locations may differ");

// Emergency manual QA runs independently of the old weekly failed test.
// No bulk path is enabled, requires explicit CSV import confirmation.
for(const token of [
 'if (action === "manual_csv" || action === "manual_template_test")',
 'body.confirm !== "IMPORTEI_E_VALIDEI_31_CAMPOS_2050"',
 'body.fingerprint !== fingerprint',
 'matchvagas_2050_csv_manual_test',
 'recipients: 1',
 'recipient_count: 1',
 'function validFiveCards(',
 'const matches = await prepare(caller.id, jobs, min)',
 'if (!validFiveCards(matches))',
 'fields_count: names.length',
 'sent_email: false, provider_contacted: false'
]) assert.ok(src.includes(token),"Missing protected manual action: "+token);
for(const token of [
 'id="manualCsv"','id="manualSend"',
 'confirmManualImport', 'manualFingerprint',
 'matchvagas-2050-importacao-manual.csv',
 'manual_template_test', 'manual_csv',
 'IMPORTEI_E_VALIDEI_31_CAMPOS_2050'
]) assert.ok(html.includes(token),"Missing protected manual UI: "+token);
assert.ok(src.indexOf('if (action === "manual_csv"') < src.indexOf('if (action === "probe_fields"'),"manual path isn't independent of field probe");


// Rejecting a message must capture only classified reason and harmless response keys,
// while all limits and manual consent remain unchanged.
for (const token of [
  "function safeProviderDiagnostic(",
  "MESSAGE_REJECTED",
  "MANUAL_MESSAGE_REJECTED",
  "recent_manual_test:",
  "response_keys: providerMeta.response_keys",
  '"MESSAGE_" + response.status + "_"',
]) assert.ok(src.includes(token),"Missing provider diagnostics: "+token);
for (const token of ["data.recent_manual_test","manualTestBlocked=true","manualTestBlocked||!manualCsvReady","Engajamento &gt; Envio em Massa"]) {
 assert.ok(html.includes(token),"Missing same-day safety in UI: "+token);
}

console.log("Inngage 2050: manual send HTTP 400 visibility, idempotency and privacy guards passed.");
