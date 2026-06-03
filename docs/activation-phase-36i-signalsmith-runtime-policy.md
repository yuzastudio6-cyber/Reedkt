# Phase 36I Signalsmith Runtime Policy

The runtime is local, CPU-only, temp-only, and generated-audio-only.

- Build a small C++ generated-fixture binary from the exact selected Signalsmith source.
- Record compiler version, build flags, binary hash, and source checksums.
- Keep build artifacts outside the repository.
- Do not install repo dependencies or change `package-lock.json`.
- Do not use Docker, Cloud Build, Cloud Run, GPU jobs, providers, OCR, VLM, DeepFilterNet runtime, Demucs, Track A, real media, controlled media, or arbitrary media.

Execution requires the Phase 36I confirmation variables for approval, source fetch, runtime build, generated audio, and private artifact upload.
