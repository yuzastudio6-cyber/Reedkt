# Job Runtime Schema Audit

## Existing Schema Found

The active job orchestration migration is `supabase/migrations/202605130005_job_orchestration_agent_runs.sql`.

It defines:

- `job_batches`
- `jobs`
- `job_dependencies`
- `job_events`
- `agent_runs`
- `agent_outputs`
- `worker_runtime_configs`
- `worker_heartbeats`
- `job_progress_view`
- `can_run_job(...)`

The schema already includes status enums, worker target, runtime type, retry/attempt fields, idempotency keys, lock fields, scheduled time, timestamps, progress, failure category, dependency records, job events, and worker runtime/heartbeat metadata.

## Types And Services Found

Existing TypeScript types are in `src/types/jobs.ts`. Existing mock services are in `src/backend/services/job-orchestration-service.ts`.

Existing worker skeletons found:

- `src/backend/workers/lyria-worker-skeleton.ts`
- `src/backend/workers/lyria-worker-validation.ts`
- `src/backend/workers/sfx-worker-skeleton.ts`
- `src/backend/workers/sfx-worker-validation.ts`

Missing worker skeletons:

- `src/backend/workers/mock-render-worker-skeleton.ts`
- `src/backend/workers/render-worker-contracts.ts`

## Runtime Gaps

The schema is ready for future backend orchestration, but production runtime is still missing:

- no deployed queue or Cloud Run dispatcher;
- no service-role backend job mutation handler;
- no real worker leasing, locking, heartbeat enforcement, or retry scheduler;
- no render worker skeleton;
- no production credit spend/release/refund transaction around worker completion;
- no provider execution behind backend secret management.

RP-FIX-10 adds mock-safe runtime services and route handlers only. It does not create migrations or deploy workers.
