# Phase 36H DeepFilterNet Runtime Hardening Worker

This worker is for the bounded Phase 36H runtime hardening path only.

- Uses temp workspace paths supplied by the server activation module.
- Uses the approved private DeepFilterNet v0.5.6 CLI and DeepFilterNet3 ONNX archive.
- Generates synthetic audio and processes one approved controlled audio window only.
- Does not accept arbitrary media paths or public URLs.
- Does not run Demucs, Signalsmith Stretch, OCR, VLM, providers, Docker, Cloud Run, or Track A.
