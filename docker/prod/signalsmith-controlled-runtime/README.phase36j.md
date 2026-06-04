# Phase 36J Signalsmith Controlled Runtime

This image is scoped to Track B Phase 36J controlled real-media timing/stretch completion.

- CPU-only linux/amd64 Cloud Run Job runtime.
- Installs `ffmpeg`, `ffprobe`, Python, Git, and a C++ compiler for the temp-only Signalsmith build.
- Copies only the Signalsmith controlled worker files.
- Does not bake media, audio payloads, source archives, build outputs, secrets, or private artifacts.
- Runtime copies exactly one approved private controlled sample from GCS after smoke/evidence gates and extracts only the `6.9s-8.9s` window.
- DeepFilterNet runtime, Demucs, OCR, VLM, providers, broad media, public output, production, beta, and Track A remain blocked.
