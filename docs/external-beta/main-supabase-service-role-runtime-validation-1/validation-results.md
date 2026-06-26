# Validation Results

Packet: `RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1`

Decision: `completed_main_supabase_service_role_runtime_grant_boundary_validation`

Execution: `completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation`

Run ID: `2026-06-26T23-41-52-998Z-818c6ba1`

Output directory: `/tmp/reeditpro-rp-external-beta-main-supabase-service-role-runtime-validation-1/2026-06-26T23-41-52-998Z-818c6ba1`

## Commands

- `supabase db push --dry-run --db-url [redacted]`: `passed`, `Remote database is up to date.`
- `supabase db lint --schema public,worker_runtime --level warning --fail-on warning --db-url [redacted]`: `passed_no_warnings`
- `supabase db lint --schema storage --level warning --fail-on none --db-url [redacted]`: `completed_with_managed_storage_warnings_allowed`
- `psql postgresql://[redacted] -v ON_ERROR_STOP=1 -X -A -t -c [grant validation query]`: `passed`

## Grant Validation

- Unsafe public mutation grants: `0`
- Unsafe public sequence grants: `0`
- Hardening migration present: `true`
- Protected runtime table service-role write capability: `passed`
- Protected runtime table `anon` / `authenticated` mutation absence: `passed`

## Artifacts

- `db-push-dry-run-final.txt`
  - bytes: `106`
  - sha256: `cd63754d60c1bba38305a4cbbc3a82fb4a0ab4d98dccf4ad2ae55bfe09e406cb`
- `db-lint-public-worker-runtime.txt`
  - bytes: `130`
  - sha256: `922079b805834c0ee31a418e5a58ca03b651469f79614b8ff956b44090222476`
- `db-lint-storage-observed.txt`
  - bytes: `1660`
  - sha256: `240ae6adc7dcbcffab1cfcdd7bf1fd92b394d398e7541c5907d965230ce79184`
- `grant-validation.json.txt`
  - bytes: `6932`
  - sha256: `0b418d7e2943fcb0ae2665571f552a41b240e898f402e19e1f201e85cd543b36`
- `validation-report.json`
  - bytes: `12716`
  - sha256: `b0de58258882c2bbe0a7296c58ab3fc44b2f8eb645befe91bdd38adde55a83de`
- `artifact-manifest.json`
  - sha256: `cc7e3b894c2c0fb13fcb2dd0a23da27cccfeab952dc6b2ffcecd0d75b7ed5647`

Generated artifacts committed: `none`

Package-lock: `unchanged`
