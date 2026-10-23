begin;
alter table public.crm_inngage_match_delivery drop constraint crm_match_five_jobs, drop constraint crm_match_five_scores;
alter table public.crm_inngage_match_delivery add constraint crm_match_card_count check(cardinality(job_ids) between 0 and 5 and cardinality(scores)=cardinality(job_ids));
commit;
