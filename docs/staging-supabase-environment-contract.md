# Staging Supabase Environment Contract

This contract defines the future staging Supabase environment required before any staging RLS validation. Prompt 19 does not create, link, query, migrate, seed, or validate a staging project.

## Required Isolation

- The staging project must be `separate from production`.
- It must contain `no production data`.
- It must hold no provider secrets.
- It must not hold `no Stripe live secrets`.
- It must not be linked from local tooling without explicit human approval.
- It must enforce no automatic production promotion for schema or runtime behavior.

## Secrets And Runtime Boundaries

- No provider secrets, service-role keys, Stripe live keys, private env values, or signed URLs may be committed.
- Service-role use is restricted to approved validation commands and reviewer-owned evidence.
- Provider, worker, render, tool, media, storage transfer, billing, external telemetry, and production unlock behavior remain disabled.

## Storage Policy Requirements

- Every source-media, generated-assets, previews, exports, QA, and worker-temp `private bucket` must remain private.
- Public source-media buckets are forbidden.
- Signed URL values must never be stored as source-of-truth records.
- Storage object records must store bucket and object path only, with workspace/project scope.

## Auth And Role Expectations

- Test users must be synthetic.
- The staging environment must support anon/authenticated role checks.
- Workspace/project member and non-member fixtures must be isolated.
- Backend/service-role tests must be separate from normal-user tests.

## Migration Chain Requirements

- Migration chain commit must be recorded.
- Applied migration output must be captured.
- Known schema-era conflicts must be reviewed before staging execution.
- Supabase advisor output is required after migration/application validation.

## Backup, Rollback, And Cleanup

- Backup/rollback plan must be documented before staging validation.
- Synthetic fixtures must be tagged by test run.
- Cleanup evidence must be recorded after every run.
- Failed cleanup blocks beta readiness.

## Approval

Only a human reviewer may approve staging validation. Approval must record project identity, branch, commit, migration chain, fixture plan, rollback plan, and reviewer name. AI output is evidence support only, not staging approval, legal approval, security approval, or production approval.

## No Production Promotion

Staging validation never implies production approval. No automatic production promotion is allowed.
