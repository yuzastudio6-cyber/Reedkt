# Phase 31 Audio Cleanup QA Policy

Phase 31 QA emits:

- `audio_loudness`
- `audio_sync`
- `audio_naturalness`
- `music_over_voice`
- `export_codec_format`
- `export_duration_sync`
- `final_delivery`

`audio_naturalness` and `music_over_voice` are warning-only because Phase 31 does not run perceptual or model-based analysis. `final_delivery` can pass only for the private Phase 31 normalized export.
