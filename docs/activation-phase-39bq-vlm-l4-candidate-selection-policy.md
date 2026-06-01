# Phase 39B-Q VLM L4 Candidate Selection Policy

Candidate selection is fail-closed and limited to official Qwen repositories.

Selection order:

1. `Qwen/Qwen3-VL-8B-Instruct-FP8`
2. `Qwen/Qwen3-VL-4B-Instruct`
3. `Qwen/Qwen3-VL-2B-Instruct`

Selection requirements:

- Model id must start with `Qwen/Qwen3-VL-`.
- Revision must be pinned to a 40-character commit SHA.
- Hugging Face metadata must show `license:apache-2.0`, `qwen3_vl`, `safetensors`, and `image-text-to-text`.
- Selected files must be exact model/tokenizer/processor/config files needed by vLLM.
- Runtime must use private staged files and a local verified model path only.

Rejected candidates:

- The original unquantized `Qwen/Qwen3-VL-8B-Instruct` BF16 candidate is not retried in this recovery path because Phase 39C already records L4 CUDA OOM evidence.
- Community quantizations, third-party variants, provider-only models, API-only models, non-Qwen models, larger models, and unapproved GPU-only paths are blocked.

Candidate A is preferred because it is an official Qwen FP8 variant of the original 8B Instruct model. If Candidate A fails before generated inference, Candidate B may be staged and attempted. If Candidate B fails, Candidate C may be staged and attempted. If Candidate C fails, VLM L4 recovery remains blocked.
