# Supabase Target Boundary

Packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1`

Supabase target status: `source_reference_names_recorded_no_remote_target_selected`

Supabase remote environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

RLS/storage remote validation: `not_run`

## Source Evidence

The Google Cloud source records name Secret Manager references for backend Supabase runtime:

- `reeditpro-prod-supabase-url`
- `reeditpro-prod-supabase-service-role-key`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

These are reference names only. They do not reveal a Supabase project ref, raw service-role key, database URL, migration target, or storage bucket policy.

## Decision

The prior generic owner-name blocker is closed for Google Cloud source naming, but the Supabase remote target remains blocked until a later Supabase-specific packet names the exact non-production project/ref and validates RLS, private storage, service-role-only mutation paths, and migration status.

Frontend code must continue to use frontend-safe public Supabase config only. Service-role credentials remain backend/worker-only and must never enter Vite/browser code.
