const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"supabase/functions/crm-inngage-match-jobs/index.ts"),"utf8");
const workflow=fs.readFileSync(path.join(root,".github/workflows/inngage-match-jobs-2050.yml"),"utf8");
const html=fs.readFileSync(path.join(root,"matchvagas-test.html"),"utf8");
assert.match(src,/TEMPLATE_ID = "2050"/);
assert.match(src,/if \(action === "run" && !enabled\)/);
assert.match(src,/provider_fields_verified === true/);
assert.match(src,/receive_community_updates/);
assert.match(src,/open_to_work/);
assert.match(src,/ALREADY_ATTEMPTED_THIS_WEEK/);
assert.match(src,/CUSTOM_FIELDS_/);
assert.match(src,/scoreJob\(/);
assert.match(src,/recs\.length !== 5/);
assert.match(src,/crm_newsletter_subscriptions/);
assert.match(src,/send_test" \? "matchvagas_2050_teste"/);
assert.match(workflow,/cron: "0 12 \* \* 1"/);
assert.match(workflow,/SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(workflow,/sk_test_|sb_secret_/);
assert.match(html,/EU_AUTORIZO_TESTE_2050/);
assert.match(html,/crm_is_admin/);

assert.match(src,/if \(action === "dry_run"\)/);
assert.match(src,/sent_email: false, provider_contacted: false/);
assert.match(src,/status: "blocked_previous_attempt"/);
assert.match(html,/Simular sem enviar/);
assert.match(html,/blocked_previous_attempt/);


assert.match(src,/function verifiedWorkMode\(/);
assert.match(src,/if \(desiredModes.length && \(!mode \|\| !desiredModes.includes\(mode\)\) return null/);
assert.match(src,/if \(skip.has\(job.id\) \|\| !validExternalUrl\(job.url\) \|\| !verifiedWorkMode\(job\)\)/);
assert.match(src,/result\["VAGA_" \+ n \+ "_MODALIDADE"\] = verifiedWorkMode\(job\)/);
assert.match(src,/if \(jobLevel === "part_time" \|\| jobLevel === "junior"\) return null/);
assert.match(src,/if \(managementTarget && jobLevel !== "management"\) return null/);
assert.match(src,/splitRoleAndCompany\(job\)/);
assert.match(src,/matching_method: "strict_role_and_seniority_weighted_rules_not_probability"/);
assert.match(src,/Math.min\(92, titleSignal/);

assert.match(src,/if \(action === "probe_fields"\)/);
assert.match(src,/VALIDAR_CAMPOS_SEM_EMAIL_2050/);
assert.match(src,/const campaignKey = "matchvagas_2050_probe_campos"/);
assert.match(src,/sent_email: false/);
assert.match(html,/id="probe"/);
assert.match(html,/probe_fields/);

// Paginate entire recent pool, avoid silent 1,000-row PostgREST truncation.
assert.match(src,/const maxPages = 8/);
assert.match(src,/\.range\(page \* pageSize, \(page \+ 1\) \* pageSize - 1\)/);
assert.match(src,/JOB_POOL_EXCEEDS_SAFE_LIMIT/);
// Quality of outbound recommendations is more important than always filling five cards.
assert.match(src,/if \(structured && declared && structured !== declared\) return ""/);
assert.match(src,/seenRoleCompanyLocations/);
assert.match(src,/Empresa não divulgada/);
assert.match(src,/companyPenalty/);
assert.match(src,/if \(mode !== "remoto" && desiredLocations.length/);
assert.match(src,/if \(managementTarget && jobLevel !== "management"\) return null/);


// Regression: BairesDev posted the same remote Head role for three cities.
// A different city or URL must NOT occupy an extra slot in the email.
const keyFnSource=src.match(/function opportunityKey\(job: Job\): string \{[\s\S]*?\n\}/);
assert.ok(keyFnSource,"Missing opportunityKey");
const keyJs=keyFnSource[0].replace("job: Job): string", "job)");
const canonical=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const opportunityKey=new Function("splitRoleAndCompany","verifiedWorkMode","norm",
  keyJs+"; return opportunityKey;")(
  job=>({role:job.title,company:job.company}),
  job=>job.workMode,
  canonical
);
const bairesBase={title:"Head of Customer and Solutions Marketing - Remote Work",company:"BairesDev",workMode:"remoto"};
const bairesSp={...bairesBase,url:"https://br.linkedin.com/jobs/view/4480700321",location:"São Paulo, Brasil"};
const bairesMg={...bairesBase,url:"https://br.linkedin.com/jobs/view/4480491571",location:"Minas Gerais, Brasil"};
const bairesBr={...bairesBase,url:"https://br.linkedin.com/jobs/view/4480486759",location:"Brasil"};
assert.equal(new Set([bairesSp,bairesMg,bairesBr].map(opportunityKey)).size,1,"Remote duplicate across states");
assert.notEqual(opportunityKey(bairesSp),opportunityKey({...bairesBase,title:"Customer Success Manager - Remote Work",location:"São Paulo"}),"Different role");
assert.notEqual(opportunityKey({...bairesBase,workMode:"hibrido",location:"SP"}),opportunityKey({...bairesBase,workMode:"hibrido",location:"MG"}),"Hybrid roles in different states may differ");
assert.match(src,/seenOpportunities\.has\(signature\)/);
assert.match(src,/companyCounts\.get\(companyKey\) \|\| 0\) >= 2/);
assert.match(src,/unique_opportunities: uniqueOpportunities/);
assert.match(src,/recent_probe:/);
assert.match(html,/probeBlocked=true/);
assert.match(html,/data.recent_probe/);

console.log("Matchvagas 2050: duplicate-remote regression and provider diagnostics passed.");
