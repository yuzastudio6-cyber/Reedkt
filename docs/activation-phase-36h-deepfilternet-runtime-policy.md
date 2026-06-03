# Phase 36H DeepFilterNet Runtime Policy

Phase 36H runs only the approved private DeepFilterNet v0.5.6 CLI/model artifact pair from Phase 36B/36C.

Runtime guards:

- Do not install repo dependencies.
- Do not change `package-lock.json`.
- Do not use PyPI `deepfilternet` as the execution path.
- Do not allow model auto-download.
- Do not use unverified DeepFilterNet models.
- Do not run Demucs or Signalsmith Stretch.
- Do not run OCR, VLM, providers, Track A, Docker, Cloud Build, Cloud Run, GPU jobs, or IAM mutation.
- Do not accept arbitrary media paths.
- Do not process broad media.

The approved CLI is Linux x86_64. A non-Linux or non-x64 host blocks local execution unless a future approved runtime environment or approved platform-specific artifact is added.
