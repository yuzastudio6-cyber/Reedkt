# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1

Migration readiness planning for Track A private E2E worker transactional RPC/schema support.

## Goal

Plan the Supabase migration/RLS/RPC readiness path for the Worker Runtime transactional contract. This prompt is readiness planning only unless a future prompt explicitly authorizes SQL, migration creation, local Supabase execution, staging deployment, or production deployment.

## Required Source Evidence

- WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision: `completed_contract_completion_plan_blocked_pending_rpc_schema_implementation`.
- Worker runtime transactional contract readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`.
- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 readiness: `ready_for_migration_readiness_planning`.
- Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## Required Planning Topics

- Track A worker job/claim/lease/event schema requirements.
- Atomic operation family for `claim_tracka_private_e2e_job`, `heartbeat_tracka_private_e2e_job`, `complete_tracka_private_e2e_job`, `fail_tracka_private_e2e_job`, `cancel_tracka_private_e2e_job`, `release_expired_tracka_private_e2e_leases`, and `append_tracka_private_e2e_event`.
- RLS and service-role-only mutation boundaries.
- Append-only event and audit behavior.
- Approved snapshot immutability.
- Private artifact manifest/checksum/QA references without public artifacts or signed URL source-of-truth.
- Secret Manager credential rule and no payload exposure.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
