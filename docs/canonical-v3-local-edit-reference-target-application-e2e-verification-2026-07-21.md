# Canonical V3 Local Edit Reference Target Application E2E Verification

Date: 2026-07-21

Status: `isolated_local_end_to_end_verified_hosted_production_blocked`

## Outcome

The canonical local Edit Reference flow now connects approved reusable
Preference DNA to one exact named edit without a browser-authored application,
synthetic target-ready record, duplicate queue, or legacy preference store.

The verified authority chain is:

1. authenticated library preference and Study Chat;
2. immutable approved Preference DNA plus reviewed QA;
3. exact project, named edit, source, and Edit Brief;
4. target source registered into the existing canonical distributed pre-plan
   work graph;
5. every target work item completed with immutable fixture-only output and
   internal-cost evidence;
6. immutable target-understanding package persisted and re-read after process
   state is discarded;
7. one server-produced unconnected application persisted by the service-role
   V2 preparation transaction;
8. one authenticated outer exact-edit Apply transaction connects or removes
   the application, invalidates stale planning authority, and preserves
   approved history; and
9. mounted UI reload reads the same connected or cleared database authority.

## Reliability proof

The focused server integration and mounted Chromium case cover:

- exact idempotent preparation replay and changed-request conflict;
- simultaneous preparation and exact-edit Apply delivery, with one commit and
  the same durable receipt returned to the duplicate request;
- transactionally re-read reference, study, DNA, QA, Brief, target source,
  completed run, plan digest, work counts, and target package;
- a deliberately lost committed Apply response followed by retry with the same
  idempotency key and byte-equivalent body;
- connected authority reload, explicit removal, and cleared authority reload;
- immutable historical applications rather than destructive replacement;
- another authenticated workspace owner denied from the exact-edit authority;
- stable JSON equality across PostgreSQL JSONB key reordering;
- no horizontal overflow at a 375 by 812 viewport; and
- no provider, worker, customer-price, customer-credit, service-fee, billing,
  render, export, cloud, or remote mutation authority.

Migration 015 introduces the server-prepared V2 transaction and revokes V1.
Migration 016 permits only approved-DNA QA outcomes `passed` or
`requires_user_review` while continuing to reject blocked QA. Migration 017
stores an explicit canonical lifecycle projection so database-backed connected,
replaced, and cleared records do not pretend to carry the older process-local
session receipt. Migration 019 adds the tenant/actor/operation/key transaction
fence shared by application preparation and outer Apply before either reads or
creates its idempotency receipt.

## Security and scope

The browser never receives the service-role credential and cannot choose the
database, RPC, actor, tenant, application record, lifecycle authority, target
package lineage, or planning revision. The local server binds those values from
the authenticated request and canonical repositories. The second owner is
denied by tenant authority even when the project, edit, and reference IDs are
known.

This proof is deliberately isolated to the loopback canonical V3 Supabase
stack. Raw `supabase/migrations/` stays untouched and
`blocked_by_parallel_foundations`. The controlled work-item completion helper
is non-production evidence only; it neither invokes models nor promotes itself
to a hosted worker.

## Remaining gates

Production readiness remains false until the reviewed forward migration and
live server-only adapters are proven with deployed Auth/RLS/Storage,
multi-replica worker leases and recovery, real provider routing and checkback,
hosted provider/infrastructure cost receipts, same-release staging evidence,
operational backup/rollback, and independent two-user/two-workspace acceptance.
Remote Supabase, cloud, provider, billing, deployment, and public delivery are
not authorized by this evidence.
