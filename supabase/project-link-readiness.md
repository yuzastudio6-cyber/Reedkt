# Supabase Project Link Readiness

RP-FIX-03 status: project-link readiness documented. No project link was created or changed.

## Current Local State

| Check | Result |
| --- | --- |
| Supabase CLI available | No |
| `supabase/config.toml` exists | No |
| `supabase/.temp/project-ref` exists | Yes |
| Repo linked status | Unknown |
| Project name confirmed as `reeditpro` | No |
| Project ref confirmed from project list/dashboard | No |

`supabase/.temp/project-ref` is not enough proof that the linked project is correct. The project name must be confirmed through Supabase CLI project listing or the Supabase dashboard before any deployment work.

## What Is Needed To Confirm `reeditpro`

1. Install or configure the Supabase CLI.
2. Authenticate with Supabase without printing tokens.
3. Run:

```bash
supabase projects list
```

4. Confirm a project named exactly `reeditpro`.
5. Copy the corresponding project ref from a trusted Supabase source.
6. Link only to that project ref:

```bash
supabase link --project-ref <REEDITPRO_PROJECT_REF>
```

7. Confirm the repo is not linked to a Yuza Studio project.

## Commands Not Run In RP-FIX-03

- `supabase link`
- `supabase migration list --linked`
- `supabase db push`
- `supabase db push --dry-run`
- `supabase projects api-keys`
- `supabase secrets set`

## Readiness Decision

Project link readiness is **not ready** for deployment. It is ready for a future operator to confirm the project safely.
