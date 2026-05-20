# Supabase Client Connection

## Current Behavior

ReeditPro has a frontend-safe Supabase client factory in `src/backend/supabase/supabase-client.ts`.

The client is created only when both public env values exist:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

When either value is missing, `getSupabaseClient()` returns `null` and the app can remain in mock/local mode.

## Safety Rules

- The browser client uses the anon key only.
- The browser client never reads `SUPABASE_SERVICE_ROLE_KEY`.
- Service-role access remains unavailable in the Vite app.
- Real privileged actions need a future backend/server/worker runtime.
- No real credentials belong in `.env.example` or source control.

## Database Types

`src/backend/supabase/generated-database.types.ts` is still missing because migrations have not been deployed or verified.

Until generated types exist, `src/backend/supabase/database.types.ts` is a placeholder type used only to keep the client typed safely enough for local builds. It is not the real remote schema.

After local or linked Supabase schema validation, generate types with one of these commands:

```bash
supabase gen types typescript --local > src/backend/supabase/generated-database.types.ts
```

```bash
supabase gen types typescript --linked --schema public > src/backend/supabase/generated-database.types.ts
```

Then update `database.types.ts` to re-export:

```ts
export type { Database } from './generated-database.types'
```

## Connection Status Helper

Use `getSupabaseConnectionStatus()` to inspect whether the app is in Supabase mode or mock/local mode without printing env values.

Expected status modes:

- `supabase`: public env values are present
- `mock_local`: one or both public env values are missing

## Still Required

- confirm and deploy the real `reeditpro` Supabase schema
- generate real database types
- add auth/profile/workspace bootstrap
- add storage upload flow
- create backend API/runtime boundary
- connect persistence adapters
- keep service-role access backend-only
