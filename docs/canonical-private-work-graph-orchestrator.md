# Canonical Private Work-Graph Orchestrator

Status: private single-host run-to-blocked, resource-aware wave scheduling, and bounded complete-graph evidence

The canonical private work-graph orchestrator advances an approved execution package in immutable dependency order. It uses the canonical single-job adapter and never revives the caller-authored legacy pipeline.

## Route

`POST /v1/edit-executions/packages/:packageRecordId/private-internal-work-graph-runs`

The route requires authenticated workspace access, the internal-service boundary, and an `Idempotency-Key`. The strict body contains only:

- `workspaceId`
- `purpose: run_canonical_private_work_graph`

The caller cannot provide jobs, ordering, tools, operations, outputs, snapshots, reservations, leases, paths, URLs, commands, providers, prices, credits, or billing instructions.

## Scheduling behavior

Canonical publication freezes the exact per-work-item resource placement in
the content-addressed `canonical-tool-execution-authority-v2`; its component
reference is committed by the plan and approved snapshot hashes. The
orchestrator reloads and revalidates the canonical execution package, derives
its exact job/work-item graph, and reconciles a job-specific placement manifest
against that immutable authority, the package's exact tool-operation manifest,
current compatible tool evidence, the production registry, and the fixed
worker concurrency policy. The caller cannot choose placement, accelerator,
worker class, or concurrency.

It then repeatedly:

1. selects a stable dependency-ready wave in canonical package order;
2. applies both the global four-job cap and the exact worker-lane cap;
3. starts only entries with server-derived private execution evidence and calls
   the single-job adapter with server-derived project, edit-session, and job
   identity;
4. waits for every sibling in the wave to settle before advancing graph state,
   so one unexpected failure cannot abandon still-running siblings;
5. records a completed private artifact or a scoped job-capability blocker;
6. leaves descendants of blocked jobs unattempted and marks their exact blocked
   dependency IDs; and
7. persists a credential-free, checksum-protected response with the placement
   hash, deterministic wave hashes, configured caps, and observed in-process
   orchestrator-task concurrency.

The fixed local/private limits are 20 API tasks, four CPU-analysis tasks, one
GPU task, two render tasks, four QA tasks, and one readiness task, all under the
stricter global cap of four. These are admission limits, not a deployed Google
Cloud autoscaling policy or performance SLA.

Completed job identity is stored independently of a request key by the job adapter. A later work-graph run therefore reuses the completed artifact instead of claiming another lease or executing the tool again. A denied pre-execution dispatch releases its lease so a later run can retry with newly available runtime evidence.

Canonical failure outcomes are explicit: `failed_retry_available`,
`failed_user_review_required`, or `completed_recovery_required`. One graph run
never loops blindly. It continues unrelated dependency-ready branches, blocks
only descendants of the failed job, and exposes a same-operation retry only
when the immutable work item has remaining `maxAttempts`. The authenticated
private-preparation coordinator may start a bounded follow-up run only while an
exact `failed_retry_available` outcome still carries remaining approved
attempts. Each follow-up uses a new server-owned run/per-job idempotency key;
completed siblings replay their final adapter completion. The coordinator is
bounded by the schema's maximum ten attempts and stops immediately for user
review, fallback, exhausted attempts, or post-commit reconciliation. When a
prior execution fence completed but the adapter record is missing, the next run
invokes server-owned evidence recovery before any claim; it never retries the
completed operation.

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

The resource-scheduler smoke reconciles all 50 proven private canonical tool
identities to exact server-owned placement: 28 CPU-analysis, 19 render, and
three GPU identities. It proves a deterministic `1,4,2,1,1` synthetic wave
shape, CPU peak four, render peak two, global peak four, catalog/profile/hash
mutation rejection, recomputed-hash placement-forgery rejection, immutable
snapshot placement binding, and all-settled sibling failure isolation.

The signed-in eight-source long-form execution proves the scheduler on the real
29-job graph: all jobs completed through 15 waves, 12 waves had overlapping
in-process adapter tasks, maximum wave width was three, and observed peak was
three. That metric covers orchestrator tasks, including time waiting on inner
single-host runtime locks. It does not prove simultaneous physical worker
processes, distributed execution, Cloud Run concurrency, or an SLA.

The additive signed-in source-slice v2 run proves recovery across a real
eight-job continuous-source graph above the prior single-source ceiling. One
22-second/660-frame approved source compiled into three exact 220-frame 4K
chunks. A retryable local runtime failure affected one chunk only; the next
graph pass replayed five completed jobs, executed the same signed chunk
operation within its remaining attempt, and then advanced to final merge and
final QA. All eight jobs completed, and the final 660-frame 4K H.264/AAC master
passed independent QA, replay, private-download integrity, and PCM continuity
checks at both technical boundaries. This is still single-host local/private
evidence, not distributed scheduling or a long-program SLA.

The additive V3 run keeps the same eight-job/660-frame authority and recovery
shape while replacing the final full-program Remotion encode with exact FFmpeg
compatibility preflight, H.264 stream-copy, and one continuous approved-source
audio encode. A fresh run completed in 379,285 ms, preserved one failed started
chunk attempt as ReEditPro-absorbed internal cost, verified four completed cost
records, and bound all five evidence hashes into terminal private review. This
remains local in-process/single-host evidence; it is not physical or cloud
worker concurrency, a production scheduler, or an SLA.

## Boundaries

This proves honest run-to-blocked behavior, deterministic resource-aware
single-host admission, immutable snapshot-bound placement, and one bounded
dependency-complete private graph against generated fixture media. It is not a
general real-user upload-to-review claim. The separate terminal service
assembles that bounded graph for private internal review only. Arbitrary rich
capability-plan compilation, browser continuation from a revision into
replacement planning, deployed real-user storage and workers, providers,
Supabase, billing, public delivery, and production promotion remain gated.

## Verification

- `npm run typecheck:server`
- `./node_modules/.bin/tsx server/smoke/canonical-private-resource-wave-scheduler-smoke.ts`
- `./node_modules/.bin/tsx server/smoke/canonical-private-long-form-execution-smoke.ts`
- `REEDITPRO_SOURCE_SLICE_LONG_FORM_PROOF=1 ./node_modules/.bin/tsx server/smoke/canonical-private-long-form-execution-smoke.ts`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run qa:internal-pipeline` — post-placement-authority full run passed
  27/27 stages from `2026-07-16T23:04:14.764Z` through
  `2026-07-16T23:33:00.326Z` in `1,725,562 ms`, including the standalone
  authenticated maximum-eight-source journey, bounded approved-attempt
  recovery, and all 50 versioned tool identities

The measured duration is a local correctness-regression result. It is not a
real-program editing benchmark, deployed worker-concurrency result, cloud ETA,
or customer SLA.
