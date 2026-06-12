# Worker Runtime Source Inventory

Status: `ready_with_warnings_for_worker_1`.

This inventory records existing worker surfaces for audit only. The files listed below were inspected as source material; none were executed by WORKER-0.

| Area | Source | Audit Note |
| --- | --- | --- |
| CLI worker entrypoint | `server/cli/run-worker-job.ts` | Builds a mock-safe service context and calls `runWorkerClaimRunner`; it is an executable entrypoint and remains out of WORKER-0 scope. |
| Worker routes | `server/routes/worker-routes.ts` | Defines claim, heartbeat, release, tool runtime check, tool readiness check, run, and media probe routes behind auth/schema/idempotency boundaries. Route execution remains blocked. |
| Claim service | `server/services/worker-claim-service.ts` | Supports mock claims and Supabase-backed `worker_job_claims`; the TODO for claim race hardening is a WORKER-1 warning. |
| Claim runner | `server/workers/worker-claim-runner.ts` | Collects gates, can return dry-run status, claims jobs, emits events, and invokes handlers only after gates pass. WORKER-0 does not invoke it. |
| Gate checks | `server/workers/worker-gates.ts` | Checks payload shape, no raw chat execution, job status, claimability, approved snapshot, credit reservation, and required tool readiness. |
| Handler router | `server/workers/worker-runtime.ts` | Dispatches to approved snapshot readiness, source media readiness, media probe, basic render smoke, or no-op handlers. |
| Job loader | `server/workers/worker-job-loader.ts` | Loads mock job records or Supabase `jobs` records through the admin client path. |
| Worker schemas | `server/validation/worker-schemas.ts` | Defines request schemas for claim, release, tool checks, run, and media probe routes. |
| Worker events | `server/workers/worker-events.ts` | Sanitizes event payloads and can write `job_events` through the admin client path. |
| Worker result types | `server/workers/worker-result.ts` | Defines gate, event, media probe, and execution result shapes. |
| Observability sanitizer | `server/observability/worker-event-observability.ts` | Wraps `sanitizeLogPayload` for production worker event records. |
| Worker README | `server/workers/README.md` | States the server-only worker/runtime readiness scope and existing mock-safe worker list. |
| Worker claim smoke | `server/smoke/worker-claim-smoke.ts` | Smoke test exists but is not part of WORKER-0 validation because it can exercise worker claim paths. |
| Production orchestration smoke | `server/smoke/production-worker-orchestration-smoke.ts` | Production worker smoke exists as historical validation surface; not run in WORKER-0. |
| Production worker router | `server/workers/production/production-worker-router.ts` | Routes multiple worker families in mock/planning modes and includes many future execution paths that remain blocked. |
| Production worker gates | `server/workers/production/production-worker-gates.ts` | Includes approved snapshot, idempotency, raw prompt, signed URL, secret, registry, credit, artifact, QA, and mode gates. |
| Artifact policy | `server/workers/production/production-worker-artifact-policy.ts` | Blocks forbidden worker payload references and source URL/signed URL style values. |
| Production worker runtime | `server/workers/production/production-worker-runtime.ts` | Existing production worker runtime surface; WORKER-0 records it only. |
| Production worker dispatcher | `server/workers/production/production-worker-dispatcher.ts` | Existing dispatch surface; later WORKER-1 must decide whether and how a dry-run path may use it. |
| Production worker lease manager | `server/workers/production/production-worker-lease-manager.ts` | Existing lease surface; not executed in this prompt. |
| Production worker result writer | `server/workers/production/production-worker-result-writer.ts` | Existing result-writing surface; storage/database mutation remains blocked. |
| Tool readiness runner | `server/workers/tool-readiness-runner.ts` | Performs tool readiness checks; WORKER-0 does not run tool checks. |
| Tool readiness types | `server/workers/tool-readiness-types.ts` | Defines tool readiness result shapes and tool names. |
| Package worker scripts | `package.json` | Contains `worker:run`, `worker:probe-media`, and `docker:worker:*` scripts. WORKER-0 validation intentionally does not run them. |
| Existing worker docs | `docs/worker-dispatch-mock-runtime.md` | Historical worker dispatch planning evidence. |
| Lease docs | `docs/worker-lease-runtime.md`, `docs/worker-lease-runtime-audit.md`, `docs/worker-heartbeat-stale-recovery.md` | Existing claim/lease planning and audit material. |
| Job recovery docs | `docs/job-failure-retry-recovery.md` | Existing retry/recovery planning. |
| Runtime idempotency docs | `docs/runtime-idempotency-plan.md` | Existing idempotency planning. |
| Production worker docs | `docs/production-worker-architecture.md`, `docs/production-worker-runtime-orchestration.md`, `docs/production-worker-gates-policy.md`, `docs/production-worker-idempotency-policy.md`, `docs/production-worker-concurrency-policy.md`, `docs/production-worker-event-log-policy.md` | Existing production worker architecture and policy docs. |
| Draft SQL | `database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql` | Draft-only historical database material; WORKER-0 creates no SQL or migration. |
| SQL tests | `database/test-sql/007_production_worker_runtime_orchestration_tests.sql` | Existing test SQL file; WORKER-0 does not run SQL. |
| Track B route docs | `docs/track-b-route-plan-snapshot-policy.md`, `docs/track-b-route-consumer-policy.md`, `docs/track-b-route-failure-policy.md`, `docs/track-b-route-manifest-handoff.md`, `docs/track-b-route-next-hybrid-compute-phases.md` | Existing route/consumer boundaries relevant to worker handoff; route execution remains blocked. |

## Inventory Conclusion

WORKER-0 found enough source surface to prepare WORKER-1, but the source inventory also confirms why execution must stay blocked: service-role database paths, route dispatch, tool readiness, media probe, render smoke, and production worker router paths all need a dedicated contract hardening and dry-run plan before use.
