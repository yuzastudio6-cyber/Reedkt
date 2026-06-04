# Staging Supabase Rollback And Cleanup Plan

Prompt 21 defines rollback and cleanup expectations for a future approved staging run. It does not run staging migrations, staging SQL, local SQL, or cleanup commands.

## Rollback Triggers

A future staging run must stop and enter rollback review when any of these occur:

- the target is not confirmed as staging-only;
- a migration fails;
- an RLS test fails in a way that suggests cross-workspace exposure;
- fixture cleanup cannot be verified;
- any secret, token, signed URL, provider key, Stripe key, or production-like connection string appears in output;
- any provider/tool/worker/render/storage transfer/credit/Stripe/external telemetry side effect appears.

## Cleanup Requirements

Cleanup must remove or roll back all synthetic fixture records. It must not delete production-like user data, real media, provider records, Stripe records, or non-fixture records.

Cleanup evidence may record:

- fixture namespace;
- fixture row counts before cleanup in redacted aggregate form;
- fixture row counts after cleanup in redacted aggregate form;
- reviewer initials or issue reference;
- timestamp;
- no-secrets confirmation.

Cleanup evidence must not record:

- service-role keys;
- anon keys;
- JWT secrets;
- full connection strings;
- signed URLs;
- private media paths;
- provider keys;
- Stripe keys.

## Rollback Review

Rollback review must answer:

- did migration validation change staging schema state;
- did the selected RLS tests create synthetic rows;
- did cleanup complete;
- is another repair prompt required;
- does production readiness remain blocked.

## Prompt 21 Decision

This rollback and cleanup plan is draft approval material only. Human review is required before any staging target is used.

