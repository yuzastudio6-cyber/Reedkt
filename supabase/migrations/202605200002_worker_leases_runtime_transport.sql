-- RP-FIX-11 local-only readiness migration.
-- Do not deploy until worker lease/runtime transport behavior is reviewed in local/staging.

create table if not exists public.worker_leases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  job_batch_id uuid references public.job_batches(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  worker_id text not null,
  worker_kind text not null,
  status text not null default 'claimed'
    check (status in ('available', 'claimed', 'active', 'renewed', 'released', 'completed', 'failed', 'expired', 'stale', 'cancelled')),
  lease_token text not null,
  claimed_at timestamptz not null default now(),
  heartbeat_at timestamptz,
  expires_at timestamptz not null,
  released_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  claim_attempt_count integer not null default 1 check (claim_attempt_count >= 0),
  renewal_count integer not null default 0 check (renewal_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.worker_leases is
'Local-only RP-FIX-11 readiness table for future worker job leases. Real claims must run through backend/service-role transaction logic.';
comment on column public.worker_leases.lease_token is
'Opaque lease ownership token. Do not expose through frontend routes or logs.';

create table if not exists public.backend_runtime_messages (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  job_id uuid references public.jobs(id) on delete set null,
  job_batch_id uuid references public.job_batches(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  edit_plan_id uuid references public.edit_plans(id) on delete set null,
  target text not null,
  transport_mode text not null,
  safety_level text not null,
  status text not null default 'created'
    check (status in ('created', 'sent', 'received', 'acknowledged', 'failed', 'expired', 'cancelled')),
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  error_payload jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.backend_runtime_messages is
'Local-only RP-FIX-11 readiness table for future backend runtime transport envelopes. Payloads must not contain secrets, signed URLs, or provider credentials.';

create table if not exists public.job_claim_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  worker_id text,
  worker_kind text,
  claim_result text,
  reason text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.job_claim_attempts is
'Audit table for future job lease claim attempts. It should contain status metadata only, never provider secrets or service credentials.';

create index if not exists worker_leases_job_id_idx on public.worker_leases(job_id);
create index if not exists worker_leases_status_idx on public.worker_leases(status);
create index if not exists worker_leases_expires_at_idx on public.worker_leases(expires_at);
create unique index if not exists worker_leases_active_job_uidx
on public.worker_leases(job_id)
where status in ('claimed', 'active', 'renewed');

create index if not exists backend_runtime_messages_request_id_idx on public.backend_runtime_messages(request_id);
create index if not exists backend_runtime_messages_job_id_idx on public.backend_runtime_messages(job_id);
create unique index if not exists backend_runtime_messages_idempotency_key_uidx
on public.backend_runtime_messages(idempotency_key)
where idempotency_key is not null;

create index if not exists job_claim_attempts_job_id_idx on public.job_claim_attempts(job_id);
create index if not exists job_claim_attempts_created_at_idx on public.job_claim_attempts(created_at);

alter table public.worker_leases enable row level security;
alter table public.backend_runtime_messages enable row level security;
alter table public.job_claim_attempts enable row level security;

create policy worker_leases_select_member
on public.worker_leases for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy backend_runtime_messages_select_member
on public.backend_runtime_messages for select
to authenticated
using (workspace_id is not null and public.is_workspace_member(workspace_id));

create policy job_claim_attempts_select_member
on public.job_claim_attempts for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id = job_claim_attempts.job_id
      and public.is_workspace_member(j.workspace_id)
  )
);

revoke all on table public.worker_leases from public, anon;
revoke all on table public.backend_runtime_messages from public, anon;
revoke all on table public.job_claim_attempts from public, anon;

grant select on table public.worker_leases to authenticated;
grant select on table public.backend_runtime_messages to authenticated;
grant select on table public.job_claim_attempts to authenticated;

grant select, insert, update, delete on table public.worker_leases to service_role;
grant select, insert, update, delete on table public.backend_runtime_messages to service_role;
grant select, insert, update, delete on table public.job_claim_attempts to service_role;
