
ALTER TABLE public.freelancers_sugeridos
 ADD COLUMN IF NOT EXISTS titulo text,
 ADD COLUMN IF NOT EXISTS ferramentas text,
 ADD COLUMN IF NOT EXISTS anos_experiencia smallint,
 ADD COLUMN IF NOT EXISTS localidade text,
 ADD COLUMN IF NOT EXISTS idiomas text,
 ADD COLUMN IF NOT EXISTS modalidade text,
 ADD COLUMN IF NOT EXISTS disponibilidade text,
 ADD COLUMN IF NOT EXISTS valor_hora numeric(10,2),
 ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.freelancers_sugeridos DROP CONSTRAINT IF EXISTS crm_freelancer_optional_fields_check;
ALTER TABLE public.freelancers_sugeridos ADD CONSTRAINT crm_freelancer_optional_fields_check CHECK (
 (titulo IS NULL OR char_length(titulo)<=100)
 AND (ferramentas IS NULL OR char_length(ferramentas)<=240)
 AND (localidade IS NULL OR char_length(localidade)<=120)
 AND (idiomas IS NULL OR char_length(idiomas)<=120)
 AND (anos_experiencia IS NULL OR anos_experiencia BETWEEN 0 AND 60)
 AND (valor_hora IS NULL OR valor_hora BETWEEN 0 AND 100000)
 AND (modalidade IS NULL OR modalidade IN ('remoto','hibrido','presencial','flexivel'))
 AND (disponibilidade IS NULL OR disponibilidade IN ('disponivel','sob_consulta','indisponivel'))
 AND (foto_url IS NULL OR foto_url ~ '^https://rwkbpafpniwzvlkfngag[.]supabase[.]co/storage/v1/object/public/freelancer-avatars/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$')
);
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('freelancer-avatars','freelancer-avatars',true,2097152,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=true,file_size_limit=2097152,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS freelancer_avatars_owner_upload ON storage.objects;
CREATE POLICY freelancer_avatars_owner_upload ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (
  bucket_id='freelancer-avatars'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
  AND coalesce((auth.jwt()->>'is_anonymous'),'false')='false'
 );
CREATE OR REPLACE FUNCTION public.crm_moderate_item(p_table text, p_id bigint, p_approve boolean)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE r jsonb; payload jsonb; new_id bigint; target bigint; affected integer; k text; v jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.crm_is_admin() THEN RAISE EXCEPTION 'Somente a administradora pode moderar.' USING errcode='42501'; END IF;
 IF p_table NOT IN ('agencias_sugeridas','cursos_sugeridos','eventos_sugeridos','plataformas_sugeridas','freelancers_sugeridos','freelancers_edicoes','conteudos_comunidade','crm_submission_requests') THEN RAISE EXCEPTION 'Categoria inválida'; END IF;
 EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE',p_table) INTO r USING p_id;
 IF r IS NULL THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
 IF coalesce((r->>'aprovado')::boolean,false) OR coalesce(r->>'status',r->>'moderation_status')<>'pending' THEN RAISE EXCEPTION 'Item já moderado'; END IF;
 IF p_approve THEN
  payload:=CASE WHEN p_table='crm_submission_requests' THEN r->'payload' WHEN p_table='freelancers_edicoes' THEN (r->>'descricao_alteracao')::jsonb ELSE r END;
  FOR k,v IN SELECT * FROM jsonb_each(payload) LOOP
   IF k IN ('url','link','site','linkedin','portfolio','autor_linkedin','material_url') AND coalesce(v#>>'{}','')<>'' AND (v#>>'{}') !~* '^https?://' THEN RAISE EXCEPTION 'Link inválido. Rejeite e solicite o reenvio com HTTP ou HTTPS.'; END IF;
  END LOOP;
 END IF;
 IF p_approve AND p_table='crm_submission_requests' THEN
  payload:=r->'payload';
  IF r->>'kind'='job' THEN
   INSERT INTO public.vagas_crm(title,cargo,company,empresa,url,description,source) VALUES(payload->>'title',payload->>'title',payload->>'company',payload->>'company',payload->>'url',payload->>'description','Comunidade');
  ELSIF r->>'kind'='agency' THEN
   INSERT INTO public.agencias_sugeridas(nome,descricao,site,sugerido_por) VALUES(payload->>'title',payload->>'description',coalesce(payload->>'url',''),'Comunidade') RETURNING id INTO new_id;
   UPDATE public.agencias_sugeridas SET aprovado=true,moderation_status='approved' WHERE id=new_id;
  ELSE RAISE EXCEPTION 'Tipo não suportado'; END IF;
 ELSIF p_approve AND p_table='freelancers_edicoes' THEN
  target:=(r->>'target_id')::bigint;
  IF target IS NULL THEN RAISE EXCEPTION 'Pedido antigo sem perfil de destino. Revise manualmente antes de aprovar.'; END IF;
  payload:=(r->>'descricao_alteracao')::jsonb;
  UPDATE public.freelancers_sugeridos SET
   categoria=coalesce(payload->>'categoria',categoria),bio=coalesce(payload->>'bio',bio),linkedin=coalesce(payload->>'linkedin',linkedin),portfolio=coalesce(payload->>'portfolio',portfolio),contato=coalesce(payload->>'contato',contato),titulo=coalesce(payload->>'titulo',titulo),ferramentas=coalesce(payload->>'ferramentas',ferramentas),anos_experiencia=CASE WHEN payload ? 'anos_experiencia' THEN (payload->>'anos_experiencia')::smallint ELSE anos_experiencia END,localidade=coalesce(payload->>'localidade',localidade),idiomas=coalesce(payload->>'idiomas',idiomas),modalidade=coalesce(payload->>'modalidade',modalidade),disponibilidade=coalesce(payload->>'disponibilidade',disponibilidade),valor_hora=CASE WHEN payload ? 'valor_hora' THEN (payload->>'valor_hora')::numeric ELSE valor_hora END,foto_url=coalesce(payload->>'foto_url',foto_url)
  WHERE id=target;
  GET DIAGNOSTICS affected=ROW_COUNT; IF affected<>1 THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
 END IF;
 IF p_table='crm_submission_requests' THEN
  UPDATE public.crm_submission_requests SET status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,moderation_status=CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END WHERE id=p_id;
 ELSE
  EXECUTE format('UPDATE public.%I SET aprovado=$1,moderation_status=$2 WHERE id=$3',p_table) USING p_approve,CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,p_id;
 END IF;
 IF p_table='plataformas_sugeridas' THEN UPDATE public.plataformas_sugeridas SET aprovado_adm=p_approve WHERE id=p_id; END IF;
END $function$
;
COMMENT ON COLUMN public.freelancers_sugeridos.foto_url IS 'Photo submitted voluntarily; public URL shown only for approved profiles after moderation';
