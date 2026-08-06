# CAP-04 Independent Audio Review Completion Seam — 2026-08-06

Milestone: `CAP-04 independent audio review completion seam`

Status: `source_complete_waiting_for_actual_independent_audio_review`

## Outcome

The private correction-review package now has a closed completion path into the
existing canonical transcript owner. A real independent reviewer can submit one
complete, ordered decision per source segment. The service verifies every
source-word replacement, corrected word ID, corrected text, timing interval,
approved snapshot scope, package digest, transcript, rejected inspection, and
unapproved ASR-candidate context before it produces:

- `caption-private-independent-audio-truth-review-v1`;
- `canonical-caption-reviewed-transcript-correction-artifact-v1`;
- `canonical-caption-reviewed-transcript-correction-request-v1`; and
- a byte-free completion receipt.

The completion path does not persist a canonical transcript. The existing
canonical transcript owner must reread the immutable approved snapshot, source
transcript, rejected inspection, correction artifact, and independent review
before it may create and authenticate a corrected transcript.

## Contracts added

- `canonical-caption-transcript-correction-reviewer-submission-v1`
- `canonical-caption-transcript-correction-review-completion-receipt-v1`

The reviewer submission is private and contains corrected text. The completion
receipt contains refs and verification claims only. Both keep direct peer
dispatch, Caption transcript mutation, timing, asset, final-QA, billing, public
delivery, and production authority false.

## Existing owners reused

- the immutable canonical transcript and source-word lineage;
- the rejected transcript-inspection owner;
- the existing independent-audio-review contract;
- the existing reviewed-correction artifact and request contracts; and
- the existing canonical reviewed-correction owner service and repository.

No second transcript owner, approval owner, reviewer owner, timeline, work
graph, or dispatcher was created.

## Fail-closed behavior

The completion service rejects:

- incomplete or out-of-order segment decisions;
- a crossed review package, owner, workspace, project, edit session, plan, or
  approved snapshot;
- changed transcript, inspection, or ASR-candidate context;
- corrected text that does not exactly match its corrected words;
- unknown, duplicated, omitted, reordered, or non-contiguous source-word
  lineage;
- duplicated corrected word IDs;
- overlapping, non-positive, or out-of-segment timing;
- review confidence below 8,000 basis points;
- false full-listening or word-review claims;
- unknown fields, control characters, and digest changes; and
- any authority escalation.

The correction artifact basis digest deliberately omits the final independent
review ref. This permits the independent review to bind the exact correction
basis before the final artifact binds back to the review, without weakening
either digest.

## Private CLI

`npm run private:caption-transcript-correction-review-completion` is an explicit,
create-only private path. It requires a separately authored reviewer submission
and the exact source transcript, rejected inspection, review package, and
candidate artifacts. It persists the submission, independent review,
correction artifact, canonical-owner request, and completion receipt outside
the repository with mode `0600`, rereads every artifact, and proves deterministic
replay.

It does not listen to audio, infer reviewer decisions, call a provider, mutate
the canonical transcript, or claim final QA.

## Tests run

- `npm run smoke:canonical-caption-transcript-correction-review-completion`
  — **23/23 checks passed**;
- existing correction artifact/request smoke — **11/11 passed**;
- existing correction owner smoke — **12/12 passed**;
- existing review-package smoke — **22/22 passed**;
- Caption source-integration aggregate — **39 suites passed**;
- focused ESLint — passed;
- full TypeScript no-emit check — passed.

## Media inspected

No media was generated or listened to by this source milestone. The actual
65-second source review remains pending. Engineering color-bar fixtures are
unrelated technical evidence and are not accepted as transcript truth or
professional Caption appearance.

## Scoped blocker

An audio-capable independent reviewer still must listen to the complete source,
resolve all 11 review items, and directly check every corrected word and timing.
Until that occurs, no accepted reviewer submission, independent-audio review,
correction artifact, canonical-owner request, or corrected canonical transcript
exists for the real source.

## Next milestone

After the actual review, run the new create-only completion CLI and feed its
exact request into the already-mounted canonical transcript owner. Then bind
the authenticated corrected-transcript reread into the representative private
Caption qualification campaign.
