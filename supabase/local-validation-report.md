# Local Validation Report

## Status

Status: skipped

Local Supabase validation was not run because the Supabase CLI is unavailable on this laptop. Winget is available, but did not find an installable Supabase CLI package in the current source configuration.

## Intended Commands

When the CLI and local Supabase/Docker are available, run:

```powershell
supabase start
supabase db reset --local
supabase db lint --local
```

## Result

No local migration validation result is available yet.

If local validation fails in a future run, stop before any remote deployment.
