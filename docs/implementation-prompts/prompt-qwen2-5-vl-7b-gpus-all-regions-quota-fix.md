# QWEN2_5_VL_STACK_TOOL_10: request or verify GPUS_ALL_REGIONS quota for Qwen L4 import proof, no VM/no inference

## Goal

Resolve the project-wide Google Cloud GPU quota blocker for the Qwen2.5-VL L4 CUDA visibility and vLLM import proof.

The current blocker is:

```text
GPUS_ALL_REGIONS limit: 0
GPUS_ALL_REGIONS usage: 0
```

Regional `NVIDIA_L4_GPUS` quota is available, but project-wide `GPUS_ALL_REGIONS=0` blocks any L4 VM creation before CUDA or vLLM import proof can run.

## Allowed Work

- Re-run read-only quota verification.
- Confirm `g2-standard-8` and `nvidia-l4` visibility in `us-central1-b`.
- Verify project-wide `GPUS_ALL_REGIONS`.
- If the quota has already been fixed externally, produce a no-VM readiness report.
- If quota remains blocked, produce a quota-owner request packet.

## Forbidden Work

- Do not create a VM.
- Do not create disks, networks, firewall rules, service accounts, keys, buckets, Artifact Registry images, reservations, or Cloud Run jobs.
- Do not run IAP transfer.
- Do not open SSH.
- Do not install dependencies on a VM.
- Do not import CUDA runtime on a VM.
- Do not import vLLM on a VM.
- Do not start vLLM or SGLang.
- Do not start an API server.
- Do not run model inference.
- Do not generate video, frames, captions, or assets.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not create public artifacts.
- Do not create signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Expected Output

If quota is fixed:

- `GPUS_ALL_REGIONS` limit is at least `1`.
- Regional `NVIDIA_L4_GPUS` limit is at least `1`.
- Recommended next prompt is `QWEN2_5_VL_STACK_TOOL_9-RETRY: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference`.

If quota is still blocked:

- Record `GPUS_ALL_REGIONS=0`.
- Recommend a manual or owner quota-request step.
- Keep all runtime side-effect gates false.
