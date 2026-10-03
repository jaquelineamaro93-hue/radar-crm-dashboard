-- Cover foreign keys used by ownership/claim/request lookups.
create index if not exists idx_freelancer_owners_owner_id
  on crm_private.freelancer_owners (owner_id);

create index if not exists idx_crm_freelancer_claims_freelancer_id
  on public.crm_freelancer_claims (freelancer_id);

create index if not exists idx_crm_freelancer_requests_freelancer_id
  on public.crm_freelancer_requests (freelancer_id);
