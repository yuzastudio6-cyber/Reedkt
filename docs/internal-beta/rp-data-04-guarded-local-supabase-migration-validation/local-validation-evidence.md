# RP-DATA-04 Local Validation Evidence

Validation environment: `local_supabase_db_only`

Supabase CLI: `2.105.0`

Docker: `29.5.2`

Local project id: `reeditpro-rp-data-04-local-validation`

Local DB URL: `postgresql://postgres:postgres@127.0.0.1:55432/postgres`

## Commands

- `supabase init --yes`: passed
- `supabase start --exclude edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector --ignore-health-check`: passed after isolated port and compatibility repairs
- `supabase db reset --local --no-seed`: passed
- `psql postgresql://postgres:postgres@127.0.0.1:55432/postgres ...`: passed
- `supabase stop --no-backup`: passed

## Result

Decision: `completed_guarded_local_supabase_migration_validation`

Execution: `completed_local_only_supabase_db_reset_no_remote_execution`

Migration reset: `passed`

Seed execution: `skipped_no_seed`

Remote Supabase execution: `none`

Internal beta end-to-end status: `not_ready`

Product-ready end-to-end local OSS tools: `0`
