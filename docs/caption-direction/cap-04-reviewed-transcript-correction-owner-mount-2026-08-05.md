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
   `canonical-caption-transcript-evidence-repository-v2` owner;
8. rereads the exact corrected transcript and byte-free authenticated binding;
9. proves the existing Caption execution read port admits that exact result.

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

## Existing owners reused

- canonical approved-snapshot reader;
- canonical source transcript evidence record;
- `canonical-caption-transcript-evidence-repository-v2`;
- `caption-canonical-transcript-authenticated-read-binding-v1`;
- Caption's existing authenticated transcript admission parser.

## Duplicate owners avoided

- no Caption transcript mutation owner;
- no second authenticated transcript repository;
- no peer dispatcher;
- no timing, asset, QA, billing, delivery, or production owner.

## Focused evidence

The owner-service smoke passes 12 checks covering:

- complete reviewed correction;
- manual timing provenance;
- create-only persistence and identical replay;
- corrected transcript lookup through the existing execution repository;
- Caption authenticated-read admission;
- forged port rejection;
- stale approved-snapshot rejection;
- changed-between-rereads rejection;
- crossed independent review rejection;
- crossed reconciliation receipt rejection.

The deterministic fixture digests are:

- source transcript: `651dd9453e14baa6b1f3685140b10166fbff0a0365827495b940e177999fd24e`
- corrected transcript: `73b7913d32bced99f94267b36c8ce8bd1b6a73b4b2296920755eae32566dedc0`
- authenticated transcript record: `925d872bdef0e76c47bed4f10d45a83ee7c6584c6d207982aaebc27764e33590`
- authenticated read binding: `8e4954e0c94bac89042ccf1bb79c62313341c83e963d13875c3b7213588e2ad0`
- owner receipt: `c8f769a704716dee467fb9e201a018e1f43ab7eb3764ea00e93742e3c284598e`

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
