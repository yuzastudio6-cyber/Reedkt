-- ReEditPro beta readiness evidence packets.
-- Created for evidence-driven tool/beta readiness gates.
-- Do not run against production until local/staging migration, RLS, storage, security, billing, and launch-owner review pass.

create table if not exists public.beta_readiness_evidence_packets (
  id text primary key,
  workspace_id text not null,
  project_id text,
  idempotency_key text not null,
  created_by_user_id text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint beta_readiness_evidence_packets_id_nonempty check (length(trim(id)) > 0),
  constraint beta_readiness_evidence_packets_workspace_id_nonempty check (length(trim(workspace_id)) > 0),
  constraint beta_readiness_evidence_packets_idempotency_key_nonempty check (length(trim(idempotency_key)) > 0),
  constraint beta_readiness_evidence_packets_evidence_object check (jsonb_typeof(evidence) = 'object')
);

comment on table public.beta_readiness_evidence_packets is
'Append-only beta readiness evidence packets for backend evaluation. This table does not enable beta, run tools, spend credits, or approve production by itself.';

comment on column public.beta_readiness_evidence_packets.idempotency_key is
'Backend idempotency key. Duplicate submissions replay the first evidence packet and must not create duplicate approvals.';

comment on column public.beta_readiness_evidence_packets.evidence is
'Sanitized evidence packet for beta readiness evaluation. Must never contain secrets, raw prompts, service-role keys, API keys, credentials, or signed URLs.';

create index if not exists idx_beta_readiness_evidence_packets_created_at
  on public.beta_readiness_evidence_packets(created_at);

create index if not exists idx_beta_readiness_evidence_packets_workspace_created_at
  on public.beta_readiness_evidence_packets(workspace_id, created_at);

create unique index if not exists idx_beta_readiness_evidence_packets_workspace_idempotency
  on public.beta_readiness_evidence_packets(workspace_id, idempotency_key);

alter table public.beta_readiness_evidence_packets enable row level security;

-- Inserts and reads are intentionally backend/service-role only for now.
-- No authenticated insert/update/delete/select policy is created in this skeleton migration.;
