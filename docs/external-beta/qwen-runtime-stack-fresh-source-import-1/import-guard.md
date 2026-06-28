# QWEN Runtime Stack Fresh Source Import Guard

Packet: `RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1`

Decision: `completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import`

Execution: `completed_docs_only_qwen_runtime_stack_import_guard_no_runtime_execution`

## Guard Decision

Direct stack merge: `not_approved`

Blind cherry-pick: `not_approved`

Fresh split import: `approved_next_path`

Reason: the open QWEN stack is branch-to-branch and currently differs from integration by `4412` paths. The safe way forward is a small source import sequence that applies one reviewed slice at a time to current integration.

## First Split Import Lane

Next milestone: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1`

First import scope should be restricted to the latest backend runtime persistence baseline fix family, starting with the `qa_reports.approved_plan_snapshot_id` compatibility guard and its associated docs/mock/smoke/readiness updates from `#1465`, only after confirming prerequisites from the preceding retry branches are already present or are explicitly imported in the same split packet.

That future split import may edit migration source files only as source code. It must not run remote Supabase, SQL, migrations, Cloud Run, provider/model calls, worker dispatch, media processing, package installation, production deployment, public artifacts, or final export.

## Supabase Changelog Note

Current Supabase changelog review found the 2026 breaking change that new public tables are no longer automatically exposed to the Data and GraphQL APIs. Any future actual schema source import must preserve explicit RLS/grant intent and must not assume table creation alone exposes a table safely.
