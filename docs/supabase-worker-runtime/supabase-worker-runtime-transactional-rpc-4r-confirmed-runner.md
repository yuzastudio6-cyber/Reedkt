# RPC 4R Confirmed Runner

Runner: `npm run supabase-worker-runtime:transactional-rpc-4r-confirmed`

Script: `scripts/validation/supabase-worker-runtime-transactional-rpc-4r-confirmed.mjs`

## Behavior

The runner is fail-closed by default.

If any required confirmation gate is absent, the runner records:

- decision `blocked_pending_rpc_4r_confirmed_staging_sql_gates`
- execution `blocked_confirmation_absent_no_sql_execution`
- Supabase environment touched `none`
- SQL executed `none`
- migration deployed `no`
- readback status `not_run`

If all six gates are present, the runner next requires `REEDITPRO_SUPABASE_TARGET_RLS_STORAGE_VALIDATION_REPORT` to point to a successful sanitized report from `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED`.

If target validation is missing or mismatched, the runner records exactly one target-validation blocker and still performs no SQL.

If target validation is present and passed, this Codex runner still stops before SQL execution and records `blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner`. That keeps SQL execution in a separately approved staging environment with explicit credential handling and readback evidence.

## Evidence Output

Local generated output path:

`/tmp/reeditpro-supabase-worker-runtime-transactional-rpc-4r-confirmed/<runId>/`

Generated local files:

- `rpc-4r-confirmed-report.json`
- `rpc-4r-confirmed-manifest.json`

Generated `/tmp` files are local evidence only and must not be committed.

## Current Run

Current runner result: `blocked_pending_rpc_4r_confirmed_staging_sql_gates`

Current runner execution: `blocked_confirmation_absent_no_sql_execution`

Fail-closed run ID: `2026-06-25T19-57-29-617Z-5235a297`

Fail-closed report: `rpc-4r-confirmed-report.json`, bytes `2690`, SHA-256 `1d62590b3ec56d06275d868ca414ce30ccacd14949bfbd29f7b68e444d4512ea`

Fail-closed manifest: `rpc-4r-confirmed-manifest.json`, bytes `626`, SHA-256 `d9e8bf140bc804f452da8f4401f559fd64ca8257b9fcb3a6265033360beac7e1`

Package-lock: unchanged

Generated artifacts committed: none
