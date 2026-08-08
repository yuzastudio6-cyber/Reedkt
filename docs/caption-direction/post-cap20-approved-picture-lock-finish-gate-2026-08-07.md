# Post-CAP-20 Approved PictureLock and Caption Finish Gate

Date: 2026-08-07

Status: `source_integration_verified_preterminal_only`

## Outcome

The canonical approved Caption worker no longer treats every projected job as
immediately executable after approval. Fresh V3 work now preserves the required
two-pass lifecycle:

1. early Caption planning, reservation, and blocking jobs may execute from the
   immutable approved package;
2. late Caption resolution, render-spec, repair, recomposition, result
   inspection, and boundary jobs require one exact persisted postapproval
   finish record for their output, scene, approved snapshot, execution package,
   and planning projection.

The record binds the shared `canonical-picture-lock-manifest-v1`, Caption-owned
`caption-dependency-manifest-v2`, and `caption-finish-readiness-v2`. Caption does
not become the PictureLock, timeline, final-render, final-QA, billing, delivery,
or production owner.

## Canonical contracts

- `canonical-caption-postapproval-finish-binding-v1` is the byte-free ref
  injected into an admitted late Caption call.
- `canonical-caption-postapproval-finish-record-v1` is the private create-only
  record containing the exact closed PictureLock, dependency manifest, and
  finish-readiness values.
- `canonical-caption-postapproval-finish-repository-v1` persists and rereads the
  record by the complete immutable scope/package/projection lookup.
- `canonical-caption-postapproval-finish-read-port-v1` is minted only by that
  repository; a structurally similar caller-supplied reader is rejected.

The V3 immutable work item cannot preinject this artifact. The canonical runner
rereads the repository twice, refuses crossed snapshot/output/scene/frame/
MasterTiming/planning/package lineage, and appends only the admitted binding
reference to the specialist call.

## Resume semantics

A missing record is a bounded `JOB_DEPENDENCY_NOT_READY` result with required
gate `canonical_caption_postapproval_finish_binding`. It carries only the
server-derived byte-free lookup. The private specialist qualification
coordinator may persist the exact fixture record and retry; Caption cannot
dispatch another owner or create PictureLock authority itself.

The approved Caption+B-roll source smoke now proves this exact sequence:

- ten baseline early Caption jobs execute before the first finish resume;
- the first of seven late Caption jobs fails closed when no record exists;
- one exact record is persisted and reread;
- all seven late jobs then execute from the same scene-bound record;
- all 17 approved job occurrences replay through the canonical one-job adapter;
- the existing 17-of-41 preterminal approved-execution coverage remains exact;
- the source-contract PictureLock fixture is explicitly not relabeled as
  private qualification, complete-time visual review, or final QA.

An independently blocked scene does not prevent a ready scene from resolving.
A blocked scene, changed create-only record, crossed package, authority
overclaim, inherited object, accessor object, or caller reader fails closed.

## Existing owners reused

- canonical approved snapshot and execution-package owner;
- shared canonical PictureLock contract;
- Caption CAP-07 dependency and finish-readiness contracts;
- canonical transcript postapproval repository;
- canonical one-job adapter and worker-dependency admission;
- canonical private create-only JSON object port;
- existing B-roll approved execution owner;
- StoryTiming/MasterTiming and confirmed-output-frame authority.

No new scheduler, Orchestra, PictureLock owner, transcript owner, B-roll owner,
renderer owner, QA approver, credit owner, or delivery owner was created.

## Verification

- `smoke:canonical-caption-postapproval-finish`: 15 assertions;
- `smoke:canonical-caption-broll-approved-run-harness`: passed, 10 early / 7
  late jobs, one postapproval resume, 17 approved occurrences, 24 catalog job
  types still requiring other approved runs;
- `smoke:canonical-caption-specialist-execution`: 54 checks;
- `smoke:captions-specialist-cap-07`: 31 assertions;
- `smoke:canonical-caption-specialist-planning`: 64 checks;
- `smoke:canonical-caption-source-led-professional-planning`: 28 checks;
- `smoke:canonical-caption-source-led-professional-planning-owner`: 181
  checks across the baseline and 18 advanced source-led profiles;
- server TypeScript check and targeted ESLint: passed.

## Remaining work

This closes the approved-worker PictureLock/finish-readiness source seam. It
does not claim the final specialist status. The next qualification work is to
project additional honest advanced edits into approved packages so the 24
currently uncovered catalog job types can execute with their real authenticated
owner evidence, rendered media, complete-time visual review, independent final
QA, and final per-job qualification records.
