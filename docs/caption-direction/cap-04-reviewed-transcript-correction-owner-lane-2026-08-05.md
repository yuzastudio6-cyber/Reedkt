# CAP-04 Reviewed Transcript Correction Owner Lane — 2026-08-05

Status: `owner_mount_source_ready_waiting_for_independent_audio_truth_review`

The real private Faster-Whisper run correctly remains rejected. This additive
lane defines the admissible repair path without changing that disposition and
without allowing Caption to become a second transcript owner.

The canonical transcript owner now has three correction records plus one
authenticated owner reconciliation receipt:

- `canonical-caption-reviewed-transcript-correction-artifact-v1` for the
  private, independently reviewed full-transcript correction;
- `canonical-caption-reviewed-transcript-correction-request-v1` for the
  byte-free request that binds the rejected transcript, rejected inspection,
  source media, immutable approved scope, correction artifact, and independent
  audio-truth review;
- `canonical-caption-reviewed-transcript-correction-record-v1` for the exact
  owner-produced corrected canonical transcript and correction lineage.
- `canonical-caption-reviewed-transcript-owner-reconciliation-receipt-v1` for
  the byte-free exact binding from the correction record into the existing
  canonical authenticated-transcript repository and Caption read port.

The correction must cover every segment in the rejected transcript. Every
corrected word carries directly reviewed start/end timing, at least one
contiguous source-ASR lineage span, and a review confidence of at least 8,000
basis points. The union of those mappings must cover every original source word.
The corrected transcript uses `manually_corrected` timing provenance and keeps
the original immutable transcript unchanged.

The owner rejects partial correction, unknown or omitted source-word lineage,
crossed transcript/inspection/review scope, duplicate correction reasons,
stale digests, and any Caption transcript-mutation authority claim.

The owner mount now rereads the immutable snapshot, original authenticated
transcript, rejected inspection, correction artifact, and independent review
twice; rejects changed or crossed inputs; persists the correction and receipt
create-only; and publishes the corrected transcript through the same canonical
authenticated-transcript repository already consumed by Caption execution.
It creates no second transcript repository or Caption dispatcher.

This source lane still does not claim that an independent reviewer listened to
the current 65-second source, does not accept the older synthetic word
distribution as audio truth, and does not qualify the rejected transcript. The
next actual evidence step is a complete independent audio-truth correction and
review for that real source, followed by this now-mounted owner path.

No provider, peer-dispatch, timing, asset, final-QA, billing, public-delivery,
or production authority is granted to Caption.
