# Phase 39C-SG-KERNEL Import Failure Audit

PR #104 successfully built and pushed the SGLang runtime image through Cloud Build, then executed all PR #87 official Qwen candidates on Cloud Run L4. The blocker moved from local Docker/buildx to runtime import compatibility.

Observed failure:

- Shared object: `sgl_kernel/common_ops.abi3.so`
- Symbol: `cuGreenCtxDestroy`
- Stage: SGLang engine import before generated fixture inference
- Affected candidates: `Qwen/Qwen3-VL-2B-Instruct`, `Qwen/Qwen3-VL-4B-Instruct`, `Qwen/Qwen3-VL-8B-Instruct-FP8`

Public SGLang issues #8432 and #8566 record the same failure class. The likely cause is a CUDA driver / SGLang kernel wheel compatibility mismatch, so SG-KERNEL adds a bounded import-smoke matrix before any model-copy or fixture runtime.

Full raw Cloud Run logs remain private. Committed evidence is limited to safe metadata, package/profile versions, trace hashes/excerpts, and private artifact references.

## 2026-06-02 Kernel Profile Evidence

The Phase 39C-SG-KERNEL rerun confirmed the blocker on Cloud Run L4 before model copy or inference:

- K0 baseline `sgl-kernel==0.2.8`: `cuGreenCtxDestroy` missing; `sglang.srt.layers.rotary_embedding` import failed.
- K2 issue-compatible `sgl-kernel==0.2.6.post1`: `cuGreenCtxDestroy` missing; `sglang.srt.layers.rotary_embedding` import failed.
- CUDA symbol probe saw `cuInit` and `cuDriverGetVersion` present, but `cuGreenCtxDestroy` missing.

This means the selected SGLang wheel paths remain incompatible with the Cloud Run L4 driver/libcuda symbol set. Since import smoke failed, generated fixture inference stayed blocked.
