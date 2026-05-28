# Activation BiRefNet Mask QA Policy

Phase 33C emits mask QA for one generated synthetic image.

Required gates:

- `mask_edge_quality`
- `mask_subject_coverage`
- `render_asset_integrity`
- `mask_temporal_stability`

The mask must exist, match fixture dimensions, be non-empty, and not be
full-frame only. The optional RGBA cutout must have an alpha channel.

`mask_temporal_stability` is `not_applicable` because Phase 33C validates only a
single generated image. No temporal or real-video mask quality claim is made.
