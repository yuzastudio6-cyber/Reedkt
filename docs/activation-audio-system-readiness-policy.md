# Phase 36F Audio System Readiness Policy

Phase 36F includes only FFmpeg/FFprobe loudness validation and DeepFilterNet
v0.5.6 noise reduction evidence from the approved controlled chain. The allowed
evidence source is the Phase 32 private export with Phase 31 normalized-audio
reference and Phase 36E run `phase36e-20260530T152327`.

Rollback/fallback:

- If DeepFilterNet fails during internal testing, block AI audio cleanup for
  that job.
- Fall back only to FFmpeg loudness-only normalization when safe.
- Keep source audio immutable and write private error/QA artifacts.
- Do not automatically run RNNoise, Demucs, providers, Revideo, FILM, or slow
  motion.

External beta, paid production, production-ready status, broad real media,
arbitrary media, public delivery, RNNoise, Demucs, providers, Revideo, FILM,
and slow motion remain blocked.
