# QWEN2_5_VL_STACK_TOOL_9-CAPACITY-REVIEW: plan Qwen L4 capacity strategy after us-central1 stockout, no VM/no inference

## Goal

Plan the next Qwen2.5-VL L4 capacity strategy after `us-central1-b`, `us-central1-a`, and `us-central1-c` all returned zonal stockout for the approved `g2-standard-8` plus one NVIDIA L4 proof VM.

This is no-VM/no-inference planning. It must not create a VM, reserve capacity, change regions, create disks, open SSH, transfer files, install dependencies, import CUDA/vLLM, run inference, start serving, or mutate unrelated Google Cloud resources.

## Inputs

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Model revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- `us-central1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- `us-central1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md`
- `us-central1-c` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md`
- Quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`

## Required Planning Work

- Inspect read-only L4/G2 visibility and regional quota options outside `us-central1`.
- Identify whether any alternate region has both `g2-standard-8` and `nvidia-l4` visible and sufficient `NVIDIA_L4_GPUS` quota.
- Preserve the preferred cost-friendly GPU: one NVIDIA L4 on Google Cloud G2.
- Preserve the preferred Qwen proof shape: `g2-standard-8`.
- Keep no-public-IP and IAP-only access.
- Keep existing proof service account discipline and no user-managed keys.
- Avoid reservations unless a future owner prompt explicitly approves capacity reservation cost and cleanup.
- Compare these safe paths:
  - scheduled same-region retry window;
  - cross-region quota/capacity request;
  - explicitly approved capacity reservation;
  - separately approved smaller import-smoke shape only if memory risk is accepted.
- Recommend exactly one next prompt.

## Forbidden Work

- Do not create or delete a VM.
- Do not create disks, addresses, reservations, firewall rules, networks, buckets, or service accounts.
- Do not open SSH or IAP tunnels.
- Do not transfer the wheelhouse or model cache.
- Do not install dependencies.
- Do not run CUDA, vLLM, SGLang, an API server, or model imports.
- Do not run inference.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not generate video, frames, captions, or assets.
- Do not create public artifacts.
- Do not create signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Expected Output

- A capacity strategy after same-region stockout.
- Read-only regional quota/visibility table.
- One recommended next prompt:
  - same-region scheduled retry,
  - cross-region quota request,
  - capacity reservation approval,
  - or a smaller-shape import-smoke approval.
