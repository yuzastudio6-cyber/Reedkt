# QWEN2_5_VL_STACK_TOOL_9-STOCKOUT-PLAN: plan alternate G2/L4 zone retry or scheduled same-zone retry, no VM/no inference

## Goal

Plan the next retry after the controlled Qwen2.5-VL L4 proof was blocked by `ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS` for `g2-standard-8` with one NVIDIA L4 in `us-central1-b`.

This is planning-only. It must not create a VM, retry a create command, reserve capacity, change zones, create disks, open SSH, transfer files, install dependencies, import CUDA/vLLM, run inference, or start serving.

## Inputs

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Stockout result: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`

## Required Planning Work

- Re-check L4/G2 availability across acceptable Google Cloud zones with read-only commands only.
- Preserve the preferred cost-friendly GPU: one NVIDIA L4 on Google Cloud G2.
- Keep `g2-standard-8` as the preferred Qwen proof shape.
- Treat `g2-standard-4` only as a separately approved minimum import-smoke fallback if memory risk is accepted.
- Keep no-public-IP and IAP-only access.
- Keep the existing proof service account and no user-managed service-account keys.
- Keep the existing IAP SSH firewall boundary or document the exact owner approval needed if a different network tag is required.
- Avoid reservations unless a future owner prompt explicitly approves capacity reservation cost and cleanup.
- Recommend one bounded retry path.

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

- A stockout retry plan with one selected retry zone or a same-zone scheduled retry recommendation.
- A preflight checklist for the selected retry path.
- A bounded cost and cleanup policy.
- A next prompt for a single approved retry, or a blocked result if no safe zone is available.
