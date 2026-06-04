# Track B Route Blocked Scope Matrix

Phase 44I keeps these scopes blocked:

- production
- paid production
- product-wide internal beta
- external beta
- broad media
- arbitrary media input
- public artifacts
- public output
- provider calls
- Docker
- Cloud Build
- Cloud Run
- GPU jobs
- model downloads
- media/audio/OCR/VLM runtime execution
- worker execution
- IAM/GCP mutation
- raw chat execution
- direct tool execution from model output
- frontend service-role secrets
- Track A runtime/visual/render stack

Tool-specific blockers:

- Demucs: blocked pending training-data provenance, model-artifact provenance, and human/legal review.
- Qwen3-VL and vLLM: excluded because Phase 39C generated runtime verification remains blocked.
- Web capability profiler, desktop capability profiler, local worker sidecar planning, and cost estimator: not started.
- PaddlePaddle and tool route manifest integration: handoff-only, not direct user routes.
