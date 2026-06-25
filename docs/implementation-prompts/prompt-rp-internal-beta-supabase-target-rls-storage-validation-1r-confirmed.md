# RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED

Run the guarded read-only Supabase target RLS/storage validation after `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R`.

Named target:

- Project name: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment class: `staging`

Required confirmation:

`REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`

Allowed validation only after confirmation:

- read-only target identity confirmation;
- read-only RLS, policy, advisor, and status checks;
- read-only storage bucket and policy status checks;
- sanitized result docs with no secret payloads.

Forbidden:

- SQL mutation or migration apply;
- storage bucket/object creation;
- storage object readback unless the prompt names exact approved read-only metadata commands;
- service-role secret payload logging or docs;
- frontend service-role credential exposure;
- signed URL creation;
- public artifact creation;
- worker/provider/model/render/media execution;
- beta, production, final delivery, or public artifact unlock.

Expected blocker if confirmation or safe credentials are absent:

`blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation`

Preferred runner:

```bash
npm run rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed
```

Additional safe credential context for a complete read-only run:

- one approved access-token env alias for target identity through `supabase projects list --output json`: `SUPABASE_ACCESS_TOKEN`, `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN`, or `REEDITPRO_SUPABASE_ACCESS_TOKEN`;
- one approved read-only DB URL env alias for `supabase db lint --db-url [redacted] --schema public,storage --level warning --fail-on none`: `REEDITPRO_SUPABASE_READONLY_DB_URL`, `REEDITPRO_STAGING_SUPABASE_DB_URL`, `SUPABASE_STAGING_DB_URL`, `STAGING_SUPABASE_DB_URL`, or `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`.

The runner must isolate Supabase CLI home under `/tmp`, redact secret-like values from reports, and write only sanitized local evidence under `/tmp/reeditpro-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/<runId>/`.
