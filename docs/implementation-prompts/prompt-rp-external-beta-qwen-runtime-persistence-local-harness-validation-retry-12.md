# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-DRAFT-SOURCE-SPLIT-IMPORT-1` records `completed_qwen_runtime_persistence_draft_source_split_import_024_draft_sql_and_022_local_sql_tests`.

## Goal

Run a guarded local-only Supabase harness validation that reviews the imported QWEN draft SQL and local SQL tests against the active baseline.

## Boundary

Do not touch remote Supabase, staging, production, Cloud Run, provider/model calls, worker dispatch, media processing, signed/public artifacts, package installs, deployment, broad external beta, production, or final export.

The imported draft SQL remains a draft. Any active migration promotion requires a later reviewed packet.
