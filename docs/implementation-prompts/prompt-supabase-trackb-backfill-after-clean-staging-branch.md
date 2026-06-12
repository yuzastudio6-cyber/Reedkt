# Supabase Track B Backfill After Clean Staging Branch

Use this prompt only after the clean staging branch execution reports show schema/RLS and migration history verification passed.

Required clean target reference: `docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_target_reference.json`

Current clean branch readiness: `passed`

Current migration transport: `passed`

Current migration apply: `passed`

Current schema/RLS verification: `passed`

Current branch create diagnostics: `none`

Current branch create retry: `skipped`

Current branching plan/billing evidence: `passed`

Run PR #198 preflight/diff/report first. Do not write Track B rows until a separate guarded backfill execution phase sets the required Track B confirmations.
