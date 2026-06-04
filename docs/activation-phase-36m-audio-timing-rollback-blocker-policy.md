# Phase 36M Audio/Timing Rollback And Blocker Policy

Rollback triggers:

- Phase 36H, 36I, 36J, or 36K evidence is missing, contradicted, or unsafe.
- Private artifact verification or upload reads audio, video, model files, signed URLs, public URLs, broad prefixes, or arbitrary prefixes.
- A committed Phase 36M report leaks raw audio, transcript, secret, credential, or sensitive media content.
- Demucs install/download/runtime/source separation is enabled before approval.
- DeepFilterNet or Signalsmith runtime reruns are attempted through Phase 36M.
- Provider, OCR, VLM, Track A, production, external beta, public output, broad media, or arbitrary media execution is attempted.

Rollback action: revoke the audio/timing internally beta-ready candidate status and return the tool family to `blocked` until corrected evidence is committed and the Phase 36M gate passes again.
