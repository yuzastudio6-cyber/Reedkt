# WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2

Track A private E2E worker Supabase RPC/schema readiness.

## Goal

Plan the implementation readiness for the transactional worker contract defined by WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1. Do not execute workers, claims, leases, routes, tools, providers, media processing, Supabase mutations, SQL, migrations, service-role handlers, signed URLs, public artifacts, final render/export, or beta/production unlocks unless a future prompt explicitly authorizes that scope.

## Required Source Evidence

- WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision: `completed_contract_completion_plan_blocked_pending_rpc_schema_implementation`.
- Worker runtime transactional contract readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`.
- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 readiness: `ready_for_migration_readiness_planning`.
- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 decision: `completed_migration_readiness_planning_blocked_pending_migration_safety_packet`.
- Worker runtime transactional contract readiness: `blocked_pending_supabase_worker_rpc_migration_safety_packet`.
- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 readiness: `ready_for_migration_safety_packet`.
- WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_supabase_rpc_schema_safety_packet`.
- WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_transactional_contract_implementation`.
- WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_supabase_rpc_schema_implementation`.
- TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_transactional_contract`.
- INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_worker_transactional_contract`.
- Internal beta unlocked: false.

## Required Output

Create a readiness packet for the future RPC/schema implementation path only after SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 completes migration safety. Preserve the operation family `tracka_private_e2e_revalidation`, the planned operation names, the service-role boundary, the no broad service-role handler rule, and the public/signed/final/internal-beta blockers.

## Current Blocker

This prompt remains blocked pending SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 -- Migration safety packet.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
