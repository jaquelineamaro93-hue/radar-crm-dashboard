// Conexão CRM: Inngage 2049, envio seguro e individual.
// Este endpoint não possui modo de envio em lote nem agendamento automático.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const TEMPLATE_ID = "2049";
const TEST_CAMPAIGN = "vagassalvas_2049_teste";
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
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth?.user?.id) return json({ error: "UNAUTHORIZED" }, 401);
    const { data: admin, error: adminError } = await client.rpc("crm_is_admin");
    if (adminError || admin !== true) return json({ error: "FORBIDDEN" }, 403);
    const body = await req.json().catch(() => null);
    const action = body?.action;
    const service = createClient(endpoint, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    if (action === "diagnostics") {
      return json({ ok: true, mode: "diagnostics", template_id: TEMPLATE_ID,
        inngage_app_token_configured: !!Deno.env.get("INNGAGE_APP_TOKEN"),
        inngage_authorization_configured: !!Deno.env.get("INNGAGE_API_BEARER"),
        test_mode: "single_authenticated_admin",
        recurring_reminders_active: false });
    }
    if (action === "preview") {
      const preview = await eligibleCount(service);
      return json({ ok: true, mode: "preview", template_id: TEMPLATE_ID,
        email_automation_active: false, ...preview });
    }
    if (action !== "send_test") return json({ error: "ACTION_NOT_ALLOWED" }, 400);
    // Teste liberado após confirmação de ativação do template. Admin autenticado deve solicitar o envio explicitamente.
    if (body?.confirm !== "ENVIAR_TESTE_PARA_MIM") return json({ error: "CONFIRMATION_REQUIRED" }, 400);
    const user = auth.user;
    if (!user.email || !user.email_confirmed_at) return json({ error: "EMAIL_NOT_CONFIRMED" }, 400);
    const email = user.email.trim().toLowerCase();
    const day = utcDate();
    // Reserva antes de falar com o provedor para impedir duplo envio (inclusive concorrente).
    const row = { user_id: user.id, campaign_key: TEST_CAMPAIGN, period_key: day, status: "reserved" };
    const { error: reserveError } = await service.from("crm_inngage_saved_jobs_send_log").insert(row);
    if (reserveError?.code === "23505") return json({ error: "TEST_ALREADY_ATTEMPTED_TODAY" }, 409);
    if (reserveError) throw reserveError;
    const payload = { sendPushRequest: {
      app_token: config("INNGAGE_APP_TOKEN"),
      api_template_id: TEMPLATE_ID,
      tags: { "": [] },
      identifier: email,
      subscriber_email: email,
    }};
    let providerStatus = 0;
    let status = "unknown";
    try {
      const response = await fetch("https://api.inngage.com.br/v1/message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config("INNGAGE_API_BEARER").replace(/^Bearer\s+/i, ""),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      providerStatus = response.status;
      status = response.ok ? "accepted" : "rejected";
    } catch (error) {
      // Falhas de rede são ambíguas: nunca reenviar automaticamente.
      console.error("[crm-inngage-saved-jobs] Falha de transporte no teste", error instanceof Error ? error.name : "unknown");
    }
    const { error: logError } = await service.from("crm_inngage_saved_jobs_send_log")
      .update({ status, provider_status: providerStatus || null, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("campaign_key", TEST_CAMPAIGN).eq("period_key", day);
    if (logError) console.error("[crm-inngage-saved-jobs] Falha ao atualizar log", logError.code);
    return json({ ok: status === "accepted", mode: "send_test", status,
      provider_http_status: providerStatus || null, submitted_to_provider: status === "accepted" }, status === "accepted" ? 200 : 502);
  } catch (error) {
    const code = error instanceof Error && error.message.startsWith("CONFIG_MISSING_")
      ? "CONFIGURATION_INCOMPLETE" : "INTERNAL_ERROR";
    console.error("[crm-inngage-saved-jobs]", code);
    return json({ error: code }, 500);
  }
}
Deno.serve(handle);
