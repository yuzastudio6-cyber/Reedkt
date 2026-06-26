# QWEN2_5_VL_STACK_TOOL_5: controlled Qwen2.5-VL dependency install in private worker environment, no inference

## Goal

Install the approved Qwen2.5-VL metadata-loader dependencies into an isolated private worker environment so the private loader gate can attempt metadata import without model inference.

## Baseline

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Loader gate evidence: `docs/qwen2-5-vl-7b-private-loader-import-gate.md`
- Dependency install plan: `docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md`
- Requirements source: `server/workers/vlm-runtime/requirements.vlm.txt`
- First GPU target: NVIDIA L4 / Google Cloud G2

## Required Scope

- Use an isolated private worker environment.
- Install or prepare the pinned dependency set required for no-inference metadata loader import.
- Preserve the private cache as the only model source.
- Preserve `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, and `MODEL_DOWNLOADS_ENABLED=false` during loader verification.
- Run `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py --allow-metadata-import` only if the dependency environment is ready and no model inference path is enabled.

## Forbidden Actions

- Do not run inference.
- Do not start vLLM, SGLang, or an API server.
- Do not generate images, video, captions, or assets.
- Do not call providers.
- Do not dispatch workers.
- Do not mutate Supabase, SQL, storage, credits, or billing.
- Do not create public artifacts or signed URLs.
- Do not unlock beta or production.

## Exit Criteria

- Dependency environment is created or blocked with exact evidence.
- Loader gate either passes metadata import only or remains blocked with exact dependency/CUDA evidence.
- Qwen remains a visual understanding/planning/QA tool, not an AI-video generation route.
- Next step is limited to no-inference runtime import proof or dependency repair.
