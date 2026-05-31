# Phase 45B Remotion Render Validation QA Policy

Mandatory QA gates are:

- `source_integrity`
- `phase45a_evidence`
- `remotion_render_invoked`
- `render_preview_created`
- `ffprobe_preview_validation`
- `duration_bounds`
- `private_artifacts`
- `no_final_delivery`
- `blocked_features`

Phase45C readiness is true only when all mandatory gates pass. Readiness means only “ready for OpenTimelineIO timeline validation,” not final delivery or production readiness.
