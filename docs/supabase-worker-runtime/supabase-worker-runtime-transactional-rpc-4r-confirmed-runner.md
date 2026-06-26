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

Current runner result: `blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner`

Current runner execution: `blocked_confirmed_target_validation_present_but_no_sql_execution_in_codex_session`

Credential context decision: `completed_approved_supabase_credential_alias_presence_preflight_no_payload_access`

Target validation dependency: `passed_confirmed_supabase_target_rls_storage_validation`

Confirmed run ID: `2026-06-26T15-20-14-905Z-577a0b5f`

Confirmed output directory: `/tmp/reeditpro-supabase-worker-runtime-transactional-rpc-4r-confirmed/2026-06-26T15-20-14-905Z-577a0b5f`

Confirmed report: `rpc-4r-confirmed-report.json`, bytes `3988`, SHA-256 `0397747bef9c0adb48b445de69e28685ff5a25b71aa0e22c3bd8cb0b1ec72c86`

Confirmed manifest: `rpc-4r-confirmed-manifest.json`, bytes `723`, SHA-256 `9d0fda2f43cb26cea7343224dafd4a9a72d9cbf765773ce293d82a23ea47aa23`

Manifest checksum policy: `manifest_file_checksum_recorded_outside_self_referential_manifest`

Package-lock: unchanged

Generated artifacts committed: none
