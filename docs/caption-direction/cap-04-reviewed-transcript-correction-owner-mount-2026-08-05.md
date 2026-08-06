# CAP-04 Reviewed Transcript Correction Owner Mount — 2026-08-05

Milestone: `CAP-04-CANONICAL-REVIEWED-TRANSCRIPT-OWNER-MOUNT`

Status: `source_ready_actual_real_source_review_pending`

## Outcome

The reviewed correction lane is now connected through the existing canonical
transcript owner and authenticated Caption read boundary. A corrected
transcript is not accepted from Caption or the caller. The canonical owner:

1. rereads the immutable approved scope twice;
2. rereads the original authenticated canonical transcript twice;
3. rereads the rejected inspection, full correction artifact, and independent
   audio-truth review twice;
4. verifies complete segment, source-word, corrected-word, timing, review, and
   scope lineage;
5. creates a new immutable `manually_corrected` canonical transcript while
   preserving the rejected transcript unchanged;
6. persists the correction record and reconciliation receipt create-only;
7. persists the corrected transcript through the existing
   `canonical-caption-transcript-evidence-repository-v3` owner;
8. rereads the exact corrected transcript and byte-free authenticated binding;
9. recomputes the immutable preapproval transcript expectation from the exact
   approved source scopes and twice-reread canonical source-transcript results;
10. create-only binds that expectation to the corrected authenticated record,
    without changing the approved work item; and
11. proves the existing Caption execution read port resolves that exact
    corrected result and refuses remapping to the rejected transcript.

The independent review binds the correction artifact through a stable artifact
basis digest, while the final correction artifact binds the exact review digest
and the request binds both final refs. This avoids an impossible circular hash
while still refusing substitution.

## Files changed

- `src/types/canonical-caption-reviewed-transcript-correction.ts`
- `server/services/canonical-caption-reviewed-transcript-correction.ts`
- `server/services/canonical-caption-transcript-support-service.ts`
- `server/smoke/canonical-caption-reviewed-transcript-correction-owner-service-smoke.ts`
- `server/smoke/captions-specialist-source-integration-aggregate-smoke.ts`
- `package.json`

## Contracts added or extended

- `caption-private-independent-audio-truth-review-v1`
- `canonical-caption-reviewed-transcript-owner-reconciliation-receipt-v1`
- `canonical-caption-reviewed-transcript-evidence-read-port-v1`
- `canonical-caption-reviewed-transcript-correction-repository-v1`
- `canonical-caption-reviewed-transcript-correction-owner-service-v1`
- `canonical-caption-reviewed-transcript-correction-owner-service-v2`

## Existing owners reused

- canonical approved-snapshot reader;
- canonical source transcript evidence record;
- `canonical-caption-transcript-evidence-repository-v3`;
- `caption-canonical-transcript-authenticated-read-binding-v1`;
- Caption's existing authenticated transcript admission parser.

## Duplicate owners avoided

- no Caption transcript mutation owner;
- no second authenticated transcript repository;
- no peer dispatcher;
- no timing, asset, QA, billing, delivery, or production owner.

## Focused evidence

The owner-service smoke passes 17 checks covering:

- complete reviewed correction;
- manual timing provenance;
- create-only persistence and identical replay;
- corrected transcript lookup through the existing execution repository;
- Caption authenticated-read admission;
- forged port rejection;
- stale approved-snapshot rejection;
- changed-between-rereads rejection;
- crossed independent review rejection;
- crossed reconciliation receipt rejection;
- exact source-led planning-expectation recomputation;
- corrected transcript resolution through the create-only expectation index;
- rejected-transcript remap refusal;
- forged V1 correction-owner rejection by the V2 composition; and
- crossed source-analysis scope rejection.

The deterministic fixture digests are:

- source transcript: `7ae966c76d160fc7f967d2515641403ea166a730bdcaeb9be6d866fef94d2a1e`
- corrected transcript: `923c7342ba07ce8d01efb314f954bc670124952344338806b44e3568315b45e3`
- authenticated transcript record: `dcc8f24a1cc9dd8ce54c706557a4e0eb8ce754e042b53b3ce2859e9f8bc3a5e0`
- authenticated read binding: `07b7b956e307988246aabf6bf0102707fbb82694f19d07cd2d88d1df643853e7`
- owner receipt: `86290f75963510fa6ae547bb52837825efdcf73bbb9ac7d7905e8cc956ba52f3`
- planning expectation: `4204abb5a75cb0b84091e9f6ed251fc3184161b275f79213d32622f6f86e5869`
- planning expectation binding: `b015428441eafa43f9261d9635cefedb06fd18ac47348bb1a56d480068180f6f`

## Media inspected

None in this source-only milestone. The earlier real private Faster-Whisper
transcript remains rejected. This smoke supplies contract fixtures and does not
claim an actual independent listening review.

## Known limitation and next evidence

The current real 65-second source still needs a complete independent
audio-truth correction/review artifact. Running that real evidence through this
owner mount is required before the canonical transcript gate can contribute to
terminal private qualification.

All provider, peer-dispatch, timing, asset, independent final-QA, billing,
public-delivery, and production authority remains false.
