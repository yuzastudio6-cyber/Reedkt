# QWEN2_5_VL_STACK_TOOL_2: controlled private Qwen2.5-VL model weight download manifest, no inference

## Goal

Create a controlled private cache manifest for `Qwen/Qwen2.5-VL-7B-Instruct` at revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`, then verify local file checksums against the approved revision/checksum plan.

## Scope

- Download model files only into the approved private cache outside the repo.
- Recompute local sha256 for every downloaded file.
- Compare all five safetensor shard sha256 values against the approved remote LFS sha256s.
- Record local sha256s for metadata/tokenizer/config files.
- Prove no files are staged, copied into the repo, exposed publicly, uploaded, or served through signed URLs.

## Required Private Cache Path

`/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`

## Forbidden Actions

- Do not import `vllm`, `transformers`, or model runtime packages for execution.
- Do not start vLLM.
- Do not run CUDA.
- Do not run inference.
- Do not create generated images, videos, or assets.
- Do not mutate GCP.
- Do not mutate Supabase.
- Do not run SQL.
- Do not call providers.
- Do not dispatch workers.
- Do not upload storage objects.
- Do not create public artifacts or signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.

## Exit Criteria

- Private cache exists outside the repo.
- Manifest records file count, byte total, local sha256 values, and remote LFS comparisons.
- All runtime/execution flags remain false.
- Next prompt remains an import/runtime gate, not inference.
