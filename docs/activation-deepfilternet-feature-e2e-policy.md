# Phase 36E DeepFilterNet Feature E2E Policy

Phase 36E is a private internal readiness gate. It may run DeepFilterNet on the
approved Phase 32 controlled export only, using approved private Phase 36B
artifacts and Phase 36D evidence.

Allowed:
- private GCS reads/writes under Phase 36E prefixes
- CPU-only Cloud Run Job execution
- FFmpeg audio extraction and private review MP4 remux
- local Finder copy of the private review MP4 outside the repo

Blocked:
- `/Users/macuser/Downloads/IMG_6024.MOV` and all arbitrary media
- RNNoise, Demucs, providers, Revideo, FILM, slow motion
- model/tool downloads or alternate DeepFilterNet artifacts
- public URLs, public buckets, final delivery, production, external beta, paid
  production, and broad real media
