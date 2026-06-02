# Phase 39C-SG-KERNEL SGLang Kernel Compatibility on L4

Phase 39C-SG-KERNEL is a Track B-only recovery phase for the PR #104 SGLang import blocker:
`sgl_kernel/common_ops.abi3.so: undefined symbol: cuGreenCtxDestroy`.

This phase uses only the already staged PR #87 official Qwen candidates. It does not download new models, stage new model candidates, process real media, call providers, create public output, unlock beta/production, or touch Track A.

The runtime order is:

1. Build bounded SGLang kernel compatibility profile images through Cloud Build.
2. Run an import-only Cloud Run L4 smoke job for each built profile.
3. Stop after the first profile that imports SGLang, `sglang.srt`, `sglang.srt.layers.rotary_embedding`, Torch/CUDA, and required kernel modules without the `cuGreenCtxDestroy` failure.
4. Run generated synthetic fixture QA only after import smoke passes.

VLM tool-family beta status remains `blocked` unless one already staged official Qwen candidate passes generated fixture QA. Phase 39D and Phase 39E remain blocked either way until their separate prompts.

## 2026-06-02 Rerun Result

Run `phase39c-sg-kernel-20260602T0132` built or reused bounded kernel profile images and executed import-only Cloud Run L4 smoke jobs. No model files were copied and no generated fixture inference ran.

- K0 reused image digest `sha256:d099d3b3ccb51ce8f2c1c4dac054c3e35aaad8fbd8bfe154c5fcc12916d1a5cb` and failed import smoke.
- K1 current-stable wheel refresh was blocked by slow `sgl-kernel==0.2.8` wheel download in Cloud Build; K0 already covers that same kernel wheel/version on L4.
- K2 reused image digest `sha256:c18f32f96096f4828ed47c1e6b8f29fa0da57745969b5a106987e2f1eaa51af7` and failed import smoke.

The safe Cloud Run log summary shows `cuInit` and `cuDriverGetVersion` present but `cuGreenCtxDestroy` missing from the L4 driver/libcuda symbol set. Both K0 and K2 failed `sglang.srt.layers.rotary_embedding` import before model copy or inference.

Private smoke artifact upload also failed because the GPU worker service account does not have scoped object-create permission for the new `generated-vlm-sglang-kernel-compat` QA prefix. The raw Cloud Run logs were not committed; only the safe summary report is committed.

Phase 39C remains blocked. Generated fixture runtime did not run because no SGLang kernel profile passed import smoke.
