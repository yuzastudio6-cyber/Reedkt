# QWEN2_5_VL_STACK_TOOL_8: install Qwen2.5-VL Linux L4 wheelhouse in isolated worker runtime and run metadata loader import proof, no inference

## Goal

Use the prepared private Python 3.12 Linux x86_64 wheelhouse to perform the next isolated worker-runtime proof for Qwen2.5-VL 7B.

## Baseline

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Wheelhouse evidence: `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- Wheelhouse manifest: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64/SHA256SUMS.json`
- Runtime dependency plan: `docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md`
- Loader gate script: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`
- First GPU target: NVIDIA L4 / Google Cloud G2

## Required Scope

- Use Python 3.12 / `cp312` Linux x86_64.
- Use the private wheelhouse as the only package source.
- Keep package resolution offline/no-index.
- Keep the private model cache as the only model source.
- Run at most a metadata loader import proof after dependencies are isolated.
- Preserve Qwen2.5-VL as visual understanding/planning/QA only.
- Keep L4 / Google Cloud G2 as the first runtime proof target.

## Forbidden Actions

- Do not run inference.
- Do not generate video, frames, captions, or assets.
- Do not initialize a public provider path.
- Do not auto-download model weights.
- Do not use a model ID as the runtime source when the private cache path is required.
- Do not start vLLM, SGLang, or an API server.
- Do not dispatch workers.
- Do not mutate Supabase, SQL, storage, credits, or billing.
- Do not create public artifacts or signed URLs.
- Do not unlock beta or production.

## Exit Criteria

- The isolated Python 3.12 Linux runtime either installs from the private wheelhouse and passes the no-inference metadata loader import proof, or exits with a precise package/import blocker.
- The proof records package versions, offline guards, private cache path, and no-inference runtime gates.
- No model generation, no user-media processing, no public artifacts, and no production/beta route claims are made.
