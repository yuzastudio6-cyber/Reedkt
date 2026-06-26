# QWEN2_5_VL_STACK_TOOL_9-RETRY-US-CENTRAL1-C: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof in us-central1-c, no inference

## Goal

Retry the controlled Qwen2.5-VL L4 CUDA visibility and vLLM import proof in `us-central1-c`, after `us-central1-b` and `us-central1-a` both returned zonal stockout for the approved `g2-standard-8` plus one NVIDIA L4 shape.

This prompt may create one bounded no-public-IP NVIDIA L4 / Google Cloud G2 proof VM in `us-central1-c` only after repeating all safety preflight checks. It may transfer the private Qwen wheelhouse and model cache, run CUDA visibility, import `torch`, `transformers`, `qwen_vl_utils`, and `vllm`, and run the metadata loader gate. It must not run inference or start serving.

## Inputs

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Model revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Selected retry zone: `us-central1-c`
- Prior `us-central1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md`
- Prior `us-central1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- Stockout plan: `docs/qwen2-5-vl-7b-l4-stockout-plan-result.md`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`
- Loader gate: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`

## Required Preflight

Before any VM creation:

- verify active project is `reeditpro`;
- verify active account is expected;
- verify Compute Engine API is enabled;
- verify IAP API is enabled;
- verify `g2-standard-8` is visible in `us-central1-c`;
- verify `nvidia-l4` is visible in `us-central1-c`;
- verify regional `NVIDIA_L4_GPUS` limit is at least `1` and usage is `0`;
- verify project-wide `GPUS_ALL_REGIONS` limit is at least `1` and usage is `0`;
- verify proof service account exists and has no user-managed keys;
- verify IAP SSH firewall is present and scoped to the proof target tag;
- verify no matching proof VM, disk, address, or reservation exists in `us-central1-c`;
- verify private wheelhouse and private model cache are present locally;
- verify final bounded cost and cleanup plan.

## Allowed Work

- Create one no-public-IP `g2-standard-8` VM in `us-central1-c` with one NVIDIA L4 only if all preflight checks pass.
- Use IAP-only SSH/SCP.
- Transfer the private Qwen wheelhouse, private Qwen model cache, loader gate, and minimal proof files.
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

- CUDA visibility result on NVIDIA L4 in `us-central1-c`, or a clean stockout/blocked result.
- vLLM import result without serving if the VM exists and dependency install passes.
- Metadata loader remains `passed_metadata_import_only` if the VM exists and model transfer passes.
- VM cleanup verified.
- All runtime side-effect gates remain false except the explicitly allowed proof VM, IAP transfer, SSH, offline install, CUDA visibility check, import checks, metadata loader import, and cleanup evidence.
