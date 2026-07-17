# Canonical Private Work-Graph Orchestrator

Status: private single-host durable package queue, run-to-blocked, resource-aware wave scheduling, and bounded complete-graph evidence

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

Before scheduling, it derives one content-addressed durable queue definition
from the exact package, approved snapshot, work graph, and frozen placement
manifest. It creates or reopens a tenant/package-scoped private aggregate and
recovers terminal completed outcomes without calling their adapters again. It
then repeatedly:

1. selects a stable dependency-ready wave in canonical package order;
2. applies both the global four-job cap and the exact worker-lane cap;
3. claims the exact queue entry only when its dependencies, approved schedule,
   worker type, placement, private capability, and approved attempt allowance
   pass;
4. starts only claimed entries with server-derived private execution evidence
   and calls the single-job adapter with server-derived project, edit-session,
   and job identity;
5. heartbeats the opaque claim while the bounded adapter operation is active;
6. waits for every sibling in the wave to settle before advancing graph state,
   so one unexpected failure cannot abandon still-running siblings;
7. records a terminal completed outcome or releases the claim for an approved
   retry, scoped capability blocker, or unexpected failure;
8. leaves descendants of blocked jobs unattempted and marks their exact blocked
   dependency IDs; and
9. persists a credential-free, checksum-protected response with the queue and
   placement hashes, deterministic wave hashes, configured caps, and observed
   in-process orchestrator-task concurrency.

The fixed local/private limits are 20 API tasks, four CPU-analysis tasks, one
GPU task, two render tasks, four QA tasks, and one readiness task, all under the
stricter global cap of four. These are admission limits, not a deployed Google
Cloud autoscaling policy or performance SLA.

The queue aggregate is stored by atomic private-file replacement with an outer
checksum, content hash, entry hashes, nested claim/completion/release hashes,
and an append-only hash-chained event history. A claim returns a random opaque
credential only to the in-process worker controller. The aggregate stores its
SHA-256 digest for timing-safe verification, never the plaintext credential or
worker identity. Completed entries are terminal. An expired claim is recovered
to queued state and fenced before a fresh credential can claim the next
approved attempt.

A later work-graph run reloads terminal outcomes from this package-scoped
aggregate and removes those jobs from the scheduler before any adapter call.
The adapter's existing idempotent completion authority remains a second
execution boundary; the queue no longer relies on replaying every completed
adapter merely to reconstruct graph state. A denied pre-execution dispatch or
scoped attempt failure releases its claim so a later run can retry only while
the immutable `maxAttempts` allowance remains.

Canonical failure outcomes are explicit: `failed_retry_available`,
`failed_user_review_required`, or `completed_recovery_required`. One graph run
never loops blindly. It continues unrelated dependency-ready branches, blocks
only descendants of the failed job, and exposes a same-operation retry only
when the immutable work item has remaining `maxAttempts`. The authenticated
private-preparation coordinator may start a bounded follow-up run only while an
exact `failed_retry_available` outcome still carries remaining approved
attempts. Each follow-up uses a new server-owned run/per-job idempotency key;
completed siblings are recovered from the durable package queue without
adapter execution. The coordinator is
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

The dedicated durable-queue smoke independently proves dependency, capability,
schedule, worker-type, and maximum-attempt admission; concurrent duplicate
claim exclusion inside one process; timing-safe heartbeat/completion/release;
read-only terminal replay; restart recovery; expired-claim fencing; terminal
completion immutability; tenant isolation; event-chain verification; and
checksum plus recomputed-hash authority-tamper rejection. The route-level
planning smoke proves the v3 work-graph response exposes only aggregate queue
evidence and no claim credential, credential digest, or worker-identity hash.
The exact-code complete tool-dispatch smoke reverified all 50 proven identities
and its terminal eight-job review graph with eight completed, zero queued, and
zero leased queue entries. A fresh service recovered all eight terminal jobs
with no new claim or scheduler execution.

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

The post-queue exact-code V3 rerun passed in `409,611 ms`. Pass one claimed six
jobs and preserved five terminal completions around one retryable chunk
failure. Pass two recovered those five completions without adapter execution,
claimed only the remaining three jobs, and finished the graph. Across both
passes, scheduler execution count and durable claim count were both nine. The
final aggregate contained eight completed, zero queued, and zero leased jobs.
The 31,730,928-byte 660-frame 4K H.264/AAC master passed independent QA,
replay, private download, and PCM continuity checks.

## Boundaries

This proves honest run-to-blocked behavior, deterministic resource-aware
single-host admission, immutable snapshot-bound placement, private same-host
restart recovery, and one bounded dependency-complete private graph against
generated fixture media. Process-local serialization plus atomic file
replacement does not prove cross-process compare-and-swap, a distributed
transaction, cloud service identity, or Google Cloud dispatch. It is not a
general real-user upload-to-review claim. The separate terminal service
assembles that bounded graph for private internal review only. Arbitrary rich
capability-plan compilation, browser continuation from a revision into
replacement planning, deployed real-user storage and workers, providers,
Supabase, billing, public delivery, and production promotion remain gated.

## Verification

- `npm run typecheck:server`
- `npm run smoke:canonical-private-package-work-queue`
- `npm run smoke:edit-planning-authority`
- `./node_modules/.bin/tsx server/smoke/canonical-private-resource-wave-scheduler-smoke.ts`
- `./node_modules/.bin/tsx server/smoke/canonical-private-long-form-execution-smoke.ts`
  currently exposes a pre-execution historical-fixture mismatch: its eight
  three-second inputs expect 720 frames while the current mock planner emits
  360. It does not reach queue execution and is not counted as passing queue
  evidence.
- `REEDITPRO_SOURCE_SLICE_LONG_FORM_PROOF=1 ./node_modules/.bin/tsx server/smoke/canonical-private-long-form-execution-smoke.ts`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run qa:internal-pipeline` — post-placement-authority full run passed
  27/27 stages from `2026-07-16T23:04:14.764Z` through
  `2026-07-16T23:33:00.326Z` in `1,725,562 ms`, including the standalone
  authenticated maximum-eight-source journey, bounded approved-attempt
  recovery, and all 50 versioned tool identities
- `npm run qa:internal-pipeline` — post-durable-queue exact-code full run passed
  28/28 stages from `2026-07-17T00:53:09.135Z` through
  `2026-07-17T01:28:42.983Z` in `2,133,848 ms`, including queue restart
  recovery, the three-source and professional-color executions, streamed UHD
  Remotion output, all 50 versioned tool identities, and the accepted signed-in
  maximum-eight-source private review

The measured duration is a local correctness-regression result. It is not a
real-program editing benchmark, deployed worker-concurrency result, cloud ETA,
or customer SLA.
