# OCR Caption/Render QA Metadata Policy

Phase 37E is a Track B metadata integration gate. It may combine generated OCR metadata fixtures with approved Phase 37D private safe-zone metadata, then emit caption candidate zones, avoid-text regions, overlap QA, and a future render QA handoff contract.

Allowed Phase 37E inputs:

- committed safe Phase 37C and Phase 37D evidence modules
- approved private Phase 37C/37D JSON QA artifacts when the current shell confirms private artifact read
- generated synthetic metadata fixtures

Blocked Phase 37E inputs and actions:

- public artifact paths
- signed URLs as source of truth
- arbitrary media inputs
- OCR runtime invocation
- frame extraction
- raw video or frame reads
- render execution or caption burn-in
- Track A execution/runtime imports
- beta or production unlocks

Collision defaults:

- padding: `0.025`
- lower-third candidate: `x=0.05..0.95`, `y=0.68..0.95`
- upper-third candidate: `x=0.05..0.95`, `y=0.05..0.32`
- center-safe candidate: `x=0.10..0.90`, `y=0.35..0.65`
- overlap ratio `>=0.10`: warning
- overlap ratio `>=0.20`: block
- if all candidate zones are risky: manual review
- low confidence: warning

Controlled real-media OCR text must remain redacted. Phase 37E artifacts may include counts, normalized boxes, redaction hashes, fixture ids, frame ids, zone ids, overlap ratios, warnings, blockers, and private GCS object metadata.
