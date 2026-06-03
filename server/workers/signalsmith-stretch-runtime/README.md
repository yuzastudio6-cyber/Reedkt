# Phase 36I Signalsmith Stretch Runtime Worker

Temp-only generated audio runner for Phase 36I.

- Fetches the exact Signalsmith Stretch source revision outside the repo.
- Builds a small C++ generated-fixture binary in a temp workspace.
- Processes deterministic generated WAV fixtures only.
- Never accepts real media, controlled media, arbitrary paths, providers, OCR, VLM, Demucs, DeepFilterNet runtime, or Track A execution.
- Writes safe JSON reports and optional private generated WAV artifacts only to the configured temp/private artifact directory.
