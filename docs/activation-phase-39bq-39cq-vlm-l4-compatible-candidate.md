# Phase 39B-Q/39C-Q VLM L4-Compatible Candidate Recovery

Phase 39B-Q/39C-Q is a Track B-only VLM recovery path after the original `Qwen/Qwen3-VL-8B-Instruct` BF16 Phase 39C Cloud Run L4 job copied and checksum-verified the model but failed with CUDA OOM during vLLM engine initialization before generated fixture inference.

The recovery path preserves PR #66 as the original 8B BF16 L4 OOM evidence and evaluates only official Qwen-owned candidates:

1. `Qwen/Qwen3-VL-8B-Instruct-FP8`
2. `Qwen/Qwen3-VL-4B-Instruct`
3. `Qwen/Qwen3-VL-2B-Instruct`

The guarded CLI is:

```bash
npm run activation:vlm-l4-compatible-candidate -- --execute --keep-temp
```

Execution is blocked unless the current shell sets the explicit non-secret confirmation variables for candidate approval, model download, private GCS upload, private GCS runtime read, runtime execution, private artifact upload, Docker build/push, staging Cloud Run job, and L4 GPU execution.

Allowed scope:

- Official Qwen candidate evidence, exact revision pinning, download, checksum, private GCS staging, and generated-fixture runtime verification.
- vLLM only with a verified local model directory path.
- Deterministic generated synthetic fixtures only.
- Private JSON QA artifacts only.

Blocked scope:

- Real frames, real video, arbitrary media, public URLs, provider APIs, raw prompts, tool execution from model output, public artifacts, production, internal beta, external beta, paid production, broad media, non-Qwen candidates, community quantizations, unapproved GPU types, and Track A.

Passing this recovery path can only make VLM status `phase-complete but tool-family incomplete`. Phase 39D controlled real-frame VLM and Phase 39E planning integration remain blocked.

## Execution Result

Run `phase39cq-20260531T235421` attempted all three approved official Qwen candidates. Source/license evidence, exact revision pinning, file selection, checksum generation, private GCS upload, and private GCS verification passed for each attempted candidate. The Cloud Run L4 runtime used local verified private model paths only and runtime auto-download stayed blocked.

Phase 39B-Q/39C-Q remains blocked. `Qwen/Qwen3-VL-8B-Instruct-FP8`, `Qwen/Qwen3-VL-4B-Instruct`, and `Qwen/Qwen3-VL-2B-Instruct` all reached generated vLLM fixture execution but failed the required structured output gate: fixture outputs did not parse as the required JSON schema. No candidate is selected for Phase 39D. The next VLM follow-up should target vLLM/Qwen structured-output enforcement and safe output trace capture, or use a separate approval path for a different GPU class or non-Qwen VLM if that does not pass.
