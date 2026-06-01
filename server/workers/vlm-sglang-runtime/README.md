# Phase 39C-SG SGLang VLM Runtime Worker

Server-only Cloud Run Job worker for deterministic generated fixture evaluation with SGLang.

It only uses already staged official Qwen candidates from PR #87. It copies exact private GCS object paths, verifies SHA-256 and aggregate hashes, prepares a local ephemeral model path, runs SGLang against generated synthetic fixtures, uploads private JSON QA artifacts, and exits.

Blocked by policy:

- new model downloads or model uploads
- model-id runtime paths
- runtime auto-downloads
- provider calls
- raw prompts or arbitrary media paths
- real frames, real video, broad media, public output
- beta, production, paid production, Phase 39D, Phase 39E, and Track A
