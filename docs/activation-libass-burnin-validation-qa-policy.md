# Phase 45A Libass Burn-In QA Policy

Mandatory QA gates:

- `source_integrity`
- `caption_sidecar_integrity`
- `libass_filter_available`
- `burnin_preview_created`
- `preview_decodes`
- `duration_bounds`
- `no_final_delivery`
- `artifact_privacy`
- `blocked_features`

Phase45B readiness is true only when all mandatory gates pass. Readiness means
only “ready for Remotion render validation.” It does not approve final delivery,
production, external beta, providers, Revideo, Track B tools, public output, or
broad real media.
