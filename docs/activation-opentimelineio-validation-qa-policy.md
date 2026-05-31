# Phase 45C OpenTimelineIO QA Policy

Mandatory QA gates:

- `source_integrity`
- `phase45a_evidence`
- `phase45b_evidence`
- `otio_timeline_created_or_resolved`
- `otio_schema_valid`
- `timeline_duration_bounds`
- `clip_reference_integrity`
- `caption_render_reference_integrity`
- `no_public_artifacts`
- `no_final_delivery`
- `blocked_features`

Phase45D readiness is true only when all mandatory gates pass. Readiness means only that FFmpeg/FFprobe final render/export hardening may start in a later phase.
