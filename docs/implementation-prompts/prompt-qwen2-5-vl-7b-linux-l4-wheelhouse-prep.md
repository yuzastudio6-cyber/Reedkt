# QWEN2_5_VL_STACK_TOOL_7: prepare Qwen2.5-VL Python 3.12 Linux L4 wheelhouse, no inference

## Goal

Prepare a private binary wheelhouse or resolver-proof packet for Qwen2.5-VL 7B using Python 3.12 / `cp312` Linux x86_64 as the selected worker runtime target.

## Baseline

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Runtime alignment evidence: `docs/qwen2-5-vl-7b-python-runtime-alignment.md`
- Controlled dependency result: `docs/qwen2-5-vl-7b-controlled-dependency-install-result.md`
- Runtime dependency plan: `docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md`
- VLM requirements: `server/workers/vlm-runtime/requirements.vlm.txt`
- First GPU target: NVIDIA L4 / Google Cloud G2

## Required Scope

- Use Python 3.12 / `cp312` Linux x86_64 as the first dependency proof target.
- Keep the first GPU target on NVIDIA L4 / Google Cloud G2.
- Preserve all committed VLM dependency pins.
- Keep the wheelhouse private and outside the repository.
- Produce checksum evidence for every resolved artifact if a wheelhouse is created.
- Preserve offline/no-index install intent for the future worker import proof.
- Keep Qwen2.5-VL visual understanding/planning/QA only.

## Forbidden Actions

- Do not run inference.
- Do not import the model.
- Do not initialize CUDA.
- Do not start vLLM, SGLang, or an API server.
- Do not create a VM unless a later prompt explicitly authorizes it.
- Do not install dependencies into the repo, frontend, API, render worker, or general developer environment.
- Do not generate video, captions, frames, or assets.
- Do not call providers.
- Do not dispatch workers.
- Do not mutate Supabase, SQL, storage, credits, or billing.
- Do not create public artifacts or signed URLs.
- Do not unlock beta or production.

## Exit Criteria

- The Python 3.12 Linux x86_64 dependency path is either validated with private wheelhouse evidence or blocked with a specific resolver/package reason.
- Any created wheelhouse is outside the repo and checksum-manifested.
- No package pins are loosened without a separate source-of-truth review.
- The next prompt is limited to a no-inference metadata loader import proof or a targeted dependency fix.
