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
assert.match(src,/return Math.min\(92, titleSignal/);

console.log("Matchvagas 2050: matching rules and production safety checks passed.");
