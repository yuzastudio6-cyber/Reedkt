# Staging Supabase Go/No-Go Rubric

This rubric supports a future human decision. Prompt 22 does not approve staging execution.

## Go

A future human reviewer may choose `approved_for_staging_validation` only when all of these are true:

- the staging project is disposable, isolated, and not production;
- the approved test set is explicit and narrow;
- fixtures are synthetic, cleanupable, and workspace/project-isolated;
- evidence redaction rules are accepted;
- rollback and cleanup owners are available;
- production readiness remains explicitly not approved.

## Conditional Go

A future reviewer may choose `approved_with_restrictions` when staging validation can proceed with limits, such as:

- only migration validation is allowed;
- only one RLS test file is allowed;
- cleanup must be independently verified before any next test;
- evidence retention has a restricted destination;
- a specific risk requires extra reviewer signoff.

## No-Go

A future reviewer should choose `blocked_pending_changes` or `rejected` when any of these are true:

- staging target is not proven isolated;
- secrets or full connection strings would be exposed;
- fixture cleanup is unclear;
- rollback owner is unavailable;
- selected SQL files are draft-only without conversion;
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

## Prompt 22 Result

Prompt 22 result: `ready_for_human_review`.

This result is a packet completeness state only. Actual approval is not granted.
