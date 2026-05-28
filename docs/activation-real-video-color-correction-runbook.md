# Phase 32 Real Video Color Correction Runbook

Phase 32 is a controlled staging-only color correction test for the single Phase 31 private export.

- Input is locked to `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4`.
- The only processing allowed is FFmpeg frame/stat sampling and clean no-op/minimal color correction.
- Execution runs through the staging render Cloud Run job after `REEDITPRO_CONFIRM_REAL_VIDEO_COLOR_CORRECTION=true`.
- Outputs stay private under Phase 32 analysis, generated-assets, final-exports, and QA prefixes.

Do not use GPU, providers, model downloads, OpenColorIO, OpenImageIO, unapproved LUTs, masks, enhancement, public URLs, Revideo, production, external beta, or broad real media testing.
