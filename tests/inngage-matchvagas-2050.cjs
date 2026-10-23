const assert=require('node:assert/strict');const fs=require('node:fs');
const src=fs.readFileSync('supabase/functions/crm-inngage-match-jobs/index.ts','utf8');
for(const guard of ['caller.mode !== "service"','if (action === "run" && !enabled)','ADMIN_CONFIRMATION_REQUIRED','ACCEPTED_TEST_REQUIRED','ALREADY_ATTEMPTED_THIS_WEEK','crm_newsletter_subscriptions','LEGACY_CSV_FLOW_RETIRED'])assert(src.includes(guard),guard);
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


require('./inngage-dynamic-cards.cjs');require('./inngage-delivery-v2.cjs');
