# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PROMOTION-1

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12` records `completed_qwen_runtime_persistence_local_harness_retry_12_draft_sql_and_local_sql_tests_passed`.

## Goal

Review whether the validated draft SQL can be promoted into an active Supabase migration for a future guarded validation lane.

## Boundary

Do not touch remote Supabase, staging, production, Cloud Run, provider/model calls, worker dispatch, media processing, signed/public artifacts, package installs, deployment, broad external beta, production, or final export.

Promotion must remain source-only unless a later prompt explicitly authorizes a local/staging validation gate.
