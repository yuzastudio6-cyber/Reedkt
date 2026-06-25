# RLS Validation Boundary

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1`

Decision: `blocked_pending_named_supabase_target_rls_storage_validation`

RLS validation: `not_run`

RLS policy source status: `draft_review_only`

## Source Review

The current source docs define the intended RLS shape:

- workspace/project membership gates user access;
- users cannot directly mutate approved snapshots;
- workers and trusted backend flows use service-role-only writes;
- credit ledger and audit records are append-only;
- provider prompts and generated assets stay project-scoped;
- browser capture/source media data remains private.

## Required Future Validation

Future guarded validation must prove:

- RLS is enabled on every exposed-schema internal beta table.
- `anon` and `authenticated` grants are explicit and least-privilege.
- update policies include the required read/select visibility and `WITH CHECK` behavior.
- approved plan snapshots are immutable to users.
- credit/job/artifact/QA/write paths remain service-role-only.
- no user-editable JWT metadata is used for authorization.
- service-role credentials are never exposed to frontend code.

## Current Status

No RLS policy was applied or tested in this phase because the target project is not named and remote validation is not approved.
