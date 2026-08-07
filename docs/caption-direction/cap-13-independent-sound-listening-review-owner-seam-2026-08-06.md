# CAP-13 independent Sound listening-review owner seam

Milestone: CAP-13 follow-up — durable independent Sound listening review

Status: source_complete_actual_listening_evidence_pending

Outcome:

The canonical Sound owner now consumes a create-only, exact-reread listening
record instead of accepting a caller-provided review or constructing an
accepted review from one inspected artifact hash. The record binds the exact
Caption Sound request, canonical Sound request/result, final mix, complete
authorized ranges, every requested cue, independent reviewer submission, and
optional bounded playback-proxy derivation. Caption receives only the existing
Sound owner result and gains no execution, asset, mix, QA-approval, billing,
delivery, or production authority.

Files changed:

- `server/services/canonical-sound-caption-listening-review-completion.ts`
- `server/services/canonical-caption-shared-owner-private-composition.ts`
- `server/cli/canonical-sound-caption-listening-review-completion.ts`
- `server/smoke/canonical-sound-caption-owner-service-smoke.ts`
- `server/smoke/canonical-sound-caption-owner-private-runtime-smoke.ts`
- `server/smoke/canonical-caption-shared-owner-private-composition-smoke.ts`
- `package.json`
- Caption evidence/readiness documentation

Contracts added/changed:

- `canonical-sound-caption-listening-reviewer-submission-v1`
- `canonical-sound-caption-listening-playback-derivation-v1`
- `canonical-sound-caption-listening-review-completion-receipt-v1`
- `canonical-sound-caption-listening-review-record-v1`
- `canonical-sound-caption-listening-review-repository-v1`
- `canonical-caption-shared-owner-private-composition-v3`

The existing `canonical-sound-caption-listening-review-v1` and
`canonical-sound-caption-owner-service-v1` remain unchanged. The additive
repository projects a verified submission into that established owner surface.

Existing owners reused:

- canonical Sound execution owner;
- canonical Sound final-mix artifact resolver;
- canonical Caption SoundSync support bridge;
- canonical create-only private JSON object port; and
- the shared specialist resume repository.

Duplicate owners avoided:

- Caption does not perform Sound execution or mixing;
- Caption does not approve final QA;
- the private CLI does not dispatch Sound or call a provider;
- the test harness does not become an Orchestra; and
- the additive repository is owned by Sound and exposes only its admitted
  read port to the Caption composition.

Tests run:

- targeted ESLint for the service, CLI, composition, and smokes;
- full server typecheck;
- `smoke:canonical-sound-caption-owner`;
- `smoke:canonical-caption-shared-owner-composition`; and
- the 47-suite Caption source-integration aggregate;
- full lint and 2,969-module build;
- frontend/server boundary check across 1,145 files;
- current-tree secret scan across 6,848 files;
- reachable-history secret scan across 15,627 blobs; and
- Git diff whitespace validation.

Tests passed:

- create-only review persistence and byte-identical replay;
- twice-reread exact record identity;
- stale reviewer-submission refusal;
- playback proxy without derivation refusal;
- cross-final-mix proxy derivation refusal;
- existing Sound owner result parsing;
- no-review fail-closed behavior; and
- V3 composition ownership/authority checks.

Tests failed:

None after repair.

Media inspected:

The existing 12-second private final mix was reread at SHA-256
`124146802168048491f4ef7556f34689b5790a62e6570135e8f16ef634e9c182`.
A bounded inspection-only PCM proxy was generated and technically verified as
the same 12.000-second, 48 kHz, stereo program with no trim, sample-rate
change, channel change, gain, dynamics, or filter operation. This model session
then rejected audio input, so no acoustic listening claim was made and neither
artifact nor proxy was admitted as completed review evidence.

Visible/audible defects:

No audible disposition was possible in this environment. Technical metadata
cannot prove voice clarity, cue restraint, or absence of dialogue masking.

Repairs made:

- removed the private smoke's hash-only accepted-review construction;
- required an independently authored reviewer submission;
- added exact final-mix and playback-derivation lineage;
- added create-only persistence, exact reread, collision refusal, and closed
  authority boundaries; and
- mounted the repository in an additive V3 shared-owner composition.

Known limitations:

The source seam is complete, but the actual Sound evidence gate remains open
until a qualified audio AI or direct private human listens to the complete
program and submits the exact bounded decision. The generated inspection proxy
is not product media, final QA, or terminal qualification evidence.

Scoped blockers:

- audio input is unavailable in the current model session; and
- no authorized external audio-review provider call was made.

Safe work completed:

All review ownership, persistence, lineage, replay, failure, and Caption resume
boundaries are now implemented and testable without production rollout.

Next milestone:

Have an audio-capable qualified reviewer inspect the exact 12-second program,
persist the review through the new private operator, rerun the existing Sound
owner against that record, and then bind the result to the representative
terminal Caption run. Continue unrelated transcript, Visual Intelligence,
Track All, and final-QA work in parallel where safely possible.
