-- Evita contornar a lista de bloqueio alterando o e-mail de uma conta existente.
-- Conserva o bloqueio anterior antes de INSERT e adiciona UPDATE OF email.
drop trigger if exists crm_reject_suspicious_signup_email on auth.users;
create trigger crm_reject_suspicious_signup_email
before insert or update of email on auth.users
for each row execute function public.crm_reject_suspicious_signup_email();
