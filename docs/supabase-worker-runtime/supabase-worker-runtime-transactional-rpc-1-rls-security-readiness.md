# Supabase Worker Runtime Transactional RPC 1 RLS Security Readiness

RLS/security readiness: `blocked_pending_supabase_worker_rpc_migration_safety_packet`

## Required Future Security Rules

- Frontend clients must not access service-role mutation paths.
- Anonymous and authenticated clients must not claim jobs directly.
- Track A job mutations must go through a narrow worker runtime RPC/backend path.
- Future RLS policies must preserve workspace/project read scoping while denying normal-user worker mutation.
- Event payloads must be sanitized before persistence.
- Artifact references must stay private and metadata-only.
- Signed URL source-of-truth is disallowed.
- Public artifact references are disallowed.
- Future migration work must define the policies, grants, RPC security model, and test plan before SQL is executed.
- No broad service-role handler may be introduced.
- No arbitrary table writes may be added.

## Current Evidence

Existing readiness migrations enable RLS on generic tables, revoke public and anon access, provide authenticated select policies, and grant service_role writes. That is useful source evidence but not a completed Track A private E2E transactional RPC/RLS design.

## Required Future Review

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 must produce a migration safety packet that reviews function schema placement, grants, RLS policy shape, service-role-only mutation boundary, event redaction, artifact privacy, and rollback safety before any migration is created or applied.

## Decision Values

Supabase update required: future_migration_required

Supabase update status: planning_only

Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_migration_safety_packet

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
