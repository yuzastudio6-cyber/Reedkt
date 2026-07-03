# Dependency Baseline Revalidation

Decision: `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution`.

The prior Batch 1 blocker `blocked_pending_package_lock_sync_review` is resolved by PR #427 with decision `dependency_baseline_repair_passed_ready_for_batch_1_approval_rerun`.

This rerun approval does not mutate dependencies. `package-lock.json` remains unchanged in this packet, and the future Batch 1 proof must also avoid package-lock mutation and dependency installation.

Allowed validation for the dependency baseline only: `npm ci --ignore-scripts --no-audit --no-fund`.

Forbidden new dependency names for this approval: `duckdb`, `polars`, `ffmpeg`, `ffprobe`, `d3`, `echarts`, `vega`, and `vega-lite`.

Supabase classification: update required `no write`, environment touched `none`, SQL `none`, migration `no`.
