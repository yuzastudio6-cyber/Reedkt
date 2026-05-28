# Real Video BiRefNet Frame Mask Runbook

Phase 33D runs one controlled representative-frame mask test on the approved
Phase 32 private color-corrected export.

The run is staging-only and requires
`REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK=true`. The render worker
extracts exactly one PNG frame, then the BiRefNet runtime job masks that frame
with the approved private-GCS `birefnet_main_staging_v1` model snapshot.

This phase does not run SAM2, full-video masking, text-behind-subject, final
render/export, providers, runtime model downloads, public URLs, Revideo,
production, external beta, or broad real-media testing.
