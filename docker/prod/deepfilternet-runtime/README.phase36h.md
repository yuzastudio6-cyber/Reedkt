# Phase 36H DeepFilterNet Linux Runtime

This image is scoped to Phase 36H Linux/amd64 DeepFilterNet runtime completion.

- CPU-only Cloud Run Job runtime.
- Installs `ffmpeg`, `ffprobe`, `python3`, and Google Cloud CLI.
- Copies only the Phase 36H Linux entrypoint worker.
- Does not bake DeepFilterNet binaries, model archives, media, audio payloads, generated artifacts, secrets, or runtime caches into the image.
- Runtime copies the approved private `deep-filter-0.5.6-x86_64-unknown-linux-musl`, `DeepFilterNet3_onnx.tar.gz`, and one approved controlled sample from private GCS, then verifies SHA-256 before execution.
- Signalsmith Stretch, Demucs, VLM, OCR, providers, broad media, public output, production, beta, and Track A remain blocked.
