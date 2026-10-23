// Conexão CRM: Inngage 2049, envio seguro e individual.
// Recorrência restrita ao servidor, com consentimento e reserva antes de cada envio.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const TEMPLATE_ID = "2049";
const TEST_CAMPAIGN = "vagassalvas_2049_teste_v2";
const ORIGIN = "https://conexaocrm.com";
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
});
function config(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error("CONFIG_MISSING_" + name);
  return value;
}
function utcDate(day = new Date()) {
  return day.toISOString().slice(0, 10);
}
function getBearer(req: Request): string | null {
  const value = req.headers.get("authorization") || "";
  return /^Bearer\s+(.+)$/i.exec(value)?.[1] || null;
}
function todayWindow() {
  const now = Date.now();
  return {
    start: new Date(now - 30 * 86400000).toISOString().replace("Z", ""),
    end: new Date(now - 72 * 3600000).toISOString().replace("Z", ""),
  };
}
async function eligibleCount(service: ReturnType<typeof createClient>) {
  const { start, end } = todayWindow();
  const { data: saves, error: savesError } = await service.from("saved_scraped_jobs")
    .select("user_id,vaga_url,created_at").gte("created_at", start).lte("created_at", end).limit(1000);
  if (savesError) throw savesError;
  const userIds = [...new Set((saves || []).map(x => x.user_id))];
  if (!userIds.length) return { eligible_members: 0, eligible_saved_jobs: 0, capped: false };
  const { data: profiles, error: profileError } = await service.from("profiles")
    .select("id,receive_community_updates").in("id", userIds);
  if (profileError) throw profileError;
  const consented = new Set((profiles || []).filter(x => x.receive_community_updates === true).map(x => x.id));
  const rows = (saves || []).filter(x => consented.has(x.user_id));
  if (!rows.length) return { eligible_members: 0, eligible_saved_jobs: 0, capped: (saves || []).length >= 1000 };
  const urls = [...new Set(rows.map(x => x.vaga_url))];
  const { data: vacancies, error: vacanciesError } = await service.from("vagas_crm")
    .select("url,availability_status").in("url", urls).limit(1000);
  if (vacanciesError) throw vacanciesError;
  const byUrl = new Map((vacancies || []).map(v => [v.url, v.availability_status]));
  // Vagas não identificadas ou encerradas não geram lembretes.
  const activeRows = rows.filter(x => {
    const state = byUrl.get(x.vaga_url);
    return state === "listed" || state === "unverified";
  });
  return {
    eligible_members: new Set(activeRows.map(x => x.user_id)).size,
    eligible_saved_jobs: activeRows.length,
    capped: (saves || []).length >= 1000,
  };
}

async function deliver(service: ReturnType<typeof createClient>, userId: string, email: string, campaign: string) {
  const period=utcDate();
  const {error}=await service.from("crm_inngage_saved_jobs_send_log").insert({user_id:userId,campaign_key:campaign,period_key:period,status:"reserved"});
  if(error?.code==="23505")return {status:"skipped",provider_http_status:null};
  if(error)throw error;
  let status="unknown",http:number|null=null;
  try {
    const response=await fetch("https://api.inngage.com.br/v1/message/",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+config("INNGAGE_API_BEARER").replace(/^Bearer\s+/i,"")},body:JSON.stringify({sendPushRequest:{app_token:config("INNGAGE_APP_TOKEN"),api_template_id:TEMPLATE_ID,tags:{},identifier:email}}),signal:AbortSignal.timeout(15000)});
    http=response.status;
    const data=await response.json().catch(()=>null);
    const result=data?.saveResponse||data?.sendPushResponse||data;
    const code=Number(result?.status??result?.statusCode??0);
    const rejected=result?.success===false||[3,4,5,10,99].includes(code)||code>=400||/error|failed|invalid/i.test(String(result?.status||""));
    const confirmed=[1,2,200,201,202].includes(code)||!!result?.details?.CM_id||!!result?.details?.control;
    status=!response.ok||rejected?"rejected":confirmed?"accepted":"unknown";
  }catch{ /* Unknown results are reserved and never retried automatically. */ }
  const {error:updateError}=await service.from("crm_inngage_saved_jobs_send_log").update({status,provider_status:http,updated_at:new Date().toISOString()}).eq("user_id",userId).eq("campaign_key",campaign).eq("period_key",period);
  if(updateError)throw updateError;
  return {status,provider_http_status:http};
}


