# OCR Runtime Verification Policy

Phase 37C is a generated-fixture runtime verification gate. It proves that the selected private PP-OCRv5 assets can be loaded locally by PaddleOCR and can detect text in generated UI/text frames without runtime model downloads.

Pass criteria:

- All copied model assets match Phase 37B SHA-256 evidence.
- Tar extraction rejects unsafe paths before use.
- PaddleOCR initialization and inference run under a network/model-download guard.
- CPU mode is used.
- Required fixtures meet critical token recall `>= 0.80`.
- Required fixtures meet average OCR confidence `>= 0.60` when confidence is reported.
- Each required broad expected region has at least one OCR box center inside it.
- `caption-safe-zone-conflict` detects text intersecting the expected lower caption conflict zone.

Fail-closed criteria:

- Missing private asset.
- SHA-256 mismatch.
- Unsafe tar entry.
- Runtime auto-download or network attempt.
- Real media input.
- Provider execution.
- Public artifact configuration.
- Beta/production/broad-media unlock.

Warnings from low-contrast, small-text, and deferred rotated-text fixtures are recorded but do not alone block Phase 37C.
