# Production Real Mask Execution QA Policy

M15C emits these QA gates:

- `mask_edge_quality`
- `mask_temporal_stability`
- `mask_subject_coverage`
- `render_asset_integrity`

Checks cover subject coverage, missing-subject holes, edge/hair/hand risk, background leak, frame-to-frame flicker, tracking drift, artifact presence, text placement safety, and final-render exclusion.

Blocking QA prevents text-behind-subject preview and later final export until a safer fallback or review resolves the issue.
