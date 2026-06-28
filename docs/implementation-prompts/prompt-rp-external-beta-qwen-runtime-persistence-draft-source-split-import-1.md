# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-DRAFT-SOURCE-SPLIT-IMPORT-1

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11` records `completed_qwen_runtime_persistence_local_harness_retry_11_active_baseline_passed_qwen_draft_source_absent`.

## Goal

Import the narrow QWEN runtime persistence draft SQL and local SQL test source needed for local validation, without importing the broad stacked branch chain.

## Required Scope

Inspect the open QWEN stack and import only the draft SQL/test files and matching source records required to validate QWEN backend runtime persistence against the now-passing active baseline.

## Boundary

Do not touch remote Supabase, staging, production, Cloud Run, provider/model calls, worker dispatch, media processing, signed/public artifacts, package installs, deployment, broad external beta, production, or final export. Any harness retry after this import must be a separate guarded local-only validation packet.
