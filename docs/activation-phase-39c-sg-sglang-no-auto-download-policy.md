# Phase 39C-SG SGLang No Auto-Download Policy

Phase 39C-SG exists to test already staged private model assets, not to acquire or cache models at runtime.

Required guards:

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- local temp-only cache directories
- exact PR #87 private GCS object copy
- local model path passed to SGLang

Blocked:

- Hugging Face model IDs as runtime model paths.
- ModelScope or Hugging Face runtime download.
- public URLs, signed URLs, and provider endpoints as source of truth.
- new model candidates or community quantizations.

If SGLang cannot start from the verified local model directory without network/model download behavior, Phase 39C-SG remains blocked.
