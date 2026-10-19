-- Bloqueio adicional aprovado pela administração do CONEXÃO CRM em 2026-10-19.
-- Observação: proton.me é um provedor legítimo; esta é uma decisão de política
-- de cadastro para todo o domínio, sem implicar que todos os usuários sejam maliciosos.
-- Não bloqueia protonmail.com nem outros domínios do Proton.
insert into public.crm_signup_blocked_domains (domain, reason)
values ('proton.me', 'Bloqueio integral solicitado pela administração em 2026-10-19')
on conflict (domain) do update set reason = excluded.reason;