async function isVerifiedServiceKey(token: string, endpoint: string): Promise<boolean> {
  // Claims are only a prefilter. Supabase Auth must validate the actual credential.
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload + "=".repeat((4 - payload.length % 4) % 4)));
    if (claims.role !== "service_role") return false;
    const response = await fetch(endpoint.replace(/\/$/, "") + "/auth/v1/admin/users?page=1&per_page=1", {
      headers: { apikey: token, Authorization: "Bearer " + token },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    // Never read, log, or return user data from this authorization check.
    await response.body?.cancel();
    return response.status === 200;
  } catch {
    return false;
  }
}

async function handle(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const token = getBearer(req);
  if (!token) return json({ error: "UNAUTHORIZED" }, 401);
  try {
    const endpoint = config("SUPABASE_URL");
    const anonKey = config("SUPABASE_ANON_KEY");
    const serviceKey = config("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(endpoint, anonKey, {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const serviceCaller = token === serviceKey || await isVerifiedServiceKey(token, endpoint);
    const { data: auth, error: authError } = serviceCaller ? { data: { user: null }, error: null } : await client.auth.getUser(token);
    if (!serviceCaller && (authError || !auth?.user?.id)) return json({ error: "UNAUTHORIZED" }, 401);
    const { data: admin, error: adminError } = serviceCaller ? { data: true, error: null } : await client.rpc("crm_is_admin");
    if (adminError || admin !== true) return json({ error: "FORBIDDEN" }, 403);
    const body = await req.json().catch(() => null);
    const action = body?.action;
    const targetIds = body?.user_ids;
    if (targetIds !== undefined && (!Array.isArray(targetIds) || targetIds.length < 1 || targetIds.length > 20 || targetIds.some((id: unknown) => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))) return json({error:"INVALID_RECIPIENTS"},400);

    const service = createClient(endpoint, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const {data: settings, error: settingsError} = await service.from("crm_inngage_match_config").select("saved_jobs_enabled").eq("id",1).single();
    if (settingsError) throw settingsError;
    if (serviceCaller && action !== "run") return json({error:"ACTION_NOT_ALLOWED"},403);
    if (action === "run") {
      if (!serviceCaller) return json({error:"SERVICE_ONLY"},403);
      if (settings?.saved_jobs_enabled !== true) return json({ok:true,status:"paused"});
      const {start,end}=todayWindow();
      let savesQuery=service.from("saved_scraped_jobs").select("user_id,vaga_url,created_at").gte("created_at",start).lte("created_at",end).order("created_at");
      if(targetIds) savesQuery=savesQuery.in("user_id",targetIds);
      const {data:saves,error}=await savesQuery.limit(1000);
      if(error)throw error;
      let accepted=0,skipped=0;
      for(const id of [...new Set((saves||[]).map(x=>x.user_id))]) {
        if(accepted>=(targetIds?20:10))break;
        const {data:profile,error:pe}=await service.from("profiles").select("receive_community_updates").eq("id",id).single();
        if(pe||profile?.receive_community_updates!==true){skipped++;continue;}
        const own=(saves||[]).filter(x=>x.user_id===id);
        const {data:jobs,error:je}=await service.from("vagas_crm").select("url,availability_status").in("url",own.map(x=>x.vaga_url)).in("availability_status",["listed","unverified"]);
        if(je)throw je;
        if(!jobs?.length){skipped++;continue;}
        const {data:past,error:he}=await service.from("crm_inngage_saved_jobs_send_log").select("status").eq("user_id",id).eq("campaign_key","vagassalvas_2049").gte("created_at",new Date(Date.now()-7*86400000).toISOString()).limit(1);
        if(he)throw he;
        if(past?.length){skipped++;continue;}
        const {data:account,error:ae}=await service.auth.admin.getUserById(id);
        if(ae||!account.user?.email_confirmed_at||!account.user.email){skipped++;continue;}
        const email=account.user.email.trim().toLowerCase();
        const checks=await Promise.all([service.from("crm_newsletter_subscriptions").select("status").eq("user_id",id),service.from("crm_newsletter_subscriptions").select("status").eq("email",email)]);
        if(checks.some(r=>r.error))throw Error("OPT_OUT_QUERY_FAILED");
        if(checks.some(r=>r.data?.some(x=>x.status!=="subscribed"))){skipped++;continue;}
        const result=await deliver(service,id,email,"vagassalvas_2049");
        if(result.status==="skipped"){skipped++;continue;}
        if(result.status!=="accepted")return json({ok:false,accepted,skipped,...result},502);
        accepted++;
      }
      return json({ok:true,accepted,skipped});
    }
    if(action === "activate" || action === "pause") {
      if(!auth.user?.id)return json({error:"ADMIN_ONLY"},403);
      if(action==="activate") {
        if(body?.confirm!=="CONFIRMEI_TESTE_E_DESCADASTRO_2049")return json({error:"VISUAL_CONFIRMATION_REQUIRED"},403);
        const {data:past,error}=await service.from("crm_inngage_saved_jobs_send_log").select("status").eq("user_id",auth.user.id).eq("campaign_key",TEST_CAMPAIGN).eq("status","accepted").gte("created_at",new Date(Date.now()-7*86400000).toISOString()).limit(1);
        if(error||!past?.length)return json({error:"ACCEPTED_TEST_REQUIRED"},403);
      }
      const {error}=await service.from("crm_inngage_match_config").update({saved_jobs_enabled:action==="activate"}).eq("id",1);
      if(error)throw error;
      return json({ok:true,enabled:action==="activate"});
    }
    if (action === "diagnostics") {
      return json({ ok: true, mode: "diagnostics", template_id: TEMPLATE_ID,
        inngage_app_token_configured: !!Deno.env.get("INNGAGE_APP_TOKEN"),
        inngage_authorization_configured: !!Deno.env.get("INNGAGE_API_BEARER"),
        test_mode: "single_authenticated_admin",
        recurring_reminders_active: settings?.saved_jobs_enabled === true });
    }
    if (action === "preview") {
      const preview = await eligibleCount(service);
      return json({ ok: true, mode: "preview", template_id: TEMPLATE_ID,
        email_automation_active: settings?.saved_jobs_enabled === true, ...preview });
    }
    if (action !== "send_test") return json({ error: "ACTION_NOT_ALLOWED" }, 400);
    // Teste liberado após confirmação de ativação do template. Admin autenticado deve solicitar o envio explicitamente.
    if (body?.confirm !== "ENVIAR_TESTE_PARA_MIM") return json({ error: "CONFIRMATION_REQUIRED" }, 400);
    const user = auth.user;
    if (!user.email || !user.email_confirmed_at) return json({ error: "EMAIL_NOT_CONFIRMED" }, 400);
    const email = user.email.trim().toLowerCase();
    const result = await deliver(service,user.id,email,TEST_CAMPAIGN);
    return json({ok:result.status==="accepted",mode:"send_test",...result},result.status==="accepted"?200:502);
  } catch (error) {
    const code = error instanceof Error && error.message.startsWith("CONFIG_MISSING_")
      ? "CONFIGURATION_INCOMPLETE" : "INTERNAL_ERROR";
    console.error("[crm-inngage-saved-jobs]", code);
    return json({ error: code }, 500);
  }
}
Deno.serve(handle);
