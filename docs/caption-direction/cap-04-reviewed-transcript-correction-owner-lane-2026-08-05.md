# CAP-04 Reviewed Transcript Correction Owner Lane — 2026-08-05

Status: `source_ready_waiting_for_independent_audio_truth_review`

The real private Faster-Whisper run correctly remains rejected. This additive
lane defines the admissible repair path without changing that disposition and
without allowing Caption to become a second transcript owner.

The canonical transcript owner now has three versioned records:

- `canonical-caption-reviewed-transcript-correction-artifact-v1` for the
  private, independently reviewed full-transcript correction;
- `canonical-caption-reviewed-transcript-correction-request-v1` for the
  byte-free request that binds the rejected transcript, rejected inspection,
  source media, immutable approved scope, correction artifact, and independent
  audio-truth review;
- `canonical-caption-reviewed-transcript-correction-record-v1` for the exact
  owner-produced corrected canonical transcript and correction lineage.

The correction must cover every segment in the rejected transcript. Every
corrected word carries directly reviewed start/end timing, at least one
contiguous source-ASR lineage span, and a review confidence of at least 8,000
basis points. The union of those mappings must cover every original source word.
The corrected transcript uses `manually_corrected` timing provenance and keeps
the original immutable transcript unchanged.

The owner rejects partial correction, unknown or omitted source-word lineage,
crossed transcript/inspection/review scope, duplicate correction reasons,
stale digests, and any Caption transcript-mutation authority claim.

This source lane does not claim that an independent reviewer listened to the
current 65-second source, does not accept the older synthetic word distribution
as audio truth, and does not qualify the rejected transcript. The next actual
evidence step is a complete independent audio-truth correction artifact,
owner-side reread, create-only persistence, and authenticated Caption read of
the resulting corrected transcript.

No provider, peer-dispatch, timing, asset, final-QA, billing, public-delivery,
or production authority is granted to Caption.
