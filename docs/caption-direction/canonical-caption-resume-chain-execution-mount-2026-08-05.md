# Canonical Caption resumed-chain execution mount — 2026-08-05

Milestone: Post-CAP-20 canonical work-item continuation

Status: `source_complete_waiting_for_actual_owner_evidence`

## Outcome

The canonical Caption work-item executor now consumes the current exact head of
an already-persisted HQ-mediated support-resume chain. Previously it reread only
the initial Caption call/result pair. A job that correctly paused for Visual
Intelligence, Track All, SoundSync, or B-roll and later resumed could therefore
remain stuck at its original `needs_followup` result when the canonical work
item retried.

The additive
`canonical-specialist-support-resume-chain-reread-v1` read model resolves that
gap without changing the frozen shared resume file or creating another owner.

## Contracts added or changed

- Added:
  `canonical-specialist-support-resume-chain-reread-v1` in a separate public
  type file.
- Preserved byte-for-byte:
  `src/types/canonical-specialist-support-resume.ts`, SHA-256
  `d2b6128e26bf0a12d66d017f3f6608fc4656fddfa818dbb9a7bfdec8a44137e5`.
- No existing wire identity or persisted record shape changed.

## Exact behavior

Starting only from the immutable initial Caption call ref, the reader:

1. rereads the create-only initial call/result pair;
2. selects only the first deterministic support request;
3. rereads its authenticated owner projection;
4. deterministically derives the expected resumed call;
5. rereads the exact create-only resume record by that derived call;
6. rereads the resumed call/result pair and compares it with the record;
7. repeats up to the existing 32-step bound; and
8. returns the current persisted head as completed, pending owner projection,
   pending resume record, or terminal non-completed.

It never calls an owner, runs the specialist, writes a projection or resume,
dispatches a peer, mutates the timeline, or grants execution authority.

The canonical Caption work-item executor now binds its execution receipt to the
current completed resumed call/result when one exists. If only an owner
projection exists, the job remains `needs_followup`; it cannot fabricate a
resume record or completion.

## Existing owners reused

- the canonical specialist call/result and resume repository;
- the existing authenticated owner projections;
- the existing HQ-mediated sequential resume owner;
- the canonical Caption work-item execution service;
- the approved snapshot, work graph, manifest, estimate, reservation, and
  artifact-QA owners.

## Duplicate owners avoided

No peer dispatcher, Orchestra, owner adapter, work scheduler, artifact writer,
provider runner, QA approver, billing path, or delivery path was added.

## Tests run

- `npm run smoke:captions-specialist-canonical-resume-read`
- `npm run smoke:canonical-specialist-support-resume`
- `npm run smoke:canonical-caption-specialist-execution`
- `npm run smoke:captions-specialist-source-integration-aggregate`
- `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck:server`
- `npm run lint`
- `npm run build`

## Tests passed

- Frozen Caption resume compatibility: 27 assertions.
- Canonical resume service: 62 checks.
- Canonical Caption execution: 28 checks.
- Caption source integration aggregate: 29/29 suites.
- Server typecheck, full lint, and 2,967-module build.

## Tests failed and repairs made

The first aggregate correctly rejected an edit to the hash-frozen shared resume
public type. The new read contract was moved into its own additive file; the
frozen file returned to its exact published SHA-256 and the aggregate passed.

## Media inspected

None. This milestone is source-only and starts no Docker, media, browser,
provider, model, or GPU runtime.

## Visible defects

None applicable; no media was produced.

## Known limitations and scoped blockers

This mount makes resumed canonical jobs finishable, but it does not create the
missing owner evidence. Actual transcript correction, Visual Intelligence,
Track All, SoundSync listening review, B-roll same-scope evidence, rendered
outputs, complete-time postrender visual AI, and independent private review
must still exist in one exact canonical run.

The terminal evidence input reader must next derive the V2 qualification input
from those persisted work, owner, artifact, QA, and review records. Terminal
qualification remains 0/41 jobs and 0/9 gates until that actual run exists.

## Safe work completed

The canonical retry path now follows persisted support continuation instead of
remaining pinned to the initial result. Every authority flag remains false.

## Next milestone

Implement the concrete canonical terminal input reader over the completed work
graph, resumed Caption receipts, owner evidence repositories, asset/QA records,
and output-level review records. It must return null until every required exact
record exists.
