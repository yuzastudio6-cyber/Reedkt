# Canonical V3 local exact-edit Apply authority-read verification

Date: 2026-07-21

## Verdict

The isolated `database/canonical-v3-local` chain now supplies the sanitized,
tenant-bound authority needed immediately before the one exact-edit Apply
transaction. The browser receives optimistic-concurrency inputs, not mutation
authority. The Apply RPC still transactionally locks and re-reads canonical
state before changing anything.

This is local-only evidence. It does not bless the historical
`supabase/migrations/` chain and it does not authorize remote Supabase, cloud,
providers, billing, deployment, or production release.

## Implemented authority read

`read_exact_edit_apply_authority_v1`:

- requires an authenticated actor with write access to the exact workspace;
- binds workspace, project, edit session, and optional selected application;
- validates the seven stored preference values and their canonical digest;
- returns record, preference, and planning revisions plus the current
  lifecycle/lock/application state;
- returns the confirmed output-frame authority only after verifying its
  digest and exact record/planning revisions;
- returns only immutable IDs and digests for an explicitly selected prepared
  Preference Application;
- omits Preference DNA content, evidence, media, provider payloads, raw
  credentials, pricing, credits, and service-fee data;
- performs no mutation and grants no browser mutation authority.

The TypeScript boundary rejects extra keys, wrong identities, invalid enums,
malformed digests, stale frame scope, invalid selected-application scope, and
any result that does not report canonical `verified_live` source authority.

## Output-frame invariant repair

The outer Apply transaction advances the exact-edit record and planning
revisions. A previously confirmed output-frame digest therefore has to be
resealed against those committed revisions even when the target platform is
unchanged. Migration `005` adds a row trigger that:

- recomputes the frame authority digest from server-owned row values whenever
  record/planning/frame state changes;
- rejects incomplete confirmed-frame state;
- rejects partially cleared frame state;
- preserves the separate rule that a target-platform change clears frame
  confirmation and requires reconfirmation.

This prevents a successful non-platform preference change from leaving a
confirmed frame whose digest points at stale planning authority.

## Local HTTP, JWT, and RLS proof

The verification runner uses the actual loopback PostgREST endpoint with a
locally signed authenticated JWT and the local anonymous API key. It does not
use a service-role credential for the read or Apply.

The proof verifies:

- owner A reads revision `0` preferences, confirmed frame, and one selected
  prepared application through HTTP;
- the returned read receipt and digests construct the exact nested lifecycle
  plus outer Apply request;
- exact Apply replay returns one transaction receipt;
- the committed read reports revisions `1`, connected application state, and
  a frame authority resealed to record/planning revision `1`;
- owner B cannot read or mutate owner A's workspace;
- direct immutable-event table mutation is denied;
- all local capabilities remain explicitly non-production and loopback-only.

## Verification

The frozen source passed:

- clean isolated Supabase reset through migrations `001`–`005`;
- SQL suites `001`–`006`, including two-user/two-workspace forced RLS,
  lifecycle CAS/idempotency, recovery/internal cost, grants/search-path
  invariants, atomic Apply, sanitized authority read, and no-read-mutation;
- the process-branded V6 adapter proof;
- actual PostgREST/JWT/RLS authority-read plus Apply proof;
- server TypeScript, focused/full lint, build, frontend-boundary, secret, and
  diff checks;
- exact source and repository SHA-256 manifest verification;
- a final clean reset with no committed fixture state.

## Remaining gates

This closes the local read-before-Apply authority gap only. Remaining work is
still fail-closed:

- mount one server-owned runtime port that reads this authority and invokes
  the outer Apply transaction;
- replace the mounted editor's split local Apply path with that one client;
- add durable production CRUD authority for library/reference/application
  records instead of relying on controlled local fixtures;
- reconcile this isolated chain into a reviewed forward migration baseline;
- prove deployed Auth/RLS/Storage, server-only credentials, multi-replica
  recovery, live provider execution, billing boundaries, same-SHA staging,
  and public delivery.

Production readiness remains false.
