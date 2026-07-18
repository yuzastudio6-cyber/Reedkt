# Professional Long-Form Object Execution Plan — 2026-07-18

Status: `approved_snapshot_binding_contract_ready_persistence_and_execution_blocked`

## Outcome

ReEditPro now has an additive server-owned planning contract for professional
long-form edits that do not fit the current 128-second private source-slice
execution ceiling. The profile is:

`canonical_professional_4k_object_chunk_graph_6h_v1`

It accepts exact confirmed-frame, approved-estimate, timing, reservation, and
source-range authority and produces a snapshot-independent content seed, a
content-addressed object-chunk plan, and an immutable dependency graph. A
separate server-only bridge now verifies that the exact seed, plan, estimate,
timing, reservation, controller input, and expanded child graph belong to one
approved snapshot. It does not persist those components into the canonical
approval service, raise the existing V3 execution limit, silently activate a
worker, or claim that long media was rendered.

## Bounded Professional Capacity

The versioned planning ceiling is:

- 129 seconds through six hours;
- exact 24000/1001, 24, 25, 30000/1001, 30, 50, 60000/1001, or 60 fps;
- one through 512 approved source ranges;
- two through 124 balanced technical chunks;
- 45 through 180 seconds per technical chunk, targeting 120 seconds;
- no more than 256 expanded canonical work items and 128 dependencies on any
  one work item;
- even confirmed output dimensions no larger than the universal 3840x2160
  pixel ceiling; and
- one runtime region with no cross-region media copy.

Those are plan bounds, not upload-count, workspace-storage, customer-duration,
or production-entitlement promises. Raw uploads may contain more material than
the exact ranges selected into one approved plan.

## Professional Invariants

- Source and timeline ranges are gap-free, overlap-free, frame-exact, and
  duration preserving.
- Approved hard cuts remain editorial boundaries. A technical object split
  inside one source is labeled `continuous_technical_split` and cannot become
  an invented cut or transition.
- Every chunk has a region-bound create-only object identity and stores no
  signed URL as canonical truth.
- Every render chunk has an independent QA work item.
- Finalization depends on every chunk QA result, exact Master Timing, one
  continuous program-audio mix, and cross-chunk color-continuity QA.
- Required final assets cannot use placeholders.
- Compatible object mezzanines may be concatenated; incompatibility blocks
  instead of silently starting an unapproved full-program re-encode.
- The original approved 4K estimate and reservation are reused. No second
  export estimate or charge is created.
- Attempt-level internal production cost remains separate from customer price,
  customer credits, ReEditPro service fee, wallet state, and billing.

## Focused Evidence

`npm run smoke:professional-long-form-object-plan` passes 26 adversarial
checks. The exact 30-minute fixture contains:

- 24 approved source ranges;
- 54,000 frames at 30 fps;
- 15 balanced object chunks;
- 37 immutable required work items; and
- plan authority hash
  `aee0e350833247eca5057aaf8f6e77803fb2b783098245a307f1236d61afcddf`.

The maximum-capacity fixture separately plans six hours at 60 fps across 512
approved ranges, 1,296,000 frames, and 124 object chunks. That ceiling expands
to 255 child work items: 124 render items, 124 independent QA items, and seven
global audio/color/timing/finalization items. The finalizer has 127
dependencies, so the graph remains inside the existing 256-work-item and
128-dependency canonical limits. A fractional-rate
fixture preserves an exact 24000/1001 time base. Mutations reject duration over
six hours, more than 512 ranges, time-base mismatch, output above the UHD pixel
ceiling, timeline gaps, cross-region objects, a second export charge, changed
chunk lineage, and self-promotion to production authority.

`npm run smoke:professional-long-form-snapshot-bridge` passes 22 additional
checks. The six-hour fixture binds plan seed
`de8deb17a7b255d3591abc54917c009d7078de350faffa17fb82c2eda7d9fa6b`
to bridge authority
`ece9106af3f9b74f5a21bb5556f778fd4f28e889a2a8199f114ff6fe0499b0f7`.
It rejects snapshot, seed, controller, blob-reference, estimate, timing,
reservation, child-graph, and persisted-manifest substitution. A new approval
may reuse the same content seed, but it receives distinct snapshot and plan
authority.

The planner source imports no Google Cloud, Supabase, Stripe, HTTP, child
process, environment, or network-fetch activation path.

## Current Aggregate Evidence

The exact-code `npm run qa:internal-pipeline` v16 aggregate passed all `36/36`
stages with exit code `0`. It started at `2026-07-18T05:21:30.437Z`, finished
at `2026-07-18T05:49:59.399Z`, and completed in `1,708,962 ms`. The long-form
plan passed in `402 ms`, and the new approved-snapshot bridge passed in
`682 ms`.

The remaining stages reverified exactly 50 canonical tool lifecycles and 50
job adapters, the crash-consistent package lifecycle, bounded three-source
media execution, professional color execution, UHD Remotion streaming, all 11
named-edit browser tests, and the accepted maximum-eight-source private review.
That review completed 27 jobs and produced the same authenticated sixteen-second
`3840x2160` artifact with SHA-256
`584cdd265fc32d81ca70f5f08420bf65ebfac998a1d4db38fb94efe5aa847505`.

Those media stages exercise their existing bounded fixtures. They do not turn
the 30-minute or six-hour planning fixtures into long-form execution evidence.

## Prior Aggregate Evidence

The fresh exact-code `npm run qa:internal-pipeline` v15 aggregate passed all
`35/35` stages with exit code `0`. It started at
`2026-07-18T04:27:10.498Z`, finished at `2026-07-18T04:55:52.877Z`, and
completed in `1,722,379 ms`. The long-form planning stage passed its then-current 24
adversarial checks in `457 ms`; the remaining stages reverified the existing
local/private pipeline, including exactly 50 canonical tool lifecycles and job
adapters, bounded three-source media execution, professional color execution,
UHD Remotion streaming, the 11-test named-edit browser journey, and the maximum
eight-source private review.

That v15 run remains historical pre-approved-snapshot-bridge evidence.

## Explicit Boundary

This slice did not process a 30-minute video. It performed no upload, media
decode, render, audio mix, color transform, object-store call, database call,
Google Cloud action, provider call, customer credit operation, billing action,
deployment, public delivery, Motion Studio/MS-001 work, or Edit
Preference/Edit Reference work.

`frameExactPlanningContractReady` and
`approvedSnapshotBindingContractReady` are true. Canonical seed-component
persistence, server-loaded controller persistence, child-job derivation,
object persistence, chunk runners, continuous-audio execution, cross-chunk
color QA, finalizer execution, distributed database, live Google Cloud,
staging, product, and production readiness all remain false.

## Next Required Evidence

1. Persist the exact seed component and controller input through the canonical
   plan-publication/approval service, then derive the bounded child jobs from
   that server-loaded authority without touching the separately owned
   Preference implementation.
2. Add object-backed chunk, QA, continuous-audio, color-continuity, and
   finalization job adapters with exact attempt-cost evidence.
3. Execute a representative 30-minute, many-source 4K private corpus and prove
   restart/replay, frame/audio/color continuity, bounded memory/disk use,
   authenticated review, and reuse of the original estimate.
4. Repeat against reviewed distributed database and Google Cloud staging
   infrastructure with service identity, object residency, observability,
   cancellation, orphan cleanup, and p50/p95 evidence.

Until those gates pass, this capability is a professional-scale plan contract,
not professional-scale media execution.
