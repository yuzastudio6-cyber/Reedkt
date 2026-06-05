# Supabase Track B Backfill RLS And Secret Policy

The staging backfill may use server-side staging credentials only. Credential payloads must never be printed, committed, returned in reports, or imported by frontend/browser code.

Required registry safety before any write:

- Activation milestone tables already exist.
- Row level security is enabled.
- `public`, `anon`, and `authenticated` grants are revoked for registry tables.
- Service-role access is limited to the staging registry backfill path.
- Production, external beta, paid production, and broad-media flags remain false.

If the schema is absent, RLS is missing/unsafe, or staging credentials are unavailable, the backfill stops before write and records the exact blocker.
