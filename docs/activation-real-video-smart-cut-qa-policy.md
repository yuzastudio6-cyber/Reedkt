# Activation Real Video Smart Cut QA Policy

Phase 29 QA verifies the controlled smart-cut and caption timeline metadata.

Required gates:

- `cut_smoothness`
- `transcript_alignment`
- `render_timeline_integrity`
- `caption_timing`
- `caption_readability`
- `caption_safe_zone`
- `export_duration_sync`
- `final_delivery`

Rules:

- no mid-word cuts
- no negative or overlapping keep/remove ranges
- protected transcript ranges must not be removed
- timeline duration must be greater than zero
- caption layer references must exist
- preview warnings are nonblocking when preview is intentionally skipped
- `final_delivery` must not pass in Phase 29

Caption safe-zone remains warning-only unless face/OCR and render checks are
run in a later approved phase.
