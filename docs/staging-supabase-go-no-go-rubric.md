# Staging Supabase Go/No-Go Rubric

This rubric supports future staging Supabase/RLS validation decisions. Prompt 23A records conditional user/owner authorization, not immediate staging execution.

## Current Decision State

Prompt 23A state: `conditional_go_pending_gates`.

Meaning:

- approval exists in principle for staging Supabase/RLS validation;
- execution is still blocked until evidence, project identity, commit, test-set, Secret Manager reference, synthetic fixture, rollback, and cleanup gates are complete;
- production readiness and beta unlock remain not approved.

## Go

A later execution prompt may proceed only when all of these are true:

- the staging project is disposable, isolated, and not production;
- accepted redacted evidence confirms staging identity and production separation;
- the approved branch, PR, commit, and test set are explicit;
- fixtures are synthetic, cleanupable, and workspace/project-isolated;
- evidence redaction rules are accepted;
- rollback and cleanup owners are available;
- GCP Secret Manager handling uses reference names/placeholders only and does not expose values;
- public/exposed schema tables have explicit role-scoped RLS review for `anon`, `authenticated`, and `service_role`;
- production readiness remains explicitly not approved.

## Conditional Go Pending Gates

Prompt 23A is `conditional_go_pending_gates` when user/owner authorization is recorded but one or more execution gates remain incomplete, such as:

- accepted redacted Supabase evidence is missing;
- approved PR/commit/test-set is not recorded;
- cleanup owner or rollback owner is missing;
- Secret Manager reference metadata is not accepted;
- selected SQL files need review before staging use.

## No-Go

A future reviewer should choose `blocked_pending_changes` or `rejected` when any of these are true:

- staging target is not proven isolated;
- secrets or full connection strings would be exposed;
- fixture cleanup is unclear;
- rollback owner is unavailable;
- selected SQL files are draft-only without review;
- runtime side effects are included;
- the packet implies production readiness or beta unlock.

## Stop Criteria

Any future approved staging run must stop if:

- a migration fails;
- an RLS test fails;
- cleanup cannot be verified;
- an unexpected runtime record is created;
- a secret or signed URL is exposed;
- production target risk appears.

## Prompt 22 And Prompt 23A Results

Prompt 22 result: `ready_for_human_review`.

Actual approval is not granted by Prompt 22.

Prompt 23A result: `approved_for_staging_validation_when_gates_pass`.

These states do not run staging. Prompt 23A records conditional approval only; the next execution prompt must still prove every gate before any staging Supabase/RLS command or SQL may run.
