# Phase 39C-SG-FIXED SGLang Kernel Runtime

Phase 39C-SG-FIXED is a Track B only recovery path for the SGLang `cuGreenCtxDestroy` import blocker recorded in PR #104 and PR #107.

The phase uses upstream SGLang evidence before attempting Cloud Run L4 generated runtime again. It does not download or stage new Qwen model files. Runtime may use only the official Qwen candidates already staged in PR #87, and only after an SGLang fixed-kernel import smoke passes on Cloud Run L4.

## Execution Policy

- Build fixed-kernel images through guarded Cloud Build only.
- Run import smoke on `reeditpro-stg-vlm-runtime-phase39c-sglang-fixed-smoke`.
- Run generated runtime on `reeditpro-stg-vlm-runtime-phase39c-sglang-fixed-runtime` only after import smoke passes.
- Use 1 x `nvidia-l4`, 8 CPU, 32Gi, staging only.
- Keep `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`.
- Use local verified model paths only.
- Keep Phase 39D, Phase 39E, beta, production, provider calls, public output, broad media, arbitrary media, and Track A blocked.

## Candidate Policy

Runtime candidate order after import smoke passes is C, B, A for cost and stability diagnostics. Final selection priority remains A, B, C.

No generated runtime pass may be claimed from package installation, Cloud Build success, import smoke alone, freeform traces alone, or repaired JSON.
