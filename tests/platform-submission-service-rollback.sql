BEGIN;
CREATE TEMP TABLE crm_flow_fixture(uid uuid,sid uuid,challenge jsonb);
GRANT ALL ON crm_flow_fixture TO service_role,authenticated;
INSERT INTO crm_flow_fixture VALUES(gen_random_uuid(),gen_random_uuid(),NULL);
INSERT INTO auth.users(id,email,email_confirmed_at,role,aud) SELECT uid,'crm-flow-'||uid||'@example.invalid',now(),'authenticated','authenticated' FROM crm_flow_fixture;
INSERT INTO auth.sessions(id,user_id,created_at,updated_at) SELECT sid,uid,now(),now() FROM crm_flow_fixture;
SET LOCAL ROLE service_role;
UPDATE crm_flow_fixture SET challenge=public.crm_issue_submission_challenge(uid,'avaliacoes_plataformas');
DO $$ DECLARE f record; parts text[]; BEGIN
 SELECT * INTO f FROM crm_flow_fixture;
 parts:=regexp_match(f.challenge->>'question','([0-9]+) \+ ([0-9]+)');
 ASSERT public.crm_verify_submission_challenge(f.uid,(f.challenge->>'id')::uuid,parts[1]::integer+parts[2]::integer),'Challenge verification failed';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',(SELECT jsonb_build_object('sub',uid,'session_id',sid,'role','authenticated')::text FROM crm_flow_fixture),true) IS NOT NULL AS fixture_ready;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 ASSERT (public.crm_submission_status()->>'remaining')::int=5,'Initial quota';
 INSERT INTO public.avaliacoes_plataformas(plataforma_nome,nota,comentario,avaliador) VALUES('__crm_isolated_flow__',4,'Teste isolado de gravação, revertido ao concluir.','');
 ASSERT (public.crm_submission_status()->>'remaining')::int=4,'Quota after insert';
 ASSERT EXISTS(SELECT 1 FROM public.avaliacoes_plataformas WHERE plataforma_nome='__crm_isolated_flow__'),'Review visibility';
END $$;
RESET ROLE;
SELECT 'Server challenge issued and verified; authenticated review saved and visible; quota consumed once; all rolled back' AS result;
ROLLBACK;