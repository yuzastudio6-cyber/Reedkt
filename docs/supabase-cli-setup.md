# Supabase CLI Setup

This guide prepares ReeditPro for future Supabase deployment and type generation. It does not deploy anything by itself.

Target project name: `reeditpro`.

Do not use the Yuza Studio Supabase project.

## Required Tools

- Supabase CLI
- Node/npm
- Git
- Docker for local Supabase validation, optional but recommended

## Check CLI Availability

```bash
supabase --version
```

If this command fails, remote deployment, remote dry-run, linked project checks, and generated database types cannot be verified from this machine.

## Login And Project List

Run these only when you are ready to confirm project access:

```bash
supabase login
supabase projects list
```

The project list must show a project named exactly:

```text
reeditpro
```

Do not continue if the project name is missing or if the only visible project is a Yuza Studio project.

## Safe Project Link Command

After confirming the project name and copying the project ref from Supabase:

```bash
supabase link --project-ref <REEDITPRO_PROJECT_REF>
```

Do not commit the project ref in source code. Do not treat `supabase/.temp/project-ref` alone as proof that the repo is linked to the correct project.

## Future Type Generation

Use local generation only after local Supabase is running and migrations have applied locally:

```bash
supabase gen types typescript --local > src/backend/supabase/generated-database.types.ts
```

Use linked generation only after the repo is safely linked to the confirmed `reeditpro` project:

```bash
supabase gen types typescript --linked --schema public > src/backend/supabase/generated-database.types.ts
```

Do not generate fake database types.

## Safety Notes

- Never use Yuza Studio Supabase.
- The target project must be `reeditpro`.
- Never commit Supabase access tokens, database passwords, anon keys, service-role keys, provider keys, Stripe keys, or webhook secrets.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are frontend-safe when they belong to the correct project.
- `SUPABASE_SERVICE_ROLE_KEY` is backend-only. Never expose it to Vite/browser code.
- Do not run `supabase db push` unless a later deployment prompt explicitly asks for it and `DEPLOY_TO_REEDITPRO_SUPABASE=true` is set.
- Do not run `supabase projects api-keys`, `supabase secrets set`, `supabase db pull`, `supabase migration repair`, or remote resets as part of readiness work.
