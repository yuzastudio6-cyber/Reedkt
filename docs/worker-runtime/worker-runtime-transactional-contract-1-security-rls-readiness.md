# Worker Runtime Transactional Contract 1 Security RLS Readiness

Security/RLS readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`

This document maps future security and RLS requirements. It does not create policies, run SQL, mutate Supabase, or deploy migrations.

## Required Security Properties

- Normal users must not insert, update, or delete worker claims, leases, events, job transitions, private artifact evidence, QA evidence, or audit events.
- Project members may read only mediated project-scoped status where product policy allows.
- Approved plan snapshots must remain immutable.
- Worker jobs must point to approved plan snapshots.
- Worker/service writes must be operation-specific, backend-only, and audited.
- Audit events and worker events must be append-only.
- Source media, generated assets, processed media, previews, exports, thumbnails, QA artifacts, and worker-temp assets remain private by default.
- Signed URLs may be future access mechanisms, but signed URL source-of-truth remains blocked for this Track A gate.
- Provider/model secrets and Secret Manager payloads must never enter schema rows, logs, docs, public artifacts, or PR bodies.

## Future Review Inputs

- `supabase-schema-planning-bridge.md`
- `database-migration-readiness-checklist.md`
- `supabase-table-specification.md`
- `migration-review-and-rls-hardening.md`
- `rls-hardening-matrix.md`
- `sql-migration-draft-review.md`
- `supabase-rls-policy-draft.md`
- `supabase-storage-bucket-draft.md`
- `data-privacy-retention-plan.md`

## Blocked Scope

Any SQL, migration, RLS policy, schema deployment, Supabase mutation, storage bucket update, or service-role runtime must be handled by a future explicit Supabase/Worker milestone.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
