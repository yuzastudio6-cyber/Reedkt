# Supabase Track B Backfill After Clean Staging Branch

Use this prompt only after the clean staging branch execution reports show schema/RLS and migration history verification passed.

Required clean target reference: `docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_target_reference.json`

Current clean branch readiness: `blocked`

Current migration transport: `blocked`

Current branch create diagnostics: `branch_create_plan_or_billing_unavailable`

Current branch create retry: `skipped`

Run PR #198 preflight/diff/report first. Do not write Track B rows until a separate guarded backfill execution phase sets the required Track B confirmations.
