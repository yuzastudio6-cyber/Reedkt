# Phase 36C DeepFilterNet QA Policy

Phase 36C QA proves runtime integrity only on generated synthetic audio.

## Required Gates

- `model_artifacts`: approved CLI/model archive copied from private GCS,
  checksums match, no external artifact download.
- `runtime_integrity`: CPU-only DeepFilterNet CLI starts and completes.
- `fixture_integrity`: generated 48 kHz mono WAV fixture exists; no real media.
- `enhanced_audio_artifacts`: enhanced WAV exists and decodes.
- `audio_safety_metrics`: RMS, peak dBFS, duration, and clipping metrics are
  recorded.
- `artifact_privacy`: all outputs are private staging GCS objects.
- `blocked_features`: RNNoise, Demucs, providers, Revideo, FILM, slow motion,
  production, beta, and broad real media remain blocked.

## Limitations

Generated-audio QA does not prove subjective real-video cleanup quality. Phase
36D remains a separate controlled real-video sample and requires its own
listening/metric review.
