# Auth Runtime Boundary

## Rule

The browser can use only the Supabase public URL and anon key:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These values are expected to be public browser configuration. They do not grant admin access.

Server-only values must never be imported into Vite/browser code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

## Frontend Anon Client

The frontend anon client can do only what Supabase Auth and RLS allow. RP-FIX-06 uses it for session lookup, email/password auth helpers, profile bootstrap, workspace bootstrap, and current workspace context.

When RLS blocks a bootstrap operation, the code returns a safe `backend_required` warning. It does not create an admin client and does not read server-only env vars.

## Backend-Only Boundary

Future backend runtime is required for operations that need privileged checks or service-role writes, including:

- guaranteed profile creation after sign-up;
- workspace creation if app policy moves creation behind server validation;
- member invites and role changes;
- audit writes;
- credit reservation and ledger writes;
- upload signing and private asset delivery;
- production storage policy validation;
- provider calls, workers, rendering, and export jobs.

Possible future backend runtimes:

- Cloud Run API;
- Supabase Edge Functions;
- serverless API routes;
- secure worker services.

Whichever runtime is chosen, service-role credentials stay server-side only.
