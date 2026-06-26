# QWEN2_5_VL_STACK_TOOL_9-RETRY: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference

## Goal

Retry the controlled Qwen2.5-VL L4 proof now that `GPUS_ALL_REGIONS` is approved to `1`.

This prompt may create one bounded no-public-IP NVIDIA L4 / Google Cloud G2 proof VM only after repeating all safety preflight checks. It may transfer the private Qwen wheelhouse and run CUDA visibility plus import checks. It must not run inference or start serving.

## Inputs

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Model revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`
- Prior quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Prior import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- Loader gate: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`

## Required Preflight

Before any VM creation:

- verify active project is `reeditpro`;
- verify active account is expected;
- verify Compute Engine API is enabled;
- verify `g2-standard-8` is visible in `us-central1-b`;
- verify `nvidia-l4` is visible in `us-central1-b`;
- verify regional `NVIDIA_L4_GPUS` limit is at least `1` and usage is `0`;
- verify project-wide `GPUS_ALL_REGIONS` limit is at least `1` and usage is `0`;
- verify proof service account exists and has no user-managed keys;
- verify IAP SSH firewall is present and scoped to the proof target tag;
- verify no matching proof VM, disk, address, or reservation exists;
- verify final bounded cost and cleanup plan.

## Allowed Work

- Create one no-public-IP `g2-standard-8` VM with one NVIDIA L4 only if all preflight checks pass.
- Use IAP-only SSH/SCP.
- Transfer the private Qwen wheelhouse and minimal proof files.
- Install dependencies offline/no-index from the private wheelhouse.
- Check `torch.cuda.is_available()` and device metadata.
- Import `torch`, `transformers`, `qwen_vl_utils`, and `vllm`.
- Run the metadata loader gate with `--allow-metadata-import`.
- Capture sanitized evidence.
- Delete the VM and verify cleanup.

## Forbidden Work

- Do not run inference.
- Do not call `model.generate`.
- Do not start `vllm serve`.
- Do not start SGLang.
- Do not start an API server.
- Do not dispatch workers.
- Do not call providers.
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

- CUDA visibility result on NVIDIA L4.
- vLLM import result without serving.
- Metadata loader remains `passed_metadata_import_only`.
- VM cleanup verified.
- All runtime side-effect gates remain false except the explicitly allowed proof VM, transfer, offline install, import checks, CUDA visibility check, and cleanup evidence.
