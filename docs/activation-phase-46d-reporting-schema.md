# Phase 46D Reporting Schema

The canonical metadata tables are `phase_runs`, `tool_results`, `fixture_results`, `controlled_sample_results`, `dependency_risks`, `blockers`, `artifact_objects`, `readiness_scorecard`, and `beta_gate_inputs`.

Committed reports may include safe redacted metadata, status counts, hashes, object counts, and internal private GCS references or hashes. They must not include media files, frames, thumbnails, raw OCR text, signed URLs, provider logs, secrets, or private payloads.
