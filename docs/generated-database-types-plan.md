# Generated Database Types Plan

Generated database types are currently missing.

Current status:

- `src/backend/supabase/database.types.ts` exists as a safe placeholder.
- `src/backend/supabase/generated-database.types.ts` does not exist.
- Supabase CLI is unavailable in the current environment.
- The repo is not confirmed linked to the `reeditpro` Supabase project.

Do not invent generated database types. Generate them only from a real local or linked Supabase schema.

## Local Type Generation

Use this after local Supabase is installed/running and local migrations have been applied successfully:

```bash
supabase gen types typescript --local > src/backend/supabase/generated-database.types.ts
```

Use local generation when:

- Docker/local Supabase is available.
- The migration chain applies locally.
- You want type feedback before remote deployment.

## Linked Type Generation

Use this only after the repo is linked to the confirmed `reeditpro` project and remote migrations are deployed:

```bash
supabase gen types typescript --linked --schema public > src/backend/supabase/generated-database.types.ts
```

Use linked generation when:

- `supabase projects list` confirms the project named exactly `reeditpro`.
- The repo link is confirmed to that project ref.
- Remote migrations are deployed and verified.

## Database Type Wrapper Policy

`src/backend/supabase/database.types.ts` should remain a placeholder while generated types are missing.

After `generated-database.types.ts` exists, a future safe update can make `database.types.ts` re-export the generated `Database` type. Do not do that before the generated file exists.

## Safety Notes

- Generated types are schema metadata, not secrets.
- Do not print or commit `.env` values while generating types.
- Do not use Yuza Studio Supabase.
- Do not generate from a linked project unless it is confirmed as `reeditpro`.
