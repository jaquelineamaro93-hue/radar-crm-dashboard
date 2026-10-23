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
function splitRoleAndCompany(job: Job): { role: string; company: string } {
  const raw = clean(job.title || job.cargo);
  const explicitCompany = clean(job.company || job.empresa);
  const absent = !explicitCompany || ["nao informado", "n a", "undefined", "null", "desconhecida", "nao definida"].includes(norm(explicitCompany));
  const match = raw.match(/^(.*?)\s+at\s+([^|]+)$/i);
  const fromTitle = match ? clean(match[2]) : "";
  return { role: (match ? clean(match[1]) : raw).slice(0, 150),
    company: ((absent ? fromTitle : explicitCompany) || "Empresa não divulgada").slice(0, 120) };
}
const ROLE_TERMS: Record<string, RegExp> = {
  crm: /\bcrm\b|customer relationship|marketing de relacionamento/i,
  cx: /\bcx\b|customer experience|experiencia do cliente/i,
  cs: /\bcs\b|customer success|sucesso do cliente/i,
  growth: /\bgrowth\b|demand generation|go to market|\bgtm\b|geracao de demanda/i,
  lifecycle: /lifecycle|life cycle|retention|retencao|customer engagement|ciclo de vida/i,
  insights: /customer insights|consumer insights|inteligencia de clientes/i,
  automation: /marketing automation|marketing operations|marketing ops|\bmartech\b|automacao de marketing/i,
  revops: /\brevops\b|revenue operations|operacoes de receita/i,
};
function requestedTracks(roles: string[], area: string): string[] {
  const source = roles.join(" ") + " " + area;
  const tracks: string[] = [];
  for (const [name, regex] of Object.entries(ROLE_TERMS)) {
    if (regex.test(norm(source))) tracks.push(name);
  }
  return tracks;
}
function titleLevel(role: string) {
  const n = norm(role);
  if (/\b(intern|internship|estagio|estagiario|trainee|aprendiz|assistente|junior|jr)\b/.test(n)) return "junior";
  if (/\b(part time|part time contract|meio periodo|meia jornada)\b/.test(n)) return "part_time";
  if (/\b(director|diretor|vice president|president|chief|cmo|cxo)\b/.test(n)) return "executive";
  if (/\b(manager|gerente|coordenador|coordenadora|coordinator|coordination|lead|lider|lideranca|gestor|gestora|head|supervisor)\b/.test(n)) return "management";
  if (/\b(senior|sr|specialist|especialista|principal|staff)\b/.test(n)) return "senior";
  return "unspecified";
}
function brazilEligible(job: Job) {
  const location = norm(job.location || job.regiao);
  const description = norm(job.descricao_resumo || job.description);
  const title = norm(job.title || job.cargo);
  // A job that explicitly restricts geography in its title is not a Brazil match,
  // even if the aggregator incorrectly classified the location as "Remoto".
  if (/\b(remote|remoto|full remote)\b.{0,25}\b(france|cyprus|greece|poland|germany|spain|portugal|netherlands|malta|turkey|uk|usa|us|canada|united states)\b/.test(title)) return false;
  if (/\b(usa only|us only|united states only|canada only|uk only|europe only|emea only|united states|north america only)\b/.test(location)) return false;
  // International aggregation sites frequently label positions only "remote" even
  // when candidates in Brazil are not eligible; do not assert geographic fit.
  if (/startup\.jobs/i.test(clean(job.url))) {
    const locationBrazil = /\b(brasil|brazil|latam|latin america|sao paulo|rio de janeiro)\b/.test(location);
    const explicitlyWorldwide = /\b(worldwide|anywhere in the world|globally remote)\b/.test(location);
    const descriptionBrazil = /\b(remote from brazil|based in brazil|candidates in brazil|brazil or latam|work from brazil)\b/.test(description);
    if (!locationBrazil && !explicitlyWorldwide && !descriptionBrazil) return false;
  }
  return true;
}
function verifiedWorkMode(job: Job): string {
  const structured = workMode(job.modalidade_normalizada || job.modelo);
  const title = norm(job.title || job.cargo);
  let declared = "";
  if (/\b(remote|remoto|100 remoto|home office|work from home)\b/.test(title)) declared = "remoto";
  else if (/\b(hybrid|hibrido|hibrida)\b/.test(title)) declared = "hibrido";
  else if (/\b(on site|onsite|presencial)\b/.test(title)) declared = "presencial";
  // Title and normalized columns disagree, so don't claim a work arrangement.
  if (structured && declared && structured !== declared) return "";
  return structured || declared;
}
function scoreJob(job: Job, pref: Record<string, unknown>, match: Record<string, unknown>, skills: string[]): number | null {
  const { role, company } = splitRoleAndCompany(job);
  if (!role || !company || !validExternalUrl(job.url) || !brazilEligible(job)) return null;
  const jobLevel = titleLevel(role);
  const desiredSeniority = list(pref.target_seniorities).join(" ") ||
    clean(match.seniority) || clean(match.professional_headline);
  const managementTarget = /\b(gestao|gerencia|gerente|coordenacao|coordenadora|coordenador|lideranca|lead|manager|head)\b/.test(norm(desiredSeniority));
  if (jobLevel === "part_time" || jobLevel === "junior") return null;
  if (managementTarget && jobLevel !== "management") return null;
  if (managementTarget && /\b(director|diretor|vp|chief)\b/.test(norm(role))) return null;
  const mode = verifiedWorkMode(job);
  const desiredModes = list(pref.work_models || match.work_models).map(workMode).filter(Boolean);
  if (desiredModes.length && (!mode || !desiredModes.includes(mode))) return null;
  const workRegion = clean(job.location || job.regiao);
  const desiredLocations = list(pref.preferred_locations);
  if (mode !== "remoto" && desiredLocations.length &&
      (!workRegion || !desiredLocations.some(l => overlap(l, workRegion)))) return null;
  const desired = requestedTracks(list(pref.target_roles), clean(match.primary_area));
  if (!desired.length) return null;
  const titleNorm = norm(role);
  const matchingTracks = desired.filter(track => ROLE_TERMS[track].test(titleNorm));
  if (!matchingTracks.length) return null;
  const titleSignal = matchingTracks.some(t => ["crm", "cx", "cs", "revops", "lifecycle"].includes(t)) ? 48 : 43;
  const levelScore = jobLevel === "management" ? 18 : jobLevel === "senior" ? 10 : 3;
  const modeScore = desiredModes.length && mode && desiredModes.includes(mode) ? 12 : 2;
  const regionScore = mode === "remoto" ? 4 :
    desiredLocations.length && workRegion && desiredLocations.some(l => overlap(l, workRegion)) ? 9 : 2;
  const haystack = norm([role, clean(job.trilha), clean(job.descricao_resumo || job.description)].join(" "));
  const hits = skills.slice(0, 25).filter(x => norm(x).length > 2 && haystack.includes(norm(x))).length;
  const skillScore = Math.min(10, hits * 2);
  const companyPenalty = company === "Empresa não divulgada" ? 9 : 0;
  // A bounded rules-based ranking; not a statistically calibrated probability.
  return Math.max(0, Math.min(92, titleSignal + levelScore + modeScore + regionScore + skillScore - companyPenalty));
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
  // PostgREST caps single responses at 1,000 rows. Scan every recent page
  // rather than silently excluding thousands of roles from the user's digest.
  const cutoff = new Date(Date.now() - 45 * 86400000).toISOString();
  const pageSize = 1000;
  const maxPages = 8;
  const pool: Job[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await db.from("vagas_crm")
      .select("id,title,cargo,company,empresa,location,regiao,url,descricao_resumo,description,trilha,modalidade_normalizada,modelo,senioridade_normalizada,nivel,availability_status,found_at,salario,tipo_contrato")
      .in("availability_status", ["listed", "unverified"])
      .gte("found_at", cutoff)
      .order("found_at", { ascending: false })
      .order("id", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw Error("JOBS_QUERY_FAILED");
    const chunk = (data || []) as Job[];
    pool.push(...chunk);
    if (chunk.length < pageSize) return pool;
  }
  // Fail closed if the cap is reached; an incomplete pool biases matching.
  throw Error("JOB_POOL_EXCEEDS_SAFE_LIMIT");
}
function opportunityKey(job: Job): string {
  const { role, company } = splitRoleAndCompany(job);
  const mode = verifiedWorkMode(job);
  const baseRole = norm(role).replace(/\bref\s*\d+\b/g, "").trim();
  // Remote posts replicated for several cities are one recommendation.
  const geographicSuffix = mode === "remoto" ? "" : norm(job.location || job.regiao);
  return [norm(company), baseRole, mode, geographicSuffix].join("|");
}
async function prepare(userId: string, pool: Job[], min: number): Promise<Rec[]> {
  const [prefRes, matchRes, skillsRes, prevRes] = await Promise.all([
    db.from("match_preferences").select("*").eq("user_id", userId).maybeSingle(),
    db.from("match_profiles").select("primary_area,work_models,seniority,professional_headline").eq("user_id", userId).maybeSingle(),
    db.from("match_skills").select("skill_name").eq("user_id", userId).limit(30),
    db.from("crm_inngage_match_delivery").select("job_ids").eq("user_id", userId)
      .eq("status", "accepted").gte("created_at", new Date(Date.now() - 42 * 86400000).toISOString()),
  ]);
  if (prefRes.error || matchRes.error || skillsRes.error || prevRes.error) throw Error("MATCH_QUERY_FAILED");
  if (!prefRes.data || !matchRes.data) return [];
  const skip = new Set((prevRes.data || []).flatMap(x => (Array.isArray(x.job_ids) ? x.job_ids : [])).map(Number));
  const skills = (skillsRes.data || []).map(x => clean(x.skill_name));
  const scored: Rec[] = [];
  for (const job of pool) {
    if (skip.has(job.id) || !validExternalUrl(job.url) || !verifiedWorkMode(job)) continue;
    const score = scoreJob(job, prefRes.data, matchRes.data, skills);
    if (score === null || score < min) continue;
    scored.push({ job, score });
  }
  scored.sort((a, b) => b.score - a.score ||
    String(b.job.found_at || "").localeCompare(String(a.job.found_at || "")));
  // Select only after ranking, so the strongest available listing wins.
  // A remote role repeated for different cities is still one opportunity.
  const selected: Rec[] = [];
  const seenUrls = new Set<string>();
  const seenOpportunities = new Set<string>();
  const companyCounts = new Map<string, number>();
  for (const item of scored) {
    const link = clean(item.job.url).toLowerCase().split("#")[0].replace(/\/$/, "");
    const { company } = splitRoleAndCompany(item.job);
    const companyKey = norm(company);
    const signature = opportunityKey(item.job);
    if (seenUrls.has(link) || seenOpportunities.has(signature)) continue;
    // A digest of five slots should not be dominated by one employer.
    if (companyKey !== "empresa nao divulgada" && (companyCounts.get(companyKey) || 0) >= 2) continue;
    selected.push(item);
    seenUrls.add(link);
    seenOpportunities.add(signature);
    companyCounts.set(companyKey, (companyCounts.get(companyKey) || 0) + 1);
    if (selected.length === 5) break;
  }
  return selected;
}
function fields(profile: { full_name?: string | null }, recs: Rec[]) {
  const result: Record<string, string> = {
    NOME: clean(profile.full_name).split(/\s+/)[0] || "profissional",
  };
  for (let i = 0; i < 5; i++) {
    const { job, score } = recs[i];
    const n = i + 1;
    const parsed = splitRoleAndCompany(job);
    result["VAGA_" + n + "_CARGO"] = parsed.role;
    result["VAGA_" + n + "_EMPRESA"] = parsed.company;
    result["VAGA_" + n + "_MODALIDADE"] = verifiedWorkMode(job) === "remoto" ? "Remoto" : verifiedWorkMode(job) === "hibrido" ? "Híbrido" : "Presencial";
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
  const [byUser, byEmail] = await Promise.all([
    db.from("crm_newsletter_subscriptions").select("status").eq("user_id", userId).limit(20),
    db.from("crm_newsletter_subscriptions").select("status").eq("email", email).limit(20),
  ]);
  if (byUser.error || byEmail.error) throw Error("OPT_OUT_QUERY_FAILED");
  if ([...(byUser.data || []), ...(byEmail.data || [])].some(x => x.status !== "subscribed")) return null;
  return email;
}
function toCsvField(value: unknown): string {
  let raw = clean(value);
  // Prevent spreadsheet formula execution when opened in Excel/Google Sheets.
  if (/^[=+\-@\t\r]/.test(raw)) raw = "'" + raw;
  return '"' + raw.replace(/"/g, '""') + '"';
}
async function manualDigest(userId: string, data: Record<string, string>): Promise<string> {
  const canonical = JSON.stringify({ userId, attributes: data });
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, "0")).join("");
}
function validFiveCards(recs: Rec[]): boolean {
  return recs.length === 5 &&
    new Set(recs.map(x => opportunityKey(x.job))).size === 5 &&
    new Set(recs.map(x => clean(x.job.url).toLowerCase())).size === 5 &&
    recs.every(x => x.score >= 65 && validExternalUrl(x.job.url));
}
async function send(userId: string, profile: { full_name?: string | null }, recs: Rec[], week: string, campaignKey: string = CAMPAIGN) {
  const email = await eligibleEmail(userId);
  if (!email || recs.length !== 5) return { state: "skipped", code: "NOT_ELIGIBLE" };
  const { error: reserveError } = await db.from("crm_inngage_match_delivery").insert({
    user_id: userId, campaign_key: campaignKey, week_key: week,
    job_ids: recs.map(x => x.job.id), scores: recs.map(x => x.score), status: "reserved",
  });
  if (reserveError?.code === "23505") return { state: "skipped", code: "ALREADY_ATTEMPTED_THIS_WEEK" };
  if (reserveError) throw Error("RESERVATION_FAILED");
  const appToken = Deno.env.get("INNGAGE_APP_TOKEN") || "";
  const bearer = (Deno.env.get("INNGAGE_API_BEARER") || "").replace(/^Bearer\s+/i, "");
  let status = "unknown"; let providerStatus: number | null = null; let failure = "TRANSPORT_ERROR";
  try {
    const cf = {
      fieldsRequest: {
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
      // Do not log the full provider body: it could contain user data or secrets.
      const responseText = (await cfResponse.text()).slice(0, 3000);
      let parsed: Record<string, unknown> | null = null;
      try {
        const data = JSON.parse(responseText);
        if (data && typeof data === "object" && !Array.isArray(data)) parsed = data;
      } catch { /* Body might be HTML or empty. */ }
      const providerCode = [parsed?.code, parsed?.errorCode, parsed?.statusCode]
        .find(value => typeof value === "number" || (typeof value === "string" && /^[A-Z][A-Z0-9_-]{1,35}$/.test(value))) ?? null;
      console.error("[inngage-match] CUSTOM_FIELDS_REJECTED", JSON.stringify({
        provider_http: cfResponse.status,
        response_keys: parsed ? Object.keys(parsed).slice(0, 10) : [],
        provider_code: providerCode,
        body_is_json: parsed !== null,
      }));
      status = "rejected";
      failure = "CUSTOM_FIELDS_" + cfResponse.status + (providerCode ? "_" + providerCode : "");
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
  }).eq("user_id", userId).eq("campaign_key", campaignKey).eq("week_key", week);
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
    if (action === "diagnostics") {
      const { data: latest, error: historyError } = await db.from("crm_inngage_match_delivery")
        .select("campaign_key,week_key,status,provider_status,provider_error_code,created_at,updated_at")
        .eq("user_id", caller.id)
        .eq("campaign_key", "matchvagas_2050_teste")
        .order("created_at", { ascending: false }).limit(1);
      const { data: probe, error: probeError } = await db.from("crm_inngage_match_delivery")
        .select("campaign_key,week_key,status,provider_status,provider_error_code,created_at,updated_at")
        .eq("user_id", caller.id).eq("campaign_key", "matchvagas_2050_probe_campos")
        .order("created_at", { ascending: false }).limit(1);
      return reply({
        ok: true, template_id: TEMPLATE_ID, configured: {
          app_token: !!Deno.env.get("INNGAGE_APP_TOKEN"),
          api_bearer: !!Deno.env.get("INNGAGE_API_BEARER"),
        },
        dispatch_enabled: enabled,
        provider_fields_verified: cfg.provider_fields_verified === true,
        recent_test: historyError ? { error: "HISTORY_UNAVAILABLE" } : latest?.[0] ?? null,
        recent_probe: probeError ? { error: "HISTORY_UNAVAILABLE" } : probe?.[0] ?? null,
        advisory: "Consulte recent_probe para a última validação dos campos e recent_test para o teste de e-mail. O formato fieldsRequest foi corrigido; a aceitação pela Inngage ainda requer homologação. Os limites de tentativas permanecem ativos.",
      });
    }
    // Admin-only launch control. Never enable without accepted self-test and
    // explicit confirmation that the five rendered cards and unsubscribe work.
    if (action === "pause" || action === "activate") {
      if (caller.mode !== "admin") return reply({ error: "ADMIN_ONLY" }, 403);
      if (action === "pause") {
        const { error } = await db.from("crm_inngage_match_config").update({
          enabled: false, updated_at: new Date().toISOString(),
        }).eq("id", 1);
        if (error) throw Error("PAUSE_FAILED");
        return reply({ ok: true, dispatch_enabled: false });
      }
      if (body.confirm !== "RECEBI_E_CONFIRMEI_OS_5_CARDS_2050") {
        return reply({ error: "VISUAL_CONFIRMATION_REQUIRED" }, 403);
      }
      const { data: past, error: histError } = await db.from("crm_inngage_match_delivery")
        .select("provider_status,status,created_at")
        .eq("user_id", caller.id)
        .eq("campaign_key", "matchvagas_2050_teste")
        .eq("status", "accepted")
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
        .order("created_at", { ascending: false }).limit(1);
      if (histError || !past || !past.length) return reply({ error: "ACCEPTED_TEST_REQUIRED" }, 403);
      if (!Deno.env.get("INNGAGE_APP_TOKEN") || !Deno.env.get("INNGAGE_API_BEARER")) {
        return reply({ error: "INNGAGE_SECRETS_MISSING" }, 503);
      }
      const { error: enableError } = await db.from("crm_inngage_match_config").update({
        provider_fields_verified: true, enabled: true, updated_at: new Date().toISOString(),
      }).eq("id", 1);
      if (enableError) throw Error("ENABLE_FAILED");
      return reply({ ok: true, dispatch_enabled: true, template_id: TEMPLATE_ID });
    }
    const profiles = await loadProfiles();
    const jobs = await loadJobPool();
    const min = cfg.minimum_match_score || 65;
    const week = weekStartUtc();
    if (action === "manual_csv" || action === "manual_template_test") {
      // Manual, one-recipient contingency path. This does NOT call addCustomField;
      // profile data must have been imported through Inngage before triggering 2050.
      if (caller.mode !== "admin") return reply({ error: "ADMIN_ONLY" }, 403);
      const profile = profiles.find(p => p.id === caller.id);
      const email = await eligibleEmail(caller.id);
      if (!profile || !email) return reply({ error: "NOT_ELIGIBLE_FOR_MANUAL_SEND" }, 403);
      const matches = await prepare(caller.id, jobs, min);
      if (!validFiveCards(matches)) return reply({
        ok: false, status: "not_enough_matches", cards_available: matches.length,
        jobs_analyzed: jobs.length, message: "Não há 5 oportunidades distintas verificadas. Sem CSV e sem envio.",
      }, 200);
      const attributes = fields(profile, matches);
      const names = ["NOME", ...Array.from({ length: 5 }, (_, index) => {
        const n = index + 1;
        return ["CARGO", "EMPRESA", "MODALIDADE", "LOCAL", "MATCH", "URL"]
          .map(field => "VAGA_" + n + "_" + field);
      }).flat()];
      if (names.length !== 31 || !names.every(name =>
        typeof attributes[name] === "string" && attributes[name].trim().length > 0)) {
        return reply({ error: "INVALID_MANUAL_ATTRIBUTES" }, 422);
      }
      const fingerprint = await manualDigest(caller.id, attributes);
      if (action === "manual_csv") {
        const columnNames = ["identifier", "email", ...names];
        const row = [email, email, ...names.map(name => attributes[name])];
        const csv = [columnNames.map(toCsvField).join(","),
          row.map(toCsvField).join(",")].join("\r\n") + "\r\n";
        return reply({
          ok: true, template_id: TEMPLATE_ID, file_name: "matchvagas-2050-importacao-manual.csv",
          csv, fingerprint, fields_count: names.length, cards_count: matches.length,
          recipients: 1, sent_email: false, provider_contacted: false,
          next_step: "Importe CSV em Público > Todo Público, mapeie identificador, e-mail e os 31 campos. Verifique os valores na aba Atributos do perfil antes de autorizar o teste.",
        });
      }
      if (body.confirm !== "IMPORTEI_E_VALIDEI_31_CAMPOS_2050" ||
          !body.fingerprint || body.fingerprint !== fingerprint) {
        return reply({ error: "CSV_IMPORT_CONFIRMATION_OR_FINGERPRINT_REQUIRED",
          sent_email: false }, 403);
      }
      const day = new Date().toISOString().slice(0, 10);
      const key = "matchvagas_2050_csv_manual_test";
      const { error: reserveError } = await db.from("crm_inngage_match_delivery").insert({
        user_id: caller.id, campaign_key: key, week_key: day,
        job_ids: matches.map(x => x.job.id), scores: matches.map(x => x.score), status: "reserved",
      });
      if (reserveError?.code === "23505") return reply({
        ok: false, status: "already_attempted_today", sent_email: false,
        message: "Teste manual já solicitado hoje. Verifique os logs antes de repetir.",
      }, 409);
      if (reserveError) throw Error("MANUAL_RESERVATION_FAILED");
      const appToken = Deno.env.get("INNGAGE_APP_TOKEN") || "";
      const bearer = (Deno.env.get("INNGAGE_API_BEARER") || "").replace(/^Bearer\s+/i, "");
      let state = "unknown";
      let providerCode: number | null = null;
      let errorCode: string | null = "MANUAL_SEND_TRANSPORT_ERROR";
      if (!appToken || !bearer) {
        state = "rejected"; errorCode = "INNGAGE_SECRETS_MISSING";
      } else {
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + bearer },
            body: JSON.stringify({ sendPushRequest: {
              app_token: appToken, api_template_id: TEMPLATE_ID,
              tags: { "": [] }, identifier: email, subscriber_email: email,
            }}),
            signal: AbortSignal.timeout(15000),
          });
          providerCode = response.status;
          state = response.ok ? "accepted" : "rejected";
          errorCode = response.ok ? null : "MESSAGE_" + response.status;
        } catch (e) {
          state = "unknown";
          errorCode = e instanceof Error ? e.name.slice(0, 45) : "UNKNOWN_TRANSPORT_ERROR";
        }
      }
      const { error: updateError } = await db.from("crm_inngage_match_delivery").update({
        status: state, provider_status: providerCode, provider_error_code: errorCode,
        updated_at: new Date().toISOString(),
      }).eq("user_id", caller.id).eq("campaign_key", key).eq("week_key", day);
      if (updateError) console.error("[matchvagas] MANUAL_LOG_UPDATE_FAILED", updateError.code);
      return reply({
        ok: state === "accepted", status: state, template_id: TEMPLATE_ID,
        provider_http_status: providerCode, provider_error_code: errorCode,
        recipient_count: 1, sent_email: state === "accepted",
        message: state === "accepted"
          ? "A Inngage aceitou a solicitação do teste manual. Confira o recebimento e as 31 variáveis."
          : "A Inngage não confirmou o teste manual. Não tente novamente sem verificar o diagnóstico.",
      }, state === "accepted" ? 200 : 502);
    }
    if (action === "probe_fields") {
      // Distinct from send_test: only writes attributes for the authenticated admin.
      // Never calls /v1/message/ and never enables campaign delivery.
      if (caller.mode !== "admin" || body.confirm !== "VALIDAR_CAMPOS_SEM_EMAIL_2050") {
        return reply({ error: "ADMIN_CONFIRMATION_REQUIRED" }, 403);
      }
      const appToken = Deno.env.get("INNGAGE_APP_TOKEN") || "";
      const bearer = (Deno.env.get("INNGAGE_API_BEARER") || "").replace(/^Bearer\s+/i, "");
      if (!appToken || !bearer) return reply({ error: "INNGAGE_SECRETS_MISSING" }, 503);
      const ownProfile = profiles.find(p => p.id === caller.id);
      if (!ownProfile) return reply({ error: "PROFILE_NOT_ELIGIBLE" }, 403);
      const email = await eligibleEmail(caller.id);
      if (!email) return reply({ error: "EMAIL_NOT_ELIGIBLE" }, 403);
      const matching = await prepare(caller.id, jobs, min);
      const attributes = matching.length === 5 ? fields(ownProfile, matching) : {
        NOME: clean(ownProfile.full_name).split(/\s+/)[0] || "profissional",
      };
      const campaignKey = "matchvagas_2050_probe_campos";
      const day = new Date().toISOString().slice(0, 10);
      const { error: insertedError } = await db.from("crm_inngage_match_delivery").insert({
        user_id: caller.id, campaign_key: campaignKey, week_key: day,
        job_ids: matching.length === 5 ? matching.map(x => x.job.id) : [],
        scores: matching.length === 5 ? matching.map(x => x.score) : [],
        status: "reserved",
      });
      if (insertedError?.code === "23505") return reply({
        ok: false, status: "already_checked_today", sent_email: false,
        message: "A verificação de campos já foi tentada hoje. Confira o diagnóstico.",
      }, 409);
      if (insertedError) throw Error("PROBE_RESERVATION_FAILED");
      let providerStatus: number | null = null;
      let status = "unknown";
      let code: string | null = "PROBE_TRANSPORT_FAILURE";
      let responseKeys: string[] = [];
      try {
        const response = await fetch(FIELDS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + bearer },
          body: JSON.stringify({ fieldsRequest: {
            app_token: appToken, identifier: email, email, custom_field: attributes,
          }}),
          signal: AbortSignal.timeout(12000),
        });
        providerStatus = response.status;
        status = response.ok ? "accepted" : "rejected";
        code = response.ok ? null : "CUSTOM_FIELDS_" + response.status;
        const txt = (await response.text()).slice(0, 2000);
        try {
          const parsed = JSON.parse(txt);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            responseKeys = Object.keys(parsed).slice(0, 12);
          }
        } catch { /* Don't log or return raw response with possible personal data. */ }
      } catch (error) {
        code = error instanceof Error ? error.name.slice(0, 40) : "PROBE_UNKNOWN";
      }
      const { error: updateError } = await db.from("crm_inngage_match_delivery").update({
        status, provider_status: providerStatus, provider_error_code: code,
        updated_at: new Date().toISOString(),
      }).eq("user_id", caller.id).eq("campaign_key", campaignKey).eq("week_key", day);
      if (updateError) console.error("[inngage-match] PROBE_LOG_FAILED", updateError.code);
      return reply({
        ok: status === "accepted", status, template_id: TEMPLATE_ID,
        submitted_fields: Object.keys(attributes).length,
        provider_http_status: providerStatus, provider_error_code: code,
        response_keys: responseKeys, sent_email: false,
        message: status === "accepted"
          ? "A API de campos aceitou a atualização. Nenhum template foi enviado. Ainda falta confirmar os atributos no perfil da Inngage e homologar o e-mail."
          : "A atualização dos campos não foi confirmada. Nenhum template foi enviado. Inspecione a resposta da API antes de repetir.",
      }, status === "accepted" ? 200 : 502);
    }
    if (action === "dry_run") {
      if (caller.mode !== "admin") return reply({ error: "ADMIN_ONLY" }, 403);
      const ownProfile = profiles.find(p => p.id === caller.id);
      if (!ownProfile) return reply({
        ok: true, status: "not_eligible", template_id: TEMPLATE_ID, dispatch_enabled: enabled,
        message: "Perfil administrador não elegível ou sem aceite para recomendações.",
        sent_email: false, provider_contacted: false,
      });
      const picks = await prepare(caller.id, jobs, min);
      if (picks.length !== 5) return reply({
        ok: true, status: "not_enough_matches", template_id: TEMPLATE_ID,
        cards_available: picks.length, jobs_analyzed: jobs.length,
        reason: "O filtro não encontrou cinco vagas com senioridade e modalidade verificadas.",
        sent_email: false, provider_contacted: false,
      });
      const mapped = fields(ownProfile, picks);
      const names = ["NOME", ...Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        return ["CARGO", "EMPRESA", "MODALIDADE", "LOCAL", "MATCH", "URL"]
          .map(suffix => "VAGA_" + n + "_" + suffix);
      }).flat()];
      const valid = names.length === 31 &&
        Object.keys(mapped).length === 31 &&
        names.every(name => typeof mapped[name] === "string" && mapped[name].length > 0);
      const unique = new Set(picks.map(({ job }) => clean(job.url).toLowerCase())).size === 5;
      const uniqueOpportunities = new Set(picks.map(({ job }) => opportunityKey(job))).size === 5;
      return reply({
        ok: true, status: valid && unique && uniqueOpportunities ? "mapping_ready" : "mapping_invalid",
        template_id: TEMPLATE_ID, cards_available: picks.length,
        custom_fields_count: Object.keys(mapped).length,
        custom_fields_valid: valid, unique_job_urls: unique, unique_opportunities: uniqueOpportunities,
        fields: mapped,
        matching_method: "strict_role_and_seniority_weighted_rules_not_probability",
        disclaimer: "Pontuações são indicadores heurísticos de aderência; não representam probabilidade de contratação.",
        provider_fields_verified: cfg.provider_fields_verified === true,
        dispatch_enabled: enabled, sent_email: false, provider_contacted: false,
        explanation: "Prévia local com modalidade explícita no anúncio ou em campo normalizado. Resultados com modalidade não comprovada são excluídos. Não valida a API externa da Inngage nem a entrega por e-mail.",
      });
    }
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
      const result = await send(profile.id, profile, matches, week, action === "send_test" ? "matchvagas_2050_teste" : CAMPAIGN);
      results.push(result);
      if (result.state === "accepted") accepted++;
      else if (result.state === "rejected") rejected++;
      else if (result.state === "unknown") unknown++;
      else skipped++;
      if (rejected || unknown) break; // Fail closed on any provider issue.
    }
    const skippedPreviously = results.some(result =>
      !!result && typeof result === "object" && "code" in result &&
      result.code === "ALREADY_ATTEMPTED_THIS_WEEK");
    return reply({
      ok: rejected + unknown === 0 && !skippedPreviously,
      status: skippedPreviously ? "blocked_previous_attempt" : rejected + unknown ? "provider_failed" : "completed",
      template_id: TEMPLATE_ID, processed: toProcess.length,
      accepted, rejected, unknown, skipped, results, sent_email: accepted > 0,
      message: skippedPreviously
        ? "A tentativa anterior já está registrada. Nenhum novo e-mail foi enviado."
        : undefined,
    }, rejected + unknown ? 502 : 200);
  } catch (error) {
    console.error("[inngage-match] INTERNAL_ERROR", error instanceof Error ? error.message : "unknown");
    return reply({ error: "INTERNAL_ERROR" }, 500);
  }
});