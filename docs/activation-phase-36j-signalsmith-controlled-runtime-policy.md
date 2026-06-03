# Phase 36J Signalsmith Controlled Runtime Policy

Phase 36J reuses the Phase 36I Signalsmith Stretch source/runtime selection:

- tag: `1.1.0`
- commit: `44c8f865af9da8c29cc4a70a2d5a3ec83639c711`
- runtime: temp-only C++ runner, no vendored source, no committed binary

The controlled runtime must pass Phase 36I evidence loading before it processes the selected bounded sample. Rebuilding the temp runner requires current-shell source-fetch and runtime-build confirmations. Phase 36J does not run DeepFilterNet, Demucs, generated fixture reruns, OCR, VLM, providers, Docker, Cloud Run, Track A, production, or beta.
