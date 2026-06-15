# OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1_RERUN_AFTER_DEPENDENCY_REPAIR

Use the source branch containing `dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun` as the base for a fresh Batch 1 approval rerun.

Scope remains approval/diagnostics only unless a later prompt explicitly authorizes install/proof execution. Re-run the Batch 1 candidate review for DuckDB, Polars, Sharp/libvips, FFmpeg, FFprobe, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.

Required guardrails:

- verify `npm ci --ignore-scripts --no-audit --no-fund` still passes before approving any follow-up
- do not add new tool dependencies during the approval rerun
- do not execute tools, workers, routes, providers, media/audio/render/image/browser/map paths, Supabase/SQL/GCS, public artifacts, signed URLs, raw prompts, PR merges, beta, or production
- keep Supabase classification at no write, environment none, SQL none, migration no

Expected next decision after a successful approval rerun is a Batch 1 approval-only result, not install/proof execution.
