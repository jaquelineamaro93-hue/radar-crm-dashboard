import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const TEMPLATE_ID = "2050";
const CAMPAIGN = "matchvagas_2050";
const API_URL = "https://api.inngage.com.br/v1/message/";
const FIELDS_URL = "https://api.inngage.com.br/v1/subscription/addCustomField";
const HEADERS = {
  "Access-Control-Allow-Origin": "https://conexaocrm.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
type Job = {
  id: number; title: string | null; cargo: string | null;
  company: string | null; empresa: string | null;
  location: string | null; regiao: string | null;
  url: string | null; descricao_resumo: string | null;
  description: string | null; trilha: string | null;
  modalidade_normalizada: string | null; modelo: string | null;
  senioridade_normalizada: string | null; nivel: string | null;
  availability_status: string | null; found_at: string | null;
  salario: number | null; tipo_contrato: string | null;
};
type Rec = { job: Job; score: number };
const db = createClient(PROJECT_URL, SERVICE_KEY, { auth: { persistSession: false } });
function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function clean(v: unknown) {
  return String(v ?? "").trim();
}
function norm(v: unknown) {
  return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function list(v: unknown): string[] {
  return Array.isArray(v) ? v.map(x => clean(x)).filter(Boolean) : [];
}
function words(v: unknown): string[] {
  return norm(v).split(" ").filter(x => x.length > 2 && !["para", "com", "das", "dos", "the", "and", "uma", "por", "senior", "pleno", "junior"].includes(x));
}
function overlap(a: unknown, b: unknown): boolean {
  const x = words(a); const y = words(b);
  return x.length > 0 && y.length > 0 && (x.some(w => y.includes(w)) || norm(b).includes(norm(a)) && norm(a).length > 4);
}
function weekStartUtc() {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  return monday.toISOString().slice(0, 10);
}
function isRemote(value: unknown) { return norm(value).includes("remot"); }
function workMode(value: unknown) {
  const s = norm(value);
  return s.includes("remot") ? "remoto" : s.includes("hibr") ? "hibrido" : s.includes("presen") ? "presencial" : "";
}
function seniority(value: unknown) {
  const s = norm(value);
  return s.includes("estag") ? "estagio" : s.includes("junior") ? "junior" : s.includes("pleno") ? "pleno"
    : s.includes("senior") || s.includes("especialista") ? "senior"
    : /gerente|coorden|head|lider|diretor|gestor/.test(s) ? "lideranca" : "";
}
function validExternalUrl(v: unknown) {
  try {
    const url = new URL(clean(v));
    return ["https:", "http:"].includes(url.protocol) && !!url.hostname && !["localhost", "127.0.0.1"].includes(url.hostname);
  } catch { return false; }
}
function scoreJob(job: Job, pref: Record<string, unknown>, match: Record<string, unknown>, skills: string[]): number | null {
  const title = clean(job.title || job.cargo);
  const area = clean(job.trilha || "");
  const modes = list(pref.work_models || match.work_models);
  const mode = workMode(job.modalidade_normalizada || job.modelo);
  const desiredModes = modes.map(workMode).filter(Boolean);
  if (desiredModes.length && mode && !desiredModes.includes(mode)) return null;
  const desiredSeniorities = list(pref.target_seniorities);
  const jobSeniority = seniority(job.senioridade_normalizada || job.nivel || title);
  if (desiredSeniorities.length && jobSeniority && !desiredSeniorities.some(s => seniority(s) === jobSeniority)) return null;
  const desiredLocations = list(pref.preferred_locations);
  const jobLocation = clean(job.location || job.regiao);
  if (mode !== "remoto" && desiredLocations.length && jobLocation && !desiredLocations.some(l => overlap(l, jobLocation))) return null;
  const roles = list(pref.target_roles);
  const areas = [...list(pref.target_areas), clean(match.primary_area)].filter(Boolean);
  const matchesRole = roles.some(r => overlap(r, title));
  const matchesArea = areas.some(a => overlap(a, title) || overlap(a, area));
  if (!matchesRole && !matchesArea) return null;
  const haystack = norm([title, area, clean(job.descricao_resumo || job.description)].join(" "));
  const relevantSkills = skills.slice(0, 25).filter(s => s.length > 2);
  const hits = relevantSkills.filter(s => haystack.includes(norm(s))).length;
  let points = 0;
  if (matchesRole) points += 48;
  if (matchesArea) points += 30;
  if (desiredModes.length && mode && desiredModes.includes(mode)) points += 9;
  if (desiredSeniorities.length && jobSeniority && desiredSeniorities.some(s => seniority(s) === jobSeniority)) points += 7;
  if (desiredLocations.length && jobLocation && desiredLocations.some(l => overlap(l, jobLocation))) points += 6;
  if (hits) points += Math.min(16, 4 * hits);
  if (!desiredModes.length) points += 4;
  if (!desiredSeniorities.length) points += 4;
  if (!desiredLocations.length || mode === "remoto") points += 4;
  return Math.min(99, points);
}
async function authorize(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  if (SERVICE_KEY && token === SERVICE_KEY) return { mode: "service" as const, id: "" };
  const client = createClient(PROJECT_URL, ANON_KEY, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user || !user.email_confirmed_at) return null;
  const { data: allowed, error: checkError } = await client.rpc("crm_is_admin");
  if (checkError || allowed !== true) return null;
  return { mode: "admin" as const, id: user.id };
}
async function loadProfiles() {
  const { data, error } = await db.from("profiles")
    .select("id,full_name,open_to_work,receive_community_updates")
    .eq("open_to_work", true).eq("receive_community_updates", true).limit(100);
  if (error) throw Error("PROFILES_QUERY_FAILED");
  return data || [];
}
async function loadJobPool(): Promise<Job[]> {
  const cutoff = new Date(Date.now() - 45 * 86400000).toISOString();
  const { data, error } = await db.from("vagas_crm")
    .select("id,title,cargo,company,empresa,location,regiao,url,descricao_resumo,description,trilha,modalidade_normalizada,modelo,senioridade_normalizada,nivel,availability_status,found_at,salario,tipo_contrato")
    .in("availability_status", ["listed", "unverified"])
    .gte("found_at", cutoff)
    .order("found_at", { ascending: false })
    .limit(1000);
  if (error) throw Error("JOBS_QUERY_FAILED");
  return (data || []) as Job[];
}
async function prepare(userId: string, pool: Job[], min: number): Promise<Rec[]> {
  const [prefRes, matchRes, skillsRes, prevRes] = await Promise.all([
    db.from("match_preferences").select("*").eq("user_id", userId).maybeSingle(),
    db.from("match_profiles").select("primary_area,work_models").eq("user_id", userId).maybeSingle(),
    db.from("match_skills").select("skill_name").eq("user_id", userId).limit(30),
    db.from("crm_inngage_match_delivery").select("job_ids").eq("user_id", userId)
      .eq("status", "accepted").gte("created_at", new Date(Date.now() - 42 * 86400000).toISOString()),
  ]);
  if (prefRes.error || matchRes.error || skillsRes.error || prevRes.error) throw Error("MATCH_QUERY_FAILED");
  if (!prefRes.data || !matchRes.data) return [];
  const skip = new Set((prevRes.data || []).flatMap(x => (Array.isArray(x.job_ids) ? x.job_ids : [])).map(Number));
  const skills = (skillsRes.data || []).map(x => clean(x.skill_name));
  const scored: Rec[] = [];
  const seenUrls = new Set<string>();
  for (const job of pool) {
    if (skip.has(job.id) || !validExternalUrl(job.url) || !clean(job.title || job.cargo) || !clean(job.company || job.empresa)) continue;
    const key = clean(job.url).toLowerCase().split("#")[0].replace(/\/$/, "");
    if (seenUrls.has(key)) continue;
    const score = scoreJob(job, prefRes.data, matchRes.data, skills);
    if (score === null || score < min) continue;
    seenUrls.add(key);
    scored.push({ job, score });
  }
  scored.sort((a, b) => b.score - a.score ||
    String(b.job.found_at || "").localeCompare(String(a.job.found_at || "")));
  return scored.slice(0, 5);
}
function fields(profile: { full_name?: string | null }, recs: Rec[]) {
  const result: Record<string, string> = {
    NOME: clean(profile.full_name).split(/\s+/)[0] || "profissional",
  };
  for (let i = 0; i < 5; i++) {
    const { job, score } = recs[i];
    const n = i + 1;
    result["VAGA_" + n + "_CARGO"] = clean(job.title || job.cargo).slice(0, 150);
    result["VAGA_" + n + "_EMPRESA"] = clean(job.company || job.empresa).slice(0, 120);
    result["VAGA_" + n + "_MODALIDADE"] = clean(job.modalidade_normalizada || job.modelo) || "A confirmar";
    result["VAGA_" + n + "_LOCAL"] = clean(job.location || job.regiao) || "Local a confirmar";
    result["VAGA_" + n + "_MATCH"] = score + "%";
    result["VAGA_" + n + "_URL"] = clean(job.url);
  }
  return result;
}
async function eligibleEmail(userId: string): Promise<string | null> {
  const { data: found, error } = await db.auth.admin.getUserById(userId);
  if (error || !found.user?.email || !found.user.email_confirmed_at) return null;
  const email = found.user.email.trim().toLowerCase();
  const { data: unsub, error: optError } = await db.from("crm_newsletter_subscriptions")
    .select("status").or("user_id.eq." + userId + ",email.eq." + email).limit(20);
  if (optError) throw Error("OPT_OUT_QUERY_FAILED");
  if ((unsub || []).some(x => x.status !== "subscribed")) return null;
  return email;
}
async function send(userId: string, profile: { full_name?: string | null }, recs: Rec[], week: string) {
  const email = await eligibleEmail(userId);
  if (!email || recs.length !== 5) return { state: "skipped", code: "NOT_ELIGIBLE" };
  const { error: reserveError } = await db.from("crm_inngage_match_delivery").insert({
    user_id: userId, campaign_key: CAMPAIGN, week_key: week,
    job_ids: recs.map(x => x.job.id), scores: recs.map(x => x.score), status: "reserved",
  });
  if (reserveError?.code === "23505") return { state: "skipped", code: "ALREADY_ATTEMPTED_THIS_WEEK" };
  if (reserveError) throw Error("RESERVATION_FAILED");
  const appToken = Deno.env.get("INNGAGE_APP_TOKEN") || "";
  const bearer = (Deno.env.get("INNGAGE_API_BEARER") || "").replace(/^Bearer\s+/i, "");
  let status = "unknown"; let providerStatus: number | null = null; let failure = "TRANSPORT_ERROR";
  try {
    const cf = {
      addCustomFieldRequest: {
        app_token: appToken,
        identifier: email,
        email: email,
        custom_field: fields(profile, recs),
      },
    };
    const cfResponse = await fetch(FIELDS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + bearer },
      body: JSON.stringify(cf), signal: AbortSignal.timeout(12000),
    });
    providerStatus = cfResponse.status;
    if (!cfResponse.ok) {
      status = "rejected"; failure = "CUSTOM_FIELDS_" + cfResponse.status;
    } else {
      // Only after confirmed field update can a template be sent.
      const payload = { sendPushRequest: {
        app_token: appToken, api_template_id: TEMPLATE_ID,
        tags: { "": [] }, identifier: email, subscriber_email: email,
      }};
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + bearer },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
      });
      providerStatus = response.status;
      status = response.ok ? "accepted" : "rejected";
      failure = response.ok ? "" : "MESSAGE_" + response.status;
    }
  } catch (error) {
    status = "unknown";
    failure = error instanceof Error ? error.name.slice(0, 40) : "UNKNOWN";
  }
  const { error: updateError } = await db.from("crm_inngage_match_delivery").update({
    status, provider_status: providerStatus, provider_error_code: failure || null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("campaign_key", CAMPAIGN).eq("week_key", week);
  if (updateError) console.error("[inngage-match] UPDATE_LOG_FAILED", updateError.code);
  return { state: status, code: failure || "SUBMITTED", provider_http: providerStatus };
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (req.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const caller = await authorize(req);
    if (!caller) return reply({ error: "FORBIDDEN" }, 403);
    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "preview";
    const { data: cfg, error: cfgError } = await db.from("crm_inngage_match_config").select("*").eq("id", 1).single();
    if (cfgError || !cfg) return reply({ error: "CONFIG_NOT_FOUND" }, 503);
    const enabled = cfg.enabled === true && cfg.provider_fields_verified === true;
    if (action === "diagnostics") return reply({
      ok: true, template_id: TEMPLATE_ID, configured: {
        app_token: !!Deno.env.get("INNGAGE_APP_TOKEN"),
        api_bearer: !!Deno.env.get("INNGAGE_API_BEARER"),
      }, dispatch_enabled: enabled, provider_fields_verified: cfg.provider_fields_verified === true,
    });
    const profiles = await loadProfiles();
    const jobs = await loadJobPool();
    const min = cfg.minimum_match_score || 65;
    const week = weekStartUtc();
    if (action === "preview") {
      const stats = { marketing_optin_open_to_work: profiles.length, considered_jobs: jobs.length,
        ready_with_5_matches: 0, without_5_matches: 0, sent_this_week: 0,
        template_id: TEMPLATE_ID, dispatch_enabled: enabled };
      const { data: attempted } = await db.from("crm_inngage_match_delivery").select("user_id")
        .eq("campaign_key", CAMPAIGN).eq("week_key", week);
      stats.sent_this_week = (attempted || []).length;
      for (const profile of profiles.slice(0, 50)) {
        const recs = await prepare(profile.id, jobs, min);
        if (recs.length === 5) stats.ready_with_5_matches++;
        else stats.without_5_matches++;
      }
      return reply({ ok: true, ...stats });
    }
    if (action !== "run" && action !== "send_test") return reply({ error: "ACTION_NOT_ALLOWED" }, 400);
    if (action === "run" && caller.mode !== "service") return reply({ error: "SERVICE_ONLY" }, 403);
    if (action === "send_test" && (caller.mode !== "admin" || body.confirm !== "EU_AUTORIZO_TESTE_2050"))
      return reply({ error: "ADMIN_CONFIRMATION_REQUIRED" }, 403);
    if (action === "run" && !enabled) return reply({ ok: true, status: "paused", reason: "PROVIDER_NOT_VALIDATED" });
    if (!Deno.env.get("INNGAGE_APP_TOKEN") || !Deno.env.get("INNGAGE_API_BEARER"))
      return reply({ error: "INNGAGE_SECRETS_MISSING" }, 503);
    const toProcess = action === "send_test" ? profiles.filter(p => p.id === caller.id)
      : profiles.slice(0, cfg.max_recipients_per_run || 10);
    let accepted = 0; let rejected = 0; let unknown = 0; let skipped = 0;
    const results: unknown[] = [];
    for (const profile of toProcess) {
      const matches = await prepare(profile.id, jobs, min);
      if (matches.length !== 5) { skipped++; continue; }
      const result = await send(profile.id, profile, matches, week);
      results.push(result);
      if (result.state === "accepted") accepted++;
      else if (result.state === "rejected") rejected++;
      else if (result.state === "unknown") unknown++;
      else skipped++;
      if (rejected || unknown) break; // Fail closed on any provider issue.
    }
    return reply({ ok: rejected + unknown === 0, template_id: TEMPLATE_ID, processed: toProcess.length,
      accepted, rejected, unknown, skipped, results }, rejected + unknown ? 502 : 200);
  } catch (error) {
    console.error("[inngage-match] INTERNAL_ERROR", error instanceof Error ? error.message : "unknown");
    return reply({ error: "INTERNAL_ERROR" }, 500);
  }
});