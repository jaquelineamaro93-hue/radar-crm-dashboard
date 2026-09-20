BEGIN;
CREATE TEMP TABLE crm_test_results(test text,passed boolean);
GRANT ALL ON crm_test_results TO authenticated,anon;
DO $$ DECLARE u uuid; s uuid; t text; c jsonb; BEGIN
 u:=gen_random_uuid();s:=gen_random_uuid();
 INSERT INTO auth.users(id,email,email_confirmed_at,role,aud) VALUES(u,'crm-rollback-'||u::text||'@example.invalid',now(),'authenticated','authenticated');
 INSERT INTO auth.sessions(id,user_id,created_at,updated_at) VALUES(s,u,now(),now());
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',s)::text,true);
 -- Synthetic fixture exists only inside this transaction; no live identity used.
 FOREACH t IN ARRAY ARRAY['avaliacoes_agencias','avaliacoes_freelancers','avaliacoes_plataformas','recomendacoes','cursos_sugeridos'] LOOP
  c:=public.crm_issue_submission_challenge(u,t);
  IF NOT public.crm_verify_submission_challenge(u,(c->>'id')::uuid,(SELECT answer FROM crm_private.submission_challenges WHERE id=(c->>'id')::uuid)) THEN RAISE EXCEPTION 'Challenge round trip failed'; END IF;
 END LOOP;
END $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE x record; n integer; BEGIN
 ASSERT public.crm_submission_status()->>'remaining'='5','quota initial';
 BEGIN INSERT INTO public.eventos_sugeridos(nome) VALUES('__crm_no_challenge__'); RAISE EXCEPTION 'Unverified write accepted'; EXCEPTION WHEN SQLSTATE '42501' THEN INSERT INTO crm_test_results VALUES('Direct API write without verification rejected',true); END;

 BEGIN INSERT INTO public.avaliacoes_agencias(agencia_nome,nota,comentario) VALUES('__crm_rollback_test__',4,'c.a.r.a.l.h.o'); RAISE EXCEPTION 'Profanity accepted'; EXCEPTION WHEN SQLSTATE '22023' THEN INSERT INTO crm_test_results VALUES('Obfuscated profanity rejected',true); END;
 BEGIN INSERT INTO public.avaliacoes_agencias(agencia_nome,nota,comentario) VALUES('__crm_rollback_test__',4,'<script>alert(1)</script>'); RAISE EXCEPTION 'Script accepted'; EXCEPTION WHEN SQLSTATE '22023' THEN INSERT INTO crm_test_results VALUES('Script payload rejected',true); END;
 INSERT INTO public.avaliacoes_agencias(agencia_nome,nota,comentario) VALUES('__crm_rollback_test__',4,'Crítica legítima: suporte lento.');
 INSERT INTO public.avaliacoes_freelancers(freelancer_nome,nota,comentario) VALUES('__crm_rollback_test__',5,'Bom atendimento e entrega.');
 INSERT INTO public.avaliacoes_plataformas(plataforma_nome,nota,comentario) VALUES('__crm_rollback_test__',3,'Avaliação com comentário.');
 INSERT INTO public.recomendacoes(tipo,nome,recomenda) VALUES('freelancer','__crm_rollback_test__',true);
 INSERT INTO public.cursos_sugeridos(nome,aprovado) VALUES('__crm_rollback_test__',true);
 ASSERT public.crm_submission_status()->>'remaining'='0','five global writes';
 SELECT aprovado,moderation_status INTO x FROM public.cursos_sugeridos WHERE nome='__crm_rollback_test__';
 ASSERT x.aprovado=false AND x.moderation_status='pending','Cannot self publish';
 INSERT INTO crm_test_results VALUES('Five writes across five categories persisted',true),('Suggestion forced pending despite aprovado=true',true);
 BEGIN INSERT INTO public.recomendacoes(tipo,nome,recomenda) VALUES('agencia','__crm_rollback_sixth__',true); RAISE EXCEPTION 'Sixth write accepted'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM NOT LIKE 'Limite de 5%' THEN RAISE; END IF; INSERT INTO crm_test_results VALUES('Sixth global submission blocked',true); END;
 ASSERT public.crm_submission_status()->>'used'='5','failed writes do not consume quota';
 INSERT INTO crm_test_results VALUES('Failed writes do not consume quota',true);
END $$;
RESET ROLE;
DO $$ BEGIN
 UPDATE crm_private.submission_usage SET created_at=clock_timestamp()-interval '25 hours' WHERE actor=auth.uid();
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN ASSERT public.crm_submission_status()->>'remaining'='5','Rolling expiry'; INSERT INTO crm_test_results VALUES('Quota recovers after 24 hours',true); END $$;
RESET ROLE;
DO $$ DECLARE c jsonb; BEGIN
 c:=public.crm_issue_submission_challenge(auth.uid(),'avaliacoes_agencias');
 PERFORM public.crm_verify_submission_challenge(auth.uid(),(c->>'id')::uuid,(SELECT answer FROM crm_private.submission_challenges WHERE id=(c->>'id')::uuid));
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN INSERT INTO public.avaliacoes_agencias(agencia_nome,nota) VALUES('__crm_rollback_test__',5); RAISE EXCEPTION 'Duplicate accepted'; EXCEPTION WHEN unique_violation THEN INSERT INTO crm_test_results VALUES('Repeat review rejected across sessions',true); END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN INSERT INTO public.recomendacoes(tipo,nome,recomenda) VALUES('agencia','__crm_anon_test__',true); RAISE EXCEPTION 'Anonymous write accepted'; EXCEPTION WHEN SQLSTATE '42501' THEN INSERT INTO crm_test_results VALUES('Anonymous contribution rejected',true); END;
END $$;
RESET ROLE;
SELECT * FROM crm_test_results;
ROLLBACK;
