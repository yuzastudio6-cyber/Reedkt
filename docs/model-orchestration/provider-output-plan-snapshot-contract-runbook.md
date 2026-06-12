# Provider Output Plan Snapshot Contract Runbook

Use `npm run activation:provider-output-plan-snapshot-contract:report` for local report generation.

Guarded execution requires `--execute`, `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_PROVIDER_OUTPUT_PLAN_SNAPSHOT_CONTRACT=true`.

Guarded execution uploads private JSON only to the PLAN-SNAPSHOT-1 generated and QA GCS prefixes. It does not call providers, execute runtime paths, write Supabase rows, run SQL, deploy migrations, or create public artifacts.
