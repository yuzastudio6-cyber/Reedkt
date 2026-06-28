# RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R

Implement the guarded remote validation follow-up after `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1`.

Named target:

- Project name: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment class: `staging`

Required confirmation:

`REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`

Boundary:

- Do not apply migrations unless a separate explicit migration execution prompt approves it.
- Do not mutate remote Supabase unless the prompt names exact mutation commands and confirmation gates.
- Do not read service-role secret payloads into logs or docs.
- Do not expose service-role credentials to frontend code.
- Do not create signed URLs or public artifacts.
- Do not enqueue jobs, execute workers, process media, call providers/models, render/export, or unlock beta/production.

Allowed future validation, only after confirmation:

- read-only target identity confirmation;
- read-only RLS/policy/advisor/status checks;
- read-only storage bucket/policy status checks;
- sanitized result docs with no secret payloads.

Expected blocker if confirmation or safe credentials are absent:

`blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation`
