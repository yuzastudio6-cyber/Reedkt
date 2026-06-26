# QWEN2_5_VL_STACK_TOOL_4: controlled Qwen2.5-VL runtime dependency install plan, no inference

## Goal

Plan the controlled worker/runtime dependency install path needed before Qwen2.5-VL 7B can pass a private metadata loader import gate.

## Baseline

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Loader gate evidence: `docs/qwen2-5-vl-7b-private-loader-import-gate.md`
- Loader gate script: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`
- First GPU target: NVIDIA L4 / Google Cloud G2

## Required Scope

- Decide the controlled install surface for `transformers`, `torch`, and `qwen_vl_utils`.
- Decide whether the first runtime import path should use Transformers-only metadata import, vLLM, SGLang, or a staged sequence.
- Keep the first import gate no-inference.
- Preserve the private cache as the only runtime model source.
- Preserve `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, and `MODEL_DOWNLOADS_ENABLED=false`.

## Forbidden Actions

- Do not run inference.
- Do not start vLLM, SGLang, or an API server.
- Do not generate images, video, captions, or assets.
- Do not call providers.
- Do not dispatch workers.
- Do not mutate GCP, Supabase, SQL, storage, credits, or billing.
- Do not create public artifacts or signed URLs.
- Do not unlock beta or production.

## Exit Criteria

- Dependency install surface is documented and owner-approved.
- GPU target remains L4/G2 first unless the plan documents why a higher-cost GPU is required.
- Qwen remains a visual understanding/planning/QA tool, not an AI-video generation route.
- Next execution prompt is limited to controlled dependency install or no-inference metadata import.
