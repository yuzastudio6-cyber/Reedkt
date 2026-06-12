# Worker Runtime Hardening Readiness Matrix

Status: `ready_for_worker_2_dry_run_fixture_plan`.

| Area | Status | Evidence | Blocker | Required Before WORKER-2 | Required Before Internal Beta | Owner | Next Prompt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Job payload schema | `ready_for_worker_2_dry_run_fixture_plan` | `worker-job-payload-schema.md` | None for planning | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |
| Plan snapshot mapping | `ready_for_worker_2_dry_run_fixture_plan` | `worker-plan-snapshot-mapping.md` | None for planning | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |
| Claim/lease contract | `ready_for_worker_2_dry_run_fixture_plan` | `worker-claim-lease-contract.md` | Race-window hardening remains future | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |
| Retry/idempotency | `ready_for_worker_2_dry_run_fixture_plan` | `worker-failure-retry-idempotency-contract.md` | Runtime tests not run | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |
| Service-role boundary | `ready_for_worker_2_dry_run_fixture_plan` | `worker-service-role-hardening-contract.md` | Supabase mutation blocked | Yes | Yes | `SUPABASE_RLS_STORAGE_DATABASE` handoff later | WORKER-2 or Supabase owner gate |
| Artifact write boundary | `ready_for_worker_2_dry_run_fixture_plan` | `worker-artifact-write-hardening-contract.md` | Upload/storage transfer blocked | Yes | Yes | `WORKER_RUNTIME_JOBS` and storage owner later | WORKER-2 |
| Tool-route gate | `ready_for_worker_2_dry_run_fixture_plan` | `worker-tool-route-dispatch-gate.md` | TOOL-ROUTE-0 not complete on this base | Yes | Yes | `TOOL_ROUTE_EXECUTION` | TOOL-ROUTE-0 if needed |
| Observability/QA evidence | `ready_for_worker_2_dry_run_fixture_plan` | `worker-observability-qa-evidence-contract.md` | Runtime QA not run | Yes | Yes | `OBSERVABILITY_AUDIT_COST` handoff later | WORKER-2 |
| Dry-run fixture plan | `ready_for_worker_2_dry_run_fixture_plan` | `worker-dry-run-fixture-plan.md` | Fixture not implemented | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |
| Diagnostics | `ready_for_worker_2_dry_run_fixture_plan` | `worker:runtime-contract-hardening:diagnostics` | None if passing | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |
| Tests | `ready_for_worker_2_dry_run_fixture_plan` | Static validation commands | No worker/route/tool smoke run | Yes | Yes | `WORKER_RUNTIME_JOBS` | WORKER-2 |

Full internal beta remains `blocked_pending_workstream_gates`.
