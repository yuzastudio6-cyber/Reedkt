# Phase 44M Artifact Scope Validation

Phase 44M validates the Phase 44L metadata-only artifact scope.

Allowed:

- Safe JSON reports.
- Safe Markdown reports.
- Private metadata-only future scope references.

Blocked:

- Media input.
- Audio input.
- Model input.
- OCR/VLM payloads.
- Provider output.
- Public output.
- Signed URLs as source of truth.
- Arbitrary local paths.
- Arbitrary GCS prefixes.
- Broad media.
- Committed private payloads.

Phase 44M requires no private artifact upload.
