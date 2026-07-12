# Canonical Private Work-Graph Orchestrator

Status: private single-host run-to-blocked execution evidence

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

## Boundaries

This is honest run-to-blocked orchestration, not a completed upload-to-review journey. Applying approved trim frames during final composition, dependency-aware final QA, terminal private-review assembly, revision/recovery, browser approval handoff, distributed worker transactions, providers, Supabase, billing, public delivery, and production promotion remain gated.

## Verification

- `npm run typecheck:server`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:private-internal-edit-upload-e2e`
- `npm run qa:internal-pipeline`
