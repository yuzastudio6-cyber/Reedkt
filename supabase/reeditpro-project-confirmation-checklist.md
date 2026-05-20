# ReeditPro Supabase Project Confirmation Checklist

Do not deploy until every checklist item before deployment is confirmed.

## Project Confirmation

- [ ] Supabase CLI installed and available with `supabase --version`
- [ ] User logged into Supabase CLI or `SUPABASE_ACCESS_TOKEN` available securely in the shell
- [ ] `supabase projects list` shows a project named exactly `reeditpro`
- [ ] Correct project ref copied from the Supabase dashboard or project list
- [ ] Repo linked to the confirmed `reeditpro` project ref
- [ ] Repo is not linked to the Yuza Studio project
- [ ] `supabase/.temp/project-ref` is not used as the only proof of project identity

## Migration Safety

- [ ] Local migrations listed and match `supabase/migration-order.md`
- [ ] Overlapping `20260513` and `20260518` migration chains validated or reconciled
- [ ] Local Supabase validation passed, or disposable staging validation passed
- [ ] Remote migration history reviewed after confirming project identity
- [ ] Remote dry-run completed successfully
- [ ] Schema-only backup attempted

## Deployment Gate

- [ ] `DEPLOY_TO_REEDITPRO_SUPABASE=true` set only for approved deployment
- [ ] User explicitly approves deployment in a later deployment task
- [ ] No tracked `.env` secret files exist
- [ ] No service-role key exposed to Vite/browser code
- [ ] Database types generated only after local or linked schema is available

## Commands That Must Not Be Used For Confirmation

```text
supabase projects api-keys
supabase secrets set
supabase db reset --linked
supabase migration repair
supabase db pull
```
