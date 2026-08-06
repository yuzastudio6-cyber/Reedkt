# CAP-04 Real-Source Transcript Correction Review Preparation — 2026-08-06

Milestone: `CAP-04 transcript correction review preparation`

Status: `review_package_created_waiting_for_independent_audio_truth_review`

## Outcome

The rejected 65-second real-source transcript now has a private, closed,
create-only review package. The package does not approve either ASR pass. It
preserves the original rejected transcript, two additional offline ASR
observations, all source segment/word lineage, and the exact disagreements an
independent listener must resolve.

The original Faster-Whisper Small observation remains rejected. Two additional
passes used the already-approved local model and runtime with offline mode,
zero model download, and zero provider/network call:

- a hotword-only observation, source JSON SHA-256
  `552130e01a1710006e9796dcf833d680c076b998c6b645da7324bd69ddfec53d`;
- a server-terminology-aware observation, source JSON SHA-256
  `dd22bb11acaacfe762d447ce9051ea5c89c61f90b101bbaaf3d50887d3eb9f84`.

Both improve the `ReEditPro` product-name observation, but both also produce
the unverified `100,000` claim where the existing editorial reference uses
different wording. They are therefore correction candidates only, not audio
truth.

## Contracts added

- `canonical-caption-transcript-correction-candidate-v1`
- `canonical-caption-transcript-correction-review-package-v1`

The review package is intentionally distinct from:

- `caption-private-independent-audio-truth-review-v1`;
- `canonical-caption-reviewed-transcript-correction-artifact-v1`;
- the canonical transcript-owner reconciliation record.

No candidate can claim independent audio truth, correction approval, canonical
owner admission, Caption transcript-mutation authority, final QA, billing,
public delivery, or production authority.

## Actual private evidence

- package contract digest:
  `911610fb7a111a76585fdeaa12cc92f035820b900dbc76398226326a514e4a03`;
- package-file SHA-256:
  `5beb8b2c9f71e80e19f2ea9427703ceb186fbd36305feec81ea4eb2ca2bfcdd9`;
- candidate contract digests:
  `68f69eb97d9c8622e87c377a4c2a91de6e717209c9fea0a2618f0a9f051b9eda`
  and
  `8380f4164277f1ee2e318fbc496a4a1322c3baff3a1d37a0ff8d541bb94b23a7`;
- original segments packaged: **11/11**;
- original source words packaged: **153/153**;
- listener decisions pending: **11/11**;
- candidate gaps: **0**;
- text-disagreement segments: **9**;
- timing-disagreement segments: **2**;
- brand-review segments: **2**;
- claim-sensitive number-review segments: **1**.

The package is private under
`/Users/macuser/.codex/private_caption_evidence/` and is not committed.
Serialized evidence contains no media bytes, local paths, URLs, credentials, or
raw chat.

## Existing owners reused

- the immutable Caption canonical transcript and source-word lineage;
- the rejected direct-inspection receipt;
- the reviewed-correction owner V2 and existing authenticated transcript
  repository;
- the approved local Faster-Whisper model manifest and runtime.

No second transcript owner, reviewer authority, dispatcher, work graph, or
timeline was created.

## Tests run

- `npm run smoke:canonical-caption-transcript-correction-review-package`
  — **22/22 checks passed**;
- focused ESLint for the contract, service, CLI, and smoke — passed;
- full TypeScript no-emit check — passed;
- actual private package create-only persistence and exact reread — passed.

## Media inspected

The complete source media was processed by the existing offline ASR runtime.
This Codex runtime does not support audio input, so no direct listening claim
was made. That limitation is represented as data, not hidden:

- `completeSourceAudioListened: false`;
- `correctedTranscriptApprovedForCanonicalOwnerProjection: false`;
- `canonicalOwnerAdmissionAllowed: false`;
- independent review and correction refs remain `null`.

## Visible defects and repairs

No visual media was produced by this milestone. The material defect is audio
truth uncertainty: product-name, semantic phrase, and claim-sensitive wording
disagreements remain. The repair completed here is the bounded review package,
not an invented corrected transcript.

## Scoped blocker

An independent audio-capable reviewer must listen to the complete source,
resolve all 11 items, directly review every corrected word timing, and publish
the existing independent-review and correction artifacts. Only then may the
canonical transcript owner persist and reread a corrected transcript.

## Next milestone

Run the completed review through the canonical correction owner V2 with the
exact source scopes. It will recompute and create-only bind the immutable
approved-work planning expectation to the corrected authenticated transcript.
Use that exact mapping in the representative private qualification campaign.
Other source-only and already-rendered Caption evidence remains valid, but
terminal qualification stays unchanged until the review is actually completed.
