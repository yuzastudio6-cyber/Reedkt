# Canonical V3 local exact-edit atomic Apply verification

Date: 2026-07-21

## Verdict

The isolated `database/canonical-v3-local` chain now proves one transactional
Apply boundary for Current Edit Preferences and the optional Edit Reference
lifecycle subcommand. The proof is local-only. It does not change or bless the
historical `supabase/migrations/` chain and it does not authorize a remote
Supabase project, provider, cloud worker, billing, deployment, or production
release.

## Implemented boundary

`apply_exact_edit_preferences_and_reference_v1`:

- transactionally locks and re-reads the exact project/edit preference state;
- validates tenant membership, project/edit binding, request digest,
  idempotency identity, expected record/preference/planning revisions, and the
  current preference fingerprint;
- derives changed fields from the canonical stored values rather than trusting
  the browser;
- invokes `mutate_edit_reference_application_lifecycle_v3` only as a nested
  operation when an apply/replace/remove command is present;
- increments the outer preference record and planning revision exactly once;
- invalidates stale draft plan/estimate state and revokes active execution
  authority without changing immutable approved snapshots or historical
  private reviews;
- reruns source preparation for cleanup changes and clears output-frame
  confirmation for target-platform changes;
- stores one immutable exact-edit Apply event and a replay-safe receipt;
- leaves customer price, customer credits, service fee, provider execution,
  and worker execution untouched.

## Local HTTP and RLS proof

The runner performs an actual loopback PostgREST request at
`http://127.0.0.1:57431` using a locally signed authenticated JWT and the local
anonymous API key. No service-role credential is used to execute the Apply
RPC.

The mounted transport proof verifies:

- combined preference plus Edit Reference apply succeeds through HTTP;
- exact replay returns the same transaction and receipt digest;
- the canonical planning read sees the connected application and committed
  lifecycle revision;
- a user from the second workspace cannot mutate the first workspace;
- RLS returns zero Apply events across workspace boundaries;
- authenticated direct writes to the immutable event table are denied;
- the transport accepts only the fixed loopback origin and reviewed RPC names;
- local capabilities cannot be promoted to production authority.

## Verification

The frozen source passed:

- clean local Supabase reset through migrations `001`–`004`;
- SQL suites `001`–`005`, including two-user/two-workspace forced-RLS,
  lifecycle CAS/idempotency, recovery/internal-cost, schema/grant invariants,
  and the outer exact-edit Apply transaction;
- the existing V6 local RPC adapter smoke;
- the actual loopback PostgREST HTTP/JWT/RLS smoke;
- server TypeScript, focused lint, full lint, build, frontend-boundary, secret,
  and diff checks;
- source and repository-file SHA-256 manifest verification;
- a final clean database reset, leaving no committed fixture state.

## Remaining gates

This closes the local schema/RPC/RLS and outer-transaction contract gap only.
The following remain closed and require separate owner authorization and
same-source evidence:

- reviewed forward migration reconciliation from the isolated chain;
- deployed Supabase Auth/RLS/Storage and encrypted credential handling;
- live server-only repository/RPC factory activation;
- multi-replica workers, provider execution, and recovery;
- customer pricing, credits, wallet, billing, and service-fee settlement;
- staging/production deployment and public delivery;
- final one-writer reconciliation of the mounted Current Edit Preferences UI
  so its single Apply action consumes this exact transaction instead of the
  current split local authorities.

Production readiness remains false.
