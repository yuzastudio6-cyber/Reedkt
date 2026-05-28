# Real Video Mask QA Policy

Phase 33D QA emits:

- `mask_edge_quality`
- `mask_subject_coverage`
- `render_asset_integrity`
- `mask_temporal_stability`
- `text_behind_subject_block`

The mask must exist, match the representative frame dimensions, be non-empty,
and not be full-frame-only. The RGBA cutout must exist and preserve alpha.

Temporal stability is warning-only or not applicable because Phase 33D processes
one frame. Text-behind-subject is not executed in this phase.
