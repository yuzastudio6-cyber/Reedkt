# QWEN2_5_VL_STACK_TOOL_9: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference

## Goal

Run the next controlled proof for `Qwen/Qwen2.5-VL-7B-Instruct` on the selected cost-friendly NVIDIA L4 / Google Cloud G2 path.

This prompt may verify CUDA visibility and import the installed runtime libraries on an approved L4/G2 worker target, but it must not run model inference or start serving.

## Inputs

- Stack tool: `qwen_vl`
- Model revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`
- Prior result: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- Loader gate: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`
- Runtime requirements: `server/workers/vlm-runtime/requirements.vlm.txt`

## Required Guardrails

- Use the private wheelhouse as the only package source.
- Keep package resolution offline/no-index.
- Keep model loading local-files-only from the private cache.
- Preserve `HF_HUB_OFFLINE=1`.
- Preserve `TRANSFORMERS_OFFLINE=1`.
- Preserve `MODEL_DOWNLOADS_ENABLED=false`.
- Preserve `PROVIDER_EXECUTION_ENABLED=false`.
- Use NVIDIA L4 / Google Cloud G2 first.
- Prefer `g2-standard-8` for first proof.
- Use `g2-standard-4` only for minimal CUDA/import visibility if memory pressure stays low.

## Allowed Work

- Verify the L4 GPU is visible to the Python runtime.
- Import `torch`.
- Read `torch.cuda.is_available()` and device metadata.
- Import `transformers`, `qwen_vl_utils`, and `vllm`.
- Run the existing metadata loader gate with `--allow-metadata-import`.
- Capture sanitized evidence in a result document and diagnostics script.

## Forbidden Work

- Do not run inference.
- Do not call `model.generate`.
- Do not start `vllm serve`.
- Do not start SGLang.
- Do not start an API server.
- Do not dispatch workers.
- Do not call providers.
- Do not mutate Supabase.
- Do not execute SQL.
- Do not mutate GCP outside the explicitly approved proof target.
- Do not generate video, frames, captions, or assets.
- Do not create public artifacts.
- Do not create signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Expected Output

- CUDA visibility evidence for the selected NVIDIA L4 / G2 target.
- vLLM import evidence without serving.
- Metadata loader evidence remains `passed_metadata_import_only`.
- All runtime side-effect gates remain false except the explicitly allowed import/visibility checks.
- Recommended next prompt for no-inference local fixture planning or blocked remediation, depending on the result.
