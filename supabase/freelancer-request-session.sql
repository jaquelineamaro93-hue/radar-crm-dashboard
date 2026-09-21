CREATE TRIGGER request_progress_session BEFORE UPDATE OF status ON public.crm_freelancer_requests FOR EACH ROW EXECUTE FUNCTION crm_private.validate_community_write();
