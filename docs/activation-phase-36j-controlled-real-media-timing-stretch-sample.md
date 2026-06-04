# Phase 36J Controlled Real-Media Timing Stretch Sample

Phase 36J runs one bounded approved private controlled sample through the Phase 36I Signalsmith Stretch runtime path.

- Selected sample: `phase37d-phase32-color-export-safe-zone-window-v1`
- Chain: `controlled-real-video-chain-phase28-through-phase32-v1`
- Source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Source SHA-256: `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa`
- Window: `6.9s` through `8.9s`

The phase extracts only bounded 48 kHz mono PCM audio, runs `1.10x` and `0.90x` stretch gates, records the optional `1.25x` stress result as warning-capable evidence, and uploads private QA artifacts only to the Phase 36J QA prefix. It does not rerun generated fixtures, DeepFilterNet, Demucs, OCR, VLM, providers, Track A, Docker, Cloud Build, Cloud Run, production, beta, public output, broad media, or arbitrary media.

The local Phase 36J preflight blocked because `ffmpeg` and `ffprobe` were unavailable. The approved completion path is a private linux/amd64 CPU Cloud Run Job with `ffmpeg`/`ffprobe` installed; that runtime remains bounded to the same sample/window and does not unlock broader cloud execution.

The Phase 36J FFmpeg runtime rerun unblocked the local platform gap but did not complete the phase. Cloud Build and Artifact Registry push passed, and Cloud Run executed the linux/amd64 CPU worker. Worker logs show source acquisition/build, controlled sample SHA verification, and bounded extraction passed. The final blocker is private artifact upload: the CPU worker service account is missing `storage.objects.get` for the Phase 36J QA prefix, so JSON reports and private artifacts could not be uploaded/read back. Phase 36J remains blocked and the audio/timing tool-family beta status remains `blocked`.
