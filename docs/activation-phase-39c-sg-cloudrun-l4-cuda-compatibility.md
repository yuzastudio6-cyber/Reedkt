# Phase 39C-SG Cloud Run L4 CUDA Compatibility

Phase 39C-SG-FIXED tests SGLang only on the approved Cloud Run L4 shape: 1 x NVIDIA L4, 8 CPU, 32Gi memory, `us-central1`, job-only execution, no public service endpoint.

Cloud Run exposes GPU driver libraries in the runtime environment. The fixed-kernel import smoke records:

- `LD_LIBRARY_PATH` and whether `/usr/local/nvidia/lib64` is present.
- CUDA driver symbol probe status for `cuInit`, `cuDriverGetVersion`, `cuGreenCtxDestroy`, and `cuGreenCtxStreamCreate`.
- Torch CUDA version, CUDA availability, GPU name, driver version, and compute capability.
- SGLang launch-server import behavior.

CUDA forward compatibility is not assumed from documentation alone. It is a guarded profile path and remains blocked unless the selected SGLang/CUDA package set needs CUDA above Cloud Run's default compatibility envelope and the exact library ordering is supported by Cloud Run/NVIDIA evidence.

No profile may use a GPU type other than L4, broaden to a public service, or bypass import smoke.
