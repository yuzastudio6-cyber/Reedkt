-- ReEditPro production tool execution readiness evidence packets.
-- Created for Milestone 10 paid-production readiness evidence persistence.
-- Do not run against production until local/staging migration, RLS, security, billing, monitoring, and owner review pass.

create table if not exists public.production_tool_execution_readiness_evidence_packets (
  id text primary key,
  workspace_id text not null,
  project_id text not null,
  idempotency_key text not null,
  source_id text not null,
  source_sha text,
  created_by_user_id text,
  readiness_input jsonb not null default '{}'::jsonb,
  readiness_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint production_tool_execution_readiness_evidence_packets_id_nonempty check (length(trim(id)) > 0),
  constraint production_tool_execution_readiness_evidence_packets_workspace_id_nonempty check (length(trim(workspace_id)) > 0),
  constraint production_tool_execution_readiness_evidence_packets_project_id_nonempty check (length(trim(project_id)) > 0),
  constraint production_tool_execution_readiness_evidence_packets_idempotency_key_nonempty check (length(trim(idempotency_key)) > 0),
  constraint production_tool_execution_readiness_evidence_packets_source_id_nonempty check (length(trim(source_id)) > 0),
  constraint production_tool_execution_readiness_evidence_packets_input_object check (jsonb_typeof(readiness_input) = 'object'),
  constraint production_tool_execution_readiness_evidence_packets_report_object check (jsonb_typeof(readiness_report) = 'object')
);

comment on table public.production_tool_execution_readiness_evidence_packets is
'Append-only backend-only paid-production tool execution readiness evidence packets. A row records reviewed evidence and the resulting gate report; it does not deploy, run tools, call Stripe, mutate wallets, or enable production by itself.';
comment on column public.production_tool_execution_readiness_evidence_packets.idempotency_key is
'Backend idempotency key. Duplicate submissions replay the first production readiness evidence packet and must not create duplicate approvals.';
comment on column public.production_tool_execution_readiness_evidence_packets.readiness_input is
'Sanitized production readiness evidence input. Must never contain secrets, raw prompts, service-role keys, API keys, credentials, signed URLs, or private payloads.';
comment on column public.production_tool_execution_readiness_evidence_packets.readiness_report is
'Sanitized production readiness gate report generated from readiness_input.';

create index if not exists idx_prod_tool_exec_readiness_packets_created_at
  on public.production_tool_execution_readiness_evidence_packets(created_at);

create index if not exists idx_prod_tool_exec_readiness_packets_workspace_created_at
  on public.production_tool_execution_readiness_evidence_packets(workspace_id, created_at);

create unique index if not exists idx_prod_tool_exec_readiness_packets_workspace_idempotency
  on public.production_tool_execution_readiness_evidence_packets(workspace_id, idempotency_key);

alter table public.production_tool_execution_readiness_evidence_packets enable row level security;

grant usage on schema public to service_role;
revoke all on table public.production_tool_execution_readiness_evidence_packets from anon;
revoke all on table public.production_tool_execution_readiness_evidence_packets from authenticated;
revoke all on table public.production_tool_execution_readiness_evidence_packets from service_role;
grant select, insert on table public.production_tool_execution_readiness_evidence_packets to service_role;

-- Inserts and reads are intentionally backend/service-role only.
-- No authenticated insert/update/delete/select policy is created in this skeleton migration.
-- Explicit grants are required for Supabase Data API compatibility; this table remains backend-only.
