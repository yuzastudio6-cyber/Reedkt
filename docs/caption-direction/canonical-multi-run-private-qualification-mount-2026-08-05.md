# Canonical multi-run Caption private-qualification mount — 2026-08-05

Milestone: Post-CAP-20 canonical approved-run evidence and terminal catalog

Status: `source_complete_waiting_on_actual_persisted_run_catalog`

## Outcome

The final internal-qualification source path no longer assumes that one edit
contains every Caption job. A normal approved edit contains only the Caption
jobs selected for its actual scenes and boundaries. The canonical path now:

1. rereads one exact immutable approved execution package;
2. verifies every projected Caption planning artifact from private bytes;
3. rereads artifact QA, reconciliation, the current specialist result head,
   the complete sequential support-resume chain, and exact owner evidence;
4. binds the run to its rendered output, deterministic QA, Caption-owned direct
   inspection of real uploaded-source pixels, complete-time visual review,
   independent final QA, and accepted private-review decision;
5. persists that approved-run record create-only;
6. aggregates several records from one private qualification tenant;
7. requires exact coverage of all 41 supported Caption jobs and all required
   Transcript, Visual Intelligence, Track All, SoundSync, and B-roll records;
8. publishes the final private-internal qualification record only after that
   catalog exists; and
9. embeds the standard `skill-qualification-snapshot-v1` with all 41 jobs
   qualified for `planning` and `private_internal`, while whole-skill and
   production claims remain false in that generic future-Orchestra surface.

The source mount is complete. No actual catalog or terminal qualification
record was published by this milestone because the required real approved runs
have not yet been executed and collected together.

## Files changed

- `src/types/canonical-caption-qualification-run-evidence.ts`
- `src/types/canonical-caption-private-qualification-catalog.ts`
- `src/types/canonical-caption-private-internal-qualification.ts`
- `server/services/canonical-caption-qualification-run-evidence-reader.ts`
- `server/services/canonical-caption-private-qualification-catalog-service.ts`
- `server/services/canonical-caption-private-internal-qualification-service.ts`
- `server/services/canonical-caption-private-qualification-composition.ts`
- `server/services/canonical-caption-shared-owner-private-composition.ts`
- focused source smokes and the Caption source-integration aggregate

## Contracts added or changed

- historical `canonical-caption-qualification-run-evidence-v1` remains
  decodable but is not terminally eligible;
- `canonical-caption-direct-visual-inspection-evidence-v1`
- `canonical-caption-direct-visual-inspection-repository-v1`
- `canonical-caption-qualification-run-evidence-v2`
- `canonical-caption-qualification-run-evidence-repository-v2`
- `canonical-caption-qualification-run-evidence-assembly-v2`
- `canonical-caption-private-qualification-catalog-request-v1`
- `canonical-caption-private-qualification-catalog-v1`
- `canonical-caption-private-qualification-catalog-repository-v1`
- `canonical-caption-private-qualification-catalog-assembly-v1`
- `canonical-caption-private-internal-qualification-record-v1`
- `canonical-caption-private-internal-qualification-repository-v1`
- `canonical-caption-private-internal-qualification-service-v1`
- `canonical-caption-private-qualification-composition-v1`
- embedded `skill-qualification-snapshot-v1` terminal per-job projection

The historical V1/V2/V3 Caption terminal contracts remain readable. The new
catalog is additive and corrects the invalid operational assumption that a
single approved snapshot should exercise all 41 jobs.

## Existing owners reused

- immutable approved snapshot and execution package
- canonical work graph, jobs, manifest, estimate, approval, and reservation
- Caption planning artifact runner and private artifact QA/reconciliation
- persisted specialist call/result and sequential support-resume repository
- canonical transcript authenticated-read repository
- Visual Intelligence authenticated evidence repository
- Track All/SAM 3.1 authenticated evidence repository
- SoundSync authenticated evidence repository
- B-roll authenticated owner-read evidence repository
- canonical postrender complete-time visual review
- Caption-owned direct professional-appearance inspection
- independent final QA and private-review assembly

## Duplicate owners avoided

Caption does not execute Transcript, Visual Intelligence, Track All, Sound,
B-roll, postrender visual review, independent final QA, billing, or delivery.
The new composition only rereads their exact persisted records. It does not
dispatch peers, run providers, render media, mutate assets, approve final QA,
or implement the central Orchestra.

## Evidence semantics

An approved-run record explicitly says:

- its per-job specialist artifacts are planning artifacts;
- planning-only evidence is not terminal qualification;
- a terminal catalog must combine the occurrence with an accepted rendered
  output and all required owner evidence;
- synthetic color bars, blocks, timers, and geometry fixtures cannot claim
  professional appearance.

The terminal catalog requires at least two distinct approved snapshots and two
distinct reviewed outputs. It fails closed for a missing job, missing owner,
projection-only owner substitution, crossed tenant, crossed request, stale
digest, unknown field, unsafe serialized text, changed reread, or caller-
supplied run evidence.

## Tests run and passed

- server typecheck
- targeted ESLint
- `smoke:canonical-caption-specialist-execution` — 30 checks
- `smoke:captions-specialist-terminal-qualification-v3` — 12 checks
- `smoke:canonical-caption-direct-visual-inspection-evidence` — 11 checks
- `smoke:canonical-caption-real-source-inspection-projection` — 35 assertions
- `smoke:canonical-caption-qualification-run-evidence` — 25 checks
- `smoke:canonical-caption-private-qualification-catalog` — 29 checks
- `smoke:canonical-caption-private-qualification-composition` — 9 checks
- `smoke:canonical-caption-shared-owner-composition` — 9 checks

The catalog and final-record smoke uses contract fixtures only. It starts no
media/model/provider runtime and publishes no actual qualification evidence.

## Media inspected

None. This milestone is source/static-only and generated no media.

## Visible defects

Not applicable. No new raster or video was generated.

## Repairs made

- removed the one-snapshot/all-41-jobs assumption from the active terminal
  evidence architecture;
- made per-job planning-only status explicit;
- added exact work-item/job/manifest/reservation digest checks;
- required real owner records instead of projection-only substitutes;
- required exact real-source direct-inspection evidence and rejected synthetic
  engineering imagery structurally rather than by documentation alone;
- preserved strict historical V1 decoding while making V2 the only eligible
  approved-run record;
- exposed the already-mounted Sound and B-roll evidence repositories for the
  terminal reread without creating another owner.

## Known limitations and scoped blockers

- Actual approved Caption runs have not yet populated the new run repository.
- Therefore the actual multi-run catalog and actual private-internal release
  record do not exist yet.
- Remaining real evidence includes accepted transcript/audio truth, actual
  Visual Intelligence, actual Track All/SAM 3.1 where required, complete-time
  Sound listening review, and the full reviewed Caption output set.
- Public production, billing activation, customer delivery, and the central
  Orchestra are intentionally outside this private-internal target.

## Next milestone

Execute the bounded representative approved Caption runs through the existing
canonical owners, inspect the actual rendered outputs, persist each exact run
record, assemble the 41-job catalog, and only then publish the private-internal
qualification record.
