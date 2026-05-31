# Phase 39C VLM Runtime Worker

This worker is for generated synthetic Qwen3-VL runtime verification only. It must use a local model directory copied from verified private Phase 39B GCS assets and must not pass `Qwen/Qwen3-VL-8B-Instruct` as a runtime model id.

Blocked in this worker:

- real frames, real video, arbitrary images, arbitrary uploaded files
- raw prompt execution
- provider APIs or OpenAI-compatible VLM endpoints
- runtime model auto-download
- public artifacts
- beta, production, broad media, and Track A

The worker emits JSON-only fixture results. If vLLM cannot initialize or a network/model-download attempt is detected, Phase 39C remains blocked.
