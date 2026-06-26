# QWEN2_5_VL_STACK_TOOL_1: approve exact Qwen2.5-VL model revision and checksum plan, no inference

## Goal

Approve an exact model revision and checksum plan for `Qwen/Qwen2.5-VL-7B-Instruct` before any model download, import, inference, worker execution, GCP mutation, Supabase mutation, provider call, generated media, beta, or production use.

## Scope

- Confirm the exact upstream revision or commit to use.
- Define the expected private model-weight path.
- Define file-list and checksum manifest requirements.
- Confirm license/provenance evidence.
- Confirm L4-first GPU fit assumptions and escalation criteria.
- Confirm no-auto-download runtime requirement.

## Required Source Rules

- Runtime must load from an approved private local model path.
- Worker execution must use approved snapshots and manifests, not raw chat.
- Model hub IDs may appear in planning metadata, but worker execution must not auto-download from a public hub.
- Qwen2.5-VL remains a visual-understanding/planning QA tool, not an AI video generation model.

## Forbidden Actions

- Do not download model weights.
- Do not import `vllm`, `transformers`, or Qwen runtime packages for model execution.
- Do not run inference.
- Do not create generated media or generated assets.
- Do not create public artifacts or signed URLs.
- Do not call providers.
- Do not dispatch workers.
- Do not mutate Supabase.
- Do not run SQL.
- Do not mutate GCP.
- Do not run Docker.
- Do not unlock beta or production.

## Exit Criteria

- Exact revision/checksum plan documented.
- Private path and no-auto-download rule documented.
- L4-first GPU target remains accepted or escalation criteria are documented.
- All execution gates remain false.
