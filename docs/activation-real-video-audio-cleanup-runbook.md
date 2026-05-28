# Phase 31 Real Video Audio Cleanup Runbook

Phase 31 is a controlled staging-only audio cleanup test for the single Phase 30B private export.

- Input is locked to `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase30/phase30-20260528T12421/final-export.mp4`.
- The only processing allowed is FFmpeg loudness measurement and loudnorm normalization.
- Execution runs through the staging render Cloud Run job after `REEDITPRO_CONFIRM_REAL_VIDEO_AUDIO_CLEANUP=true`.
- Outputs stay private under Phase 31 generated-assets, final-exports, and QA prefixes.

Do not use GPU, providers, model downloads, DeepFilterNet, RNNoise, Demucs, color, masks, enhancement, public URLs, Revideo, production, external beta, or broad real media testing.
