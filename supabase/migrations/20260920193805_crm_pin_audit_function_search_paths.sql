ALTER FUNCTION public.update_updated_at_column() SET search_path='';
ALTER FUNCTION public.set_audit_user() SET search_path='';
CREATE OR REPLACE FUNCTION public.audit_trigger_func() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 INSERT INTO public.audit_log(table_name,record_id,operation,old_values,new_values,changed_by,changed_at)
 VALUES(TG_TABLE_NAME,COALESCE(NEW.id,OLD.id),TG_OP,
 CASE WHEN TG_OP='DELETE' THEN row_to_json(OLD) ELSE NULL END,
 CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW) ELSE NULL END,
 auth.uid(),CURRENT_TIMESTAMP);
 RETURN COALESCE(NEW,OLD);
END;
$$;
