# Phase 39C-SG-KERNEL Import Smoke Policy

The import smoke job runs on Cloud Run L4 and does not receive model GCS paths, checksum manifests, or media paths.

It checks:

- Python, Torch, CUDA, and `nvidia-smi` metadata.
- Installed `sglang`, `sgl-kernel`, `sglang-kernel`, `xgrammar`, `guidance`, and `transformers` versions.
- Imports for `torch`, `sglang`, `sglang.srt`, `sglang.srt.layers.rotary_embedding`, `sgl_kernel`, and `sgl_kernel.common_ops`.
- Whether `cuGreenCtxDestroy` appears in import or launch-server help errors.

Only a passing import smoke can unlock generated synthetic fixture runtime for the same profile image.
