# QWEN2_5_VL_STACK_TOOL_6: align Qwen2.5-VL dependency runtime to Python 3.12 or Linux L4 worker, no inference

## Goal

Align the Qwen2.5-VL dependency install proof with a compatible worker runtime after the macOS arm64 Python 3.13 binary-only preflight blocked on `numpy==1.26.4`.

## Baseline

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Loader gate evidence: `docs/qwen2-5-vl-7b-private-loader-import-gate.md`
- Dependency install plan: `docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md`
- Controlled dependency result: `docs/qwen2-5-vl-7b-controlled-dependency-install-result.md`
- First GPU target: NVIDIA L4 / Google Cloud G2

## Required Scope

- Choose a compatible runtime target for the pinned VLM dependency set.
- Prefer a Python 3.11/3.12 Linux worker environment for the next dependency proof.
- Preserve L4/G2 as the first cost-friendly GPU runtime target.
- Keep Qwen2.5-VL visual understanding/planning/QA only.
- Preserve the private cache as the only model source.
- Preserve `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, and `MODEL_DOWNLOADS_ENABLED=false`.

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

- Runtime target is compatible with the pinned dependency set.
- Dependency proof can install binary wheels without source compilation.
- Qwen remains a visual understanding/planning/QA tool, not an AI-video generation route.
- Next step is limited to controlled dependency install or no-inference metadata loader import.
