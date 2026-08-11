# Canonical Source-Led Professional Caption Planning Report

Milestone: `CAPTION-SOURCE-LED-PROFESSIONAL-PLANNING-01`

Status:
`source_mount_complete_postapproval_transcript_resolution_and_dependency_execution_wired`

## Outcome

The existing source-led plan-presentation path now has a default deterministic,
server-owned professional Caption planning authority before plan publication.
The authority supplies the existing professional composition trace, early
planning bundle, V3 assignment binding, and one canonical estimate line. V3
freezes the source-analysis transcript expectation instead of mislabeling that
preapproval digest as the final word-level canonical transcript. The
existing edit-planning authority remains the only owner that creates Caption
work and binds downstream rendering, deterministic rendered QA, complete-time
visual review, and independent private review.

When confirmed legacy Caption markers exist and professional Caption planning
is selected, the service recompiles the base plan without the legacy libass
marker lane, rereads the professional authority against that clean base, and
then projects specialist work. The two render lanes cannot run in parallel.
The exact confirmed-marker set remains bound as a byte-free digest reference so
the professional owner can preserve the user's confirmed caption direction.

The default owner rereads the already-admitted canonical source cleanup,
transcript, and Visual Intelligence semantic evidence. It maps exact retained
source phrases onto the source-led MasterTiming scenes, leaves safe-region
geometry unresolved until authenticated spatial evidence exists, and emits
only the 8 video-level plus 9 required scene-level planning assignments per
captionable scene. It does not guess language, word timing, masks, placement,
or provider output. If professional captions are selected before source
analysis is ready, the owner now returns `blocked_requested`; it does not
silently fall back to the retired marker-only renderer. If analysis is ready
but proves no speech, requested Caption planning also blocks fail closed.

`no_captions` remains an explicit owner restraint. It produces no Caption work
and no Caption estimate line. It conflicts fail-closed with confirmed Caption
markers.

This milestone does not claim that an approved representative edit has run,
that authenticated transcript/Visual Intelligence/Track All/SoundSync/B-roll
evidence was consumed, or that terminal private qualification has passed.

The postapproval transcript bridge is now wired separately. The canonical
transcript owner must reread the exact approved snapshot and canonical source
transcript/word-timing evidence, recompute the preapproval expectation, persist
the authenticated transcript, and then create-only persist the exact
expectation-to-transcript mapping. The private Caption runner resolves V3 work
through that mapping and replaces the expectation with the real transcript,
its authenticated-read binding, and the immutable mapping ref in the actual
specialist call. Missing, crossed, remapped, or pre-injected lineage fails
closed.

The canonical internal runner now also validates dependent Caption jobs against
lease-time dependency authority instead of requiring their immutable approved
job record to be rewritten from `blocked` to `ready`. Root Caption jobs still
require immutable `ready`; dependent Caption jobs require immutable `blocked`
plus exact, byte-verified upstream artifact, QA, reconciliation, and execution-
fence evidence. The runner rejects missing, crossed, or digest-tampered
dependency authority and verifies Caption planning artifacts again when a
downstream lease is admitted.

## Files changed

- `src/types/canonical-caption-source-led-professional-planning.ts`
- `src/types/canonical-caption-specialist-planning.ts`
- `src/types/canonical-caption-specialist-execution.ts`
- `src/types/canonical-caption-transcript-support.ts`
- `server/captions-specialist/caption-source-led-professional-planning.ts`
- `server/captions-specialist/caption-source-led-professional-planning-owner.ts`
- `server/services/canonical-source-led-plan-presentation-service.ts`
- `server/services/canonical-caption-transcript-support-service.ts`
- `server/services/canonical-caption-specialist-execution-service.ts`
- `server/services/canonical-internal-authority-runner-service.ts`
- `src/lib/canonical-planning-draft.ts`
- `server/types.ts`
- `server/app.ts`
- `server/routes/route-helpers.ts`
- `server/smoke/canonical-caption-source-led-professional-planning-smoke.ts`
- `server/smoke/canonical-caption-source-led-professional-planning-owner-smoke.ts`
- `server/smoke/canonical-caption-transcript-support-service-smoke.ts`
- `server/smoke/captions-specialist-source-integration-aggregate-smoke.ts`
- `package.json`
- this report and the post-CAP-20 audit update

## Contracts added or changed

- `canonical-caption-source-led-professional-planning-request-v1`
- `canonical-caption-source-led-professional-planning-authority-v1`
- `canonical-caption-source-led-professional-planning-read-port-v1`
- `canonical-caption-specialist-planning-binding-v3`
- `canonical-caption-specialist-planning-projection-v3`
- `canonical-caption-specialist-work-item-input-v3`
- `canonical-caption-transcript-support-service-v2`
- `canonical-caption-transcript-evidence-repository-v3`
- `canonical-caption-transcript-planning-expectation-binding-v1`

The request is byte-free and binds the exact owner/workspace/project/edit
session/planning request/output, base component digest, confirmed output frame,
MasterTiming, source sequence, and optional confirmed Caption marker set.

