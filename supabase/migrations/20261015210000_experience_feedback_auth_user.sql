-- Feedback pode ser enviado mesmo sem concluir o perfil. Auth é a origem da identidade.
alter table public.crm_experience_feedback
  drop constraint if exists crm_experience_feedback_user_id_fkey;
alter table public.crm_experience_feedback
  add constraint crm_experience_feedback_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

create or replace function public.crm_submit_experience_feedback(p_rating smallint)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid := auth.uid();
        v_now timestamptz := now();
begin
 if v_uid is null then raise exception 'Faça login para avaliar.'; end if;
 if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'A nota deve estar entre 1 e 5.'; end if;
 insert into public.crm_experience_feedback(user_id,rating,updated_at)
 values (v_uid,p_rating,v_now)
 on conflict (user_id)
 do update set rating=excluded.rating,updated_at=excluded.updated_at;
 return jsonb_build_object('ok',true,'rating',p_rating,'updated_at',v_now);
end;
$function$;
revoke all on function public.crm_submit_experience_feedback(smallint) from public,anon;
grant execute on function public.crm_submit_experience_feedback(smallint) to authenticated,service_role;
