# Canonical Post-Commit Adapter Recovery

Status: authenticated local/private no-rerun recovery evidence

This boundary closes the gap between an immutable completed worker execution and the create-only canonical job-adapter completion record. It is used when the runner committed completion authority and persisted its private result, QA, and reconciliation evidence, but the adapter process stopped before it durably recorded the final safe response.

## Historical completion fence

Before a fresh adapter request claims a lease, the backend scans the tenant-scoped canonical lease aggregate for an existing completed fence for the exact workspace, project, edit session, snapshot, and job. A completed historical fence prevents a new attempt even when its lease was later released or expired.

Recovery requires exactly one completed attempt. Multiple completed attempts, changed runner identity, or changed lease authority fail closed.

## Required immutable evidence

The backend reconstructs the adapter completion only when all applicable evidence agrees:

- current authenticated canonical job readiness and approved snapshot authority;
- exact work item, expected output, tool, operation, and runner identity;
- immutable completed lease fence and execution-attempt identity;
- private artifact content identity and actual-run evidence;
- passed QA and `test_merged_not_live_authorized` reconciliation;
- exact consumed single-use dispatch for tool jobs;
- exact DeepFilterNet completed attempt-level internal production-cost evidence when applicable; and
- content-addressed evidence blobs and store checksums.

The recovery record embeds the credential-free adapter response and hashes the lease, dependency, actual-run, artifact, QA, reconciliation, dispatch, cost, and response evidence. It is tenant/job scoped, create-only, checksum-protected, and privately persisted.

## No-rerun rule

Recovery does not:

- claim a new lease;
- authorize or consume another dispatch;
- rerun a tool, renderer, or internal authority job;
- write or replace an artifact;
- write or replace QA or reconciliation evidence;
- write new internal-cost evidence; or
- restore provider, public delivery, production render, customer credit, wallet, settlement, billing, or deployment authority.

If artifact, QA, reconciliation, dispatch, or required cost evidence is missing, the adapter records `completed_recovery_required` with `server_reconciliation_required`. The exact failed request key remains an idempotent failure. A fresh authenticated request can recover only after the immutable evidence is available; it never converts the completed attempt into a retry.

## Persistence ordering and replay

The recovery record is written before the job-level adapter completion and request-key response. If the process stops again, a later request reloads the exact recovery record and finishes the missing adapter persistence without executing the runner. Once the job-level completion exists, later request keys reuse it through the existing adapter replay boundary.

## Evidence

`npm run smoke:canonical-private-tool-dispatch` proves:

- a completed fence with missing output evidence blocks without a new claim or dispatch;
- a completed D3 execution recovers its adapter completion without rerunning;
- the recovery record is create-only, credential-free, tenant-scoped, and checksum protected;
- exact adapter replay returns the recovered artifact without another execution; and
- completed DeepFilterNet recovery preserves the existing internal-cost evidence hash without writing or executing again.

## Boundary

This is single-host private/internal evidence. It does not prove distributed queue redelivery, remote object-store durability, deployed worker death detection, cross-instance transactions, Supabase, providers, customer billing, public export, external beta, or production readiness.
