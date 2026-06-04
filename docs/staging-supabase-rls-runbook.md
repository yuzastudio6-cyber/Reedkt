# Staging Supabase/RLS Runbook

This runbook is a future staging approval workflow. Prompt 21 does not run it. It intentionally avoids executable staging commands; Prompt 22 must supply reviewed command details only after human approval.

## Pre-approval static checks

- Confirm Prompt 20B-Retry local evidence is present and references only localhost-safe DB evidence.
- Confirm `docs/staging-rls-test-selection-matrix.md` identifies the exact test candidates.
- Confirm `docs/staging-synthetic-fixture-plan.md` defines synthetic, cleanupable fixtures.
- Confirm `docs/staging-supabase-rollback-cleanup-plan.md` names rollback and cleanup criteria.
- Confirm `docs/staging-supabase-risk-register.md` has owners and mitigations for staging risks.
- Confirm no staging, remote, or production Supabase command has run in Prompt 21.

## Environment confirmation

Before a future staging run, the reviewer must verify:

- the target is a staging project, not production;
- the staging project reference is recorded only in redacted form;
- no service-role key, JWT secret, provider key, Stripe key, signed URL, or private media URL is stored in the repository;
- the runner environment is isolated from production data;
- the rollback owner and cleanup owner are available.

## Fixture review

The fixture reviewer must approve:

- fixture namespace and deterministic synthetic IDs;
- workspace/project isolation cases;
- non-member denial cases;
- storage record fixtures without real media;
- cleanup order and verification;
- evidence redaction.

## Migration validation window

A future approved prompt may validate staging migration behavior only after the approval packet is signed. Any migration failure must stop validation, record the exact migration and error safely, and leave production untouched.

## RLS validation window

A future approved prompt may run only the approved staging SQL test set. Any RLS failure must stop the run, record the failing test and sanitized error summary, and avoid widening the test set mid-run.

## Cleanup verification

The cleanup reviewer must verify:

- fixture records are removed or rolled back according to the approved plan;
- no storage objects, signed URLs, provider attempts, worker claims, render jobs, credit mutations, Stripe records, or telemetry events were created;
- evidence is redacted before being committed or linked.

## Decision record

The final staging validation record must state:

- whether staging migration validation ran;
- whether staging RLS tests ran;
- which tests passed or failed;
- whether cleanup completed;
- whether production readiness remains blocked;
- the next prompt recommendation.