The authority is digest-bound and contains only existing Caption public
components. It does not contain raw chat, transcript text, media bytes, paths,
URLs, credentials, executable code, provider payloads, or runtime instructions.
It requires two identical canonical owner reads before plan attachment.

## Existing owners reused

- canonical source-led plan compiler and presentation coordinator
- canonical plan approval and immutable snapshot owner
- canonical estimate and credit owner
- canonical Caption specialist planning projection
- canonical work graph and work-item owner
- canonical rendered Caption work binding
- canonical postrender visual-QA lifecycle binding
- canonical independent private-review dependency binding
- StoryTiming/MasterTiming, Remotion, libass, FFmpeg, and final-QA owners

## Duplicate owners avoided

No Caption dispatcher, queue, approval system, wallet, renderer owner, visual-AI
writer, transcript owner, tracker, SoundSync owner, private reviewer, or central
Orchestra was introduced. The legacy exact-marker renderer is rejected at the
professional projection boundary and removed by a clean recompile before the
specialist assignments are added.

## Tests run

- `smoke:canonical-caption-source-led-professional-planning`: 24 checks
- `smoke:canonical-caption-source-led-professional-planning-owner`: 35 checks
- `smoke:canonical-caption-transcript-support`: 34 checks
- `smoke:canonical-caption-specialist-planning`: 61 checks
- `smoke:canonical-caption-specialist-execution`: 49 checks
- `smoke:canonical-source-led-plan-compiler`: green, including 17 adversarial
  assertions
- `smoke:canonical-source-led-plan-route`: green actual-upload planning,
  approval, immutable snapshot, execution package, and 16 private-job
  completions. It stops with zero execution failures at the exact authenticated
  Visual Intelligence support boundary; two capability-gated jobs and seven
  dependent jobs remain blocked
- `smoke:canonical-internal-authority-runner`: green root/dependent lease,
  artifact, QA, reconciliation, tamper-refusal, and restart-safe evidence
- `smoke:edit-planning-authority`: green full canonical authority regression
- `smoke:captions-specialist-source-integration-aggregate`: 42/42 source suites
- server TypeScript check
- targeted and full-repository ESLint
- full production build (2,969 modules)
- Git diff whitespace check

## Tests passed

All tests above passed. The focused proof covers selected planning, explicit
restraint, exact V3 assignment coverage across two source scenes, stable double
reread, forged-port refusal, stale-base refusal, pre-existing component
refusal, legacy parallel-renderer refusal, closed authority flags, canonical
component parsing, and final publishable-plan parsing. It also covers exact
expectation recomputation, create-only mapping/reread, remap collision refusal,
crossed expectation and snapshot refusal, runner resolution, one approved V3
specialist execution, and failure before resolution.

## Tests failed

None after repair.

## Media inspected

The route regression generates one 320x180 two-second synthetic MP4 with audio
to exercise upload, FFprobe, frame mapping, approval, and private work
execution. Its color bars and geometric blocks are deliberately artificial
engineering content. They prove neither professional Caption styling nor
qualified visual appearance. Existing real Caption renders and their direct
inspection receipts were not relabeled as evidence for this mount.

## Visible defects

The synthetic fixture is intentionally not a professional visual design. Its
appearance is excluded from product-facing Caption acceptance; the route proof
records only technical wiring and fail-closed owner gating.

## Repairs made

- prevented the professional and legacy Caption render lanes from coexisting;
- preserved exact confirmed-marker lineage through the clean recompile;
- required stable owner rereads before and after legacy-lane retirement;
- rejected partial or pre-existing Caption component merges;
- preserved explicit `no_captions` as zero work and zero hidden estimate cost;
- stopped source-led planning from pretending a source-analysis transcript
  projection was already the final authenticated word-level transcript; and
- preserved the immutable approved work input while replacing its expectation
  only in the actual postapproval call after canonical reread.

## Known limitations

The runtime read port remains an override seam, but the normal route now mounts
the deterministic server owner by default. It can return a ready authority only
from the exact admitted source-analysis record. No production fallback fixture
is mounted. A requested Caption plan with missing analysis, no captionable
speech, crossed scope, or stale evidence blocks publication fail closed.

The focused authenticated transcript used to prove the new mapping is a
closed fixture-only owner record. It proves orchestration and lineage, not the
pending real audio-truth correction or terminal transcript qualification.

## Scoped blockers

The nine terminal evidence gates remain unchanged. This milestone advances the
canonical backend execution-mount gate from a missing source-led attachment
path to a ready attachment path; it does not satisfy that gate until real
approved runs persist and reread the projected results across the 41-job
catalog.

## Safe work completed

The source-led professional planning seam, typed contracts, fail-closed
validation, runtime context wiring, duplicate-lane retirement, focused proof,
and aggregate coverage are complete.

## Next milestone

Mount one real authenticated Visual Intelligence result for the representative
approved Caption run, resume the blocked support-dependent work, and continue
through deterministic render QA. Then complete the prepared real audio-truth
review and the separate complete-time visual-AI and independent final-QA gates.
