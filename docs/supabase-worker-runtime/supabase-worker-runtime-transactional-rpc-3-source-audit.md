# Supabase Worker Runtime Transactional RPC 3 Source Audit

## Confirmed Source Chain

- #520 merged at `2fa54b4de1db19be85400eb6ca3af3374e0d254d` and records the Worker Runtime transactional contract blocker.
- #525 merged at `10c6fee6fe52cbf4379369c55b52140cdd7f36b5` and records migration readiness planning.
- #530 merged at `a4b71bcef3567e5ae00f217d92110fcd828374e0` and records migration safety plus RPC-3 readiness.

## Current Repo Evidence

- Existing generic worker readiness objects include `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, `worker_job_claims`, `api_idempotency_keys`, `can_claim_worker_job`, and `active_worker_claim_exists`.
- Existing RPC-2 packet docs define the proposed `worker_jobs`, `worker_job_events`, `worker_job_artifacts`, service-role boundary, Secret Manager-only credential policy, and non-executable SQL draft.
- `supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql` was not present on the #530 base and is used as the single static migration candidate in RPC-3.
- No `.github` workflow files were present on the #530 base, so no automatic migration deployment workflow was detected.

## Preserved Blocker

The blocker remains: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
