# AI Video B-roll Generation Python / CUDA Compatibility Plan

Status: `ai_video_broll_gen_3_python_cuda_compatibility_plan_no_execution`

Gate 3 plans compatibility checks for a future install gate. It does not inspect local GPUs, install drivers, install Python packages, create environments, start containers, or run model code.

## Compatibility Targets

| Layer | Planned target | Reason |
| --- | --- | --- |
| Python | Python 3.10+ | Wan, LTX, and Mochi planning surfaces all assume modern Python workers. |
| Package isolation | future private virtual environment outside tracked source | Prevent package churn, global pollution, and accidental runtime coupling. |
| PyTorch | future CUDA-compatible build chosen by runtime owner | AI video inference is GPU-bound; CPU remains diagnostics-only. |
| Diffusers | shared future model-loading path for Wan and LTX first | Reduces duplicate tool chains and keeps cost-friendly preview lanes simpler. |
| CUDA | future owner-selected local or cloud GPU stack | Must match GPU, PyTorch, worker image, and cost envelope. |
| FFmpeg/ffprobe | blocked in this lane | Track A and Track B own media processing, mux, export, and probe execution. |

## Cost-Friendly GPU Tiers To Review Later

| Tier | Candidate use | Gate 3 note |
| --- | --- | --- |
| small-preview | Wan 1.3B or LTX preview | First target for cost-friendly proof after install/runtime approval. |
| mid-720p | Wan I2V/T2V 14B or larger LTX variants | Requires stronger GPU and queue/cost review. |
| high-research | Mochi or high-quality Wan/LTX experiments | Research-only until owner evidence justifies cost. |
| premium-gated | HunyuanVideo or other premium benchmarks | Blocked until legal/territory/commercial and GPU review. |

## Blocked Until Later

- Actual GPU detection.
- Driver or CUDA installation.
- Python dependency installation.
- Model repository clone into runtime.
- Model import.
- Any generated media proof.
- Docker, Cloud Run, GCP, Artifact Registry, or Secret Manager.
- Supabase rows, storage objects, signed URLs, or public artifacts.

## Owner Handoff

`WORKER_RUNTIME_JOBS` must accept worker image, local proof path, GPU queue, idempotency, private artifact, retry, and cleanup requirements before any real install or import.

`BILLING_STRIPE_CREDITS` must accept cost placeholders before user-facing generation planning can estimate credits.

`PROVIDER_GATEWAY_MODELS` must confirm this open-source lane does not duplicate hosted provider transport or secrets.
