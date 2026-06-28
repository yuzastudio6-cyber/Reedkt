# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1` records `completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard`.

## Goal

Retry the local-only QWEN runtime persistence harness after the active QA exports migration source guard is present.

## Required Scope

Run only an approved local Supabase harness if the environment is explicitly suitable and bounded. The retry must verify whether the active baseline now reaches the QWEN draft SQL and local SQL tests.

## Boundary

Do not touch remote Supabase, staging, production, Cloud Run, provider/model calls, worker dispatch, media processing, signed/public artifacts, package installs, deployment, broad external beta, production, or final export. If the local harness is unavailable or unsafe, record the exact blocker and stop.
