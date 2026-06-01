# Phase 39C-SG SGLang VLM Runtime Evaluation

Phase 39C-SG evaluates SGLang as an alternate local runtime after the vLLM path failed semantic perception/localization on generated canaries.

This phase preserves:

- PR #66 as original unquantized BF16 8B L4 OOM evidence.
- PR #87 as official Qwen candidate staging/runtime evidence.
- PR #90 as structured-output enforcement evidence.
- PR #97 as vLLM perception canary/decomposed QA failure evidence.

Allowed scope:

- Already staged PR #87 official Qwen candidates only.
- Candidate debug order: 2B, then 4B, then 8B FP8.
- Final selection priority if multiple pass: 8B FP8, then 4B, then 2B.
- Exact private GCS object copy by PR #87 manifests.
- SHA-256 and aggregate checksum verification before runtime.
- SGLang local model path only.
- Generated synthetic canary and generated fixture images only.
- Private JSON QA artifacts only under `activation/phase39c/generated-vlm-sglang-runtime/<run-id>/`.

Blocked scope:

- No new model downloads or model staging.
- No model-id runtime path.
- No runtime auto-download from Hugging Face or ModelScope.
- No provider APIs, including Qwen/DashScope/Alibaba, Hugging Face Inference Providers, or OpenAI APIs.
- No real frames, real video, arbitrary media paths, public URLs, broad media, beta, production, or Track A.
- Phase 39D and Phase 39E remain blocked unless this generated-runtime gate passes.

The SGLang strategy matrix is SG0-SG7:

- SG0 capability introspection.
- SG1 text-only JSON/structured smoke.
- SG2 freeform generated-image perception canary, diagnostic only.
- SG3 labels-only structured output.
- SG4 coarse-region structured output.
- SG5 safe-zone reasoning.
- SG6 composed canonical report from SG3/SG4/SG5.
- SG7 optional strict full JSON report after decomposed QA passes.

A full pass requires one candidate to pass the canary thresholds and then all five original generated fixtures with decomposed QA. Freeform output, regex repair, extract-first-JSON, and manually patched output cannot count as a pass.

VLM tool-family beta status remains `blocked` until runtime execution proves generated fixture QA. If Phase 39C-SG passes, the status can become `phase-complete but tool-family incomplete`; controlled real-frame VLM and planning integration still remain separate later phases.

## Build Unblock Follow-up

PR #100 recorded that local `docker buildx build --platform linux/amd64 --push` hung before image digest creation and before Cloud Run execution. Phase 39C-SG-BUILD adds a guarded Cloud Build fallback using the same Dockerfile and same runtime policy. The Cloud Build path is allowed only for the staging SGLang generated-fixture image and still requires private PR #87 assets, local model path runtime, deterministic generated fixtures, and private QA artifacts.

Run `phase39c-sg-build-20260601T232400-overlay` used the guarded overlay Cloud Build fallback after the full remote rebuild also stalled during publish/finalization. Cloud Build succeeded with image digest `sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9`, and Cloud Run L4 executed all three PR #87 candidates. No candidate reached generated fixture inference because SGLang failed during engine import with unresolved CUDA driver symbol `cuGreenCtxDestroy` from `sgl_kernel/common_ops.abi3.so`. The SGLang path remains blocked pending an approved compatible SGLang/CUDA runtime image, different approved runtime/GPU class, or different approved VLM path.
