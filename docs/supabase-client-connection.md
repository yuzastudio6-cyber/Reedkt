# Supabase Client Connection

## Current Implementation

`src/backend/supabase/supabase-client.ts` now creates a lazy browser Supabase client only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.

If either value is missing:

- imports do not crash;
- `getSupabaseClient()` returns `null`;
- auth bootstrap returns `not_configured`;
- no remote Supabase calls are attempted.

## Scope

This client is frontend-safe and uses the anon key only. It is intended for Supabase Auth session handling and RLS-limited app rows.

It is not an admin client and must not be used for backend-only tasks.

RP-FIX-07 also uses this client for Storage helpers. Those helpers return safe not-configured results when public env values are missing, and they do not upload or delete anything unless an app caller explicitly invokes the relevant function.

## Remaining Work

- Generate real database types after local/staging schema is accepted.
- Add backend service-role clients only in secure server runtime.
- Add signed upload/download support for private media where browser RLS is not enough.
- Validate RLS locally and in staging before production.
