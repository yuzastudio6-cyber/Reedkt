# Canonical Private Work-Graph Orchestrator

Status: private single-host run-to-blocked and bounded complete-graph evidence

The canonical private work-graph orchestrator advances an approved execution package in immutable dependency order. It uses the canonical single-job adapter and never revives the caller-authored legacy pipeline.

## Route

`POST /v1/edit-executions/packages/:packageRecordId/private-internal-work-graph-runs`

The route requires authenticated workspace access, the internal-service boundary, and an `Idempotency-Key`. The strict body contains only:

- `workspaceId`
- `purpose: run_canonical_private_work_graph`

The caller cannot provide jobs, ordering, tools, operations, outputs, snapshots, reservations, leases, paths, URLs, commands, providers, prices, credits, or billing instructions.

## Scheduling behavior

The orchestrator reloads and revalidates the canonical execution package, derives its exact job/work-item graph, and then repeatedly:

1. selects only jobs whose canonical dependency jobs completed through private artifact, QA, and reconciliation authority;
2. calls the single-job adapter with server-derived project, edit-session, and job identity;
3. records a completed private artifact or a scoped job-capability blocker;
4. leaves descendants of blocked jobs unattempted and marks their exact blocked dependency IDs;
5. persists a credential-free, checksum-protected run response.

Completed job identity is stored independently of a request key by the job adapter. A later work-graph run therefore reuses the completed artifact instead of claiming another lease or executing the tool again. A denied pre-execution dispatch releases its lease so a later run can retry with newly available runtime evidence.

Canonical failure outcomes are explicit: `failed_retry_available`, `failed_user_review_required`, or `completed_recovery_required`. The current run never loops blindly. It continues unrelated dependency-ready branches, blocks only descendants of the failed job, and exposes a same-operation retry only when the immutable work item has remaining `maxAttempts`. A new authenticated run uses a new per-job key, while completed siblings replay their final adapter completion. When the prior execution fence is completed but the adapter record is missing, the new run invokes server-owned evidence recovery before any claim; it never retries the completed operation.

## Current evidence

The authenticated smoke publishes and approves a fresh four-job canonical plan, creates its execution package, and proves:

- caller-selected job lists are rejected;
- the dependency-root snapshot validation job executes and passes private QA/reconciliation;
- a dependency-bound source-trim plan-validation job verifies explicit source/cleanup/meaning authority and persists private QA/reconciliation evidence;
- the next unavailable final-QA tool job is recorded as an exact capability blocker;
- its final-export descendant remains unattempted and is recorded as dependency-blocked;
- HTTP idempotency replays the original run;
- a continuation run reuses the completed root job without duplicate execution;
- provider, public artifact, delivery, customer price/credit, wallet, billing, settlement, deployment, and production permissions remain false.

The prior aggregate smoke baseline publishes and approves a dependency-complete five-job single-caption plan and proves exact topological execution and replay. The caption-track continuation expands the corresponding graph to six jobs—snapshot validation, source-trim validation, two independent libass caption artifacts, trim-authoritative timed Remotion composition, and independent dependency-bound FFprobe final QA. The focused caption-track lifecycle is verified through final QA, replay, and private download; this slice does not claim a fresh post-change rerun of the aggregate terminal-assembly/revision branch.

The grouped D3-to-ECharts fixture also proves failure isolation and bounded recovery: D3 first records an idempotent pre-execution runtime failure while unrelated work continues and ECharts remains dependency-blocked; after the runtime becomes available, a new work-graph run consumes only attempt two for D3, reuses already completed work, and then completes ECharts.

## Boundaries

This proves both honest run-to-blocked behavior and one bounded, dependency-complete private graph against generated fixture media. It is not a general real-user upload-to-review claim. The separate terminal service assembles that bounded graph for private internal review only. Arbitrary rich capability-plan compilation, browser continuation from a revision into replacement planning, deployed real-user storage and workers, providers, Supabase, billing, public delivery, and production promotion remain gated.

## Verification

- `npm run typecheck:server`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run qa:internal-pipeline`
