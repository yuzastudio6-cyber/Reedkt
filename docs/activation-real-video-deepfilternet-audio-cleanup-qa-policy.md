# Phase 36D Real-Video DeepFilterNet QA Policy

Required QA gates:

- `source_integrity`: approved Phase 32 source only, audio/video present, bounded
  duration, no arbitrary media.
- `plan_snapshot_integrity`: approved plan snapshot exists and
  `rawPromptExecution=false`.
- `model_artifacts`: DeepFilterNet artifacts copied from private GCS and checksum
  verified.
- `audio_extraction`: WAV extraction succeeded and decoded for metrics.
- `deepfilternet_cleanup`: DeepFilterNet completed and cleaned WAV exists.
- `audio_safety_metrics`: duration, RMS, peak, and clipping metrics recorded.
- `review_preview`: private review MP4 created, or blocked with exact reason.
- `artifact_privacy`: all artifacts are private GCS paths.
- `blocked_features`: production, beta, broad media, RNNoise, Demucs, providers,
  Revideo, FILM, slow motion, arbitrary media, and final delivery remain blocked.

Passing Phase 36D permits only Phase 36E private audio feature E2E planning.
Subjective listening review is still recommended before broader internal review.
