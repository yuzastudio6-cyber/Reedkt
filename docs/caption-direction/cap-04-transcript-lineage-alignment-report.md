# CAP-04 — Transcript, Lineage, and Alignment Report

Status: `complete`
Milestone: `CAP-04`
Media/model runtime started: no
Production qualification claimed: no

## Outcome

CAP-04 establishes one immutable private Caption transcript derived from the
existing canonical source-speech evidence package. Every Caption phrase now
retains exact source segment and source word lineage, timing provenance,
confidence, text-transformation provenance, and review evidence.

The new contracts are:

- `caption-canonical-transcript-v1`;
- `caption-phrase-lineage-projection-v1`;
- `caption-alignment-qualification-v1`.

All three are strict, versioned, digest-bound, closed serialized contracts.
Unknown top-level or nested fields, inherited/accessor data, invalid ordering,
duplicate lineage, tampered digests, and authority overclaims fail closed.

## Alignment disposition

- Faster-Whisper is qualified only for segment transcription and ASR-native
  word timing through the existing canonical runtime-contract evidence.
- WhisperX remains blocked because this committed foundation has no released
  WhisperX runtime contract or focused qualification evidence.
- pyannote remains blocked because this committed foundation has no released
  pyannote runtime contract or focused qualification evidence.
- None of these records claims public or production qualification.

Caption cannot accept forced alignment unless the WhisperX route is qualified,
and cannot accept diarization unless the pyannote route is qualified.

## Word-motion gates

- Phrase captions may use qualified, sufficiently confident ASR-native timing.
- Active-word motion requires non-synthetic qualified timing and at least 80%
  confidence.
- Karaoke requires high-confidence forced alignment and therefore remains
  blocked under the current qualification snapshot.
- Synthetic word timing is explicitly preview-only and cannot drive final
  phrase, active-word, or karaoke rendering.

Proper names and claims remain explicit review inputs. Prices/currency,
numbers, quotations, and low-confidence speech are detected deterministically
and require review evidence before phrase projection. Meaning-changing or
meaning-condensing transformations require an exact approval reference.

## Verification

`smoke:captions-specialist-cap-04` passed 29 assertions covering the positive
canonical lineage path and adversarial qualification, provenance, review,
transformation, duplicate, ordering, nested-shape, digest, and authority cases.
The complete server typecheck and focused ESLint checks passed. No transcript
content is made browser-shareable, no raw chat enters the contract, and no
provider, media, worker, render, billing, public, or production authority is
opened.

## Next milestone

CAP-05 qualifies the font and Unicode runtime, approved-font registry,
glyph/shaping coverage, and deterministic fallback behavior.
