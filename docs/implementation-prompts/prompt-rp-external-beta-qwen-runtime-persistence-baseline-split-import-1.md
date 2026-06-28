# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1` records `completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import`.

## Goal

Import the first narrow QWEN backend runtime persistence baseline source slice onto current integration.

## Required Scope

Start from the latest integration branch. Inspect open QWEN stack PR `#1465` and its immediate prerequisite chain. Import only the reviewed source needed for the current baseline persistence fix, starting with the `qa_reports.approved_plan_snapshot_id` compatibility guard and its matching docs/mock/smoke/readiness updates, if prerequisite source files are already present or explicitly included in the same narrow packet.

## Boundary

Do not merge the open stacked branch chain. Do not blindly cherry-pick. Do not run remote Supabase, SQL, migrations, Cloud Run, provider/model calls, worker dispatch, media processing, signed/public artifact flows, package installation, deployment, production, broad beta, or final export.
