# Phase 39C-SG-FIXED Web Research

The fixed-kernel path is based on current upstream evidence:

- SGLang issue #8432 reports `cuGreenCtxDestroy` with SGLang 0.4.9.post4, `sgl-kernel` 0.2.7, CUDA_HOME 12.2, NVIDIA driver 535.86.10, and PyTorch 2.7.1+cu126.
- SGLang issue #8566 reports the same `sgl_kernel/common_ops.abi3.so` import failure.
- SGLang PR #9021 is merged and titled `Runtime check CUDA driver version to avoid unresolved green context symbols`.
- SGLang PR #9231 is merged and makes green-context spatial operations an optional/lazy extension path.
- Cloud Run GPU docs state GPU driver libraries are mounted under `/usr/local/nvidia/lib64` and CUDA versions greater than 12.2 need forward compatibility packages or a suitable NVIDIA base image.
- Qwen SGLang docs describe SGLang as an official deployment path and warn that invalid local model paths can trigger Hugging Face downloads.

## Package Defaults

- Minimal fixed wheel profile: `sgl-kernel==0.3.6.post1`.
- Current stable SGLang profile: `sglang[all]==0.5.12.post1`.
- Current kernel overlay profile: `sgl-kernel==0.3.21` and `sglang-kernel==0.4.3`.

These package choices are not production approval. They are import-smoke candidates for deterministic generated synthetic fixture verification only.
