# Track B Route Artifact Scope Policy

Track B route entries require approved private artifact scopes before any future execution.

Private artifact families:

- `audio_timing`: Phase 36 private QA artifacts and bounded audio/timing metadata.
- `ocr`: Phase 37 private OCR and safe-zone metadata.
- `vlm`: currently blocked and excluded.
- `media_data`: Phase 46 private media/data QA and reporting metadata.
- `hybrid_compute`: Phase 44 metadata reports only until profiler/cost phases are complete.

Blocked artifact sources include public artifacts, signed URLs as source of truth, committed private payloads, arbitrary file paths, arbitrary GCS prefixes, broad user media, and unapproved model weights.

Committed reports may contain safe JSON/Markdown metadata, redacted summaries, hashes, object counts, and policy references only. They must not contain media, audio, model files, private frames, raw transcripts, secrets, provider logs, or runtime caches.
