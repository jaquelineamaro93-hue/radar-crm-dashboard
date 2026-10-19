-- Política de cadastro do CONEXÃO CRM, solicitada pela administração em 2026-10-19.
-- O domínio protonmail.com pertence a um provedor legítimo, bloqueado por decisão administrativa.
-- Bloqueio aplicado imediatamente na tabela de regras do Supabase de produção.
insert into public.crm_signup_blocked_domains (domain, reason)
values ('protonmail.com', 'Bloqueio integral solicitado pela administração em 2026-10-19')
on conflict (domain) do update set reason = excluded.reason;
