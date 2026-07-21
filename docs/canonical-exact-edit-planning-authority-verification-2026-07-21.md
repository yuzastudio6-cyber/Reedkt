# Canonical exact-edit preference planning authority — local verification

Date: 2026-07-21

## Outcome

This slice removes canonical planning's direct dependency on the retired
private exact-preference store. Planning now reads one tenant-bound exact-edit
preference authority, keeps Preference DNA/Application as its separate
canonical authority, and refuses to mutate user preferences merely to make a
draft plan match.

The browser performs one read-only authority request. The authenticated server
planning handoff verifies the finalized source candidate and records only
source-preparation evidence. That evidence commit does not change the seven
preference values, preference revision, planning-input revision, selected
Preference application, customer price, credits, approved history, provider
state, or worker state.

## Canonical behavior

- The immutable creation baseline and current seven-field preference values
  are returned together, with independent fingerprints.
- The planning revision, source-preparation evidence, confirmed frame, and
  lifecycle lock are explicit.
- Exact-edit preferences and a canonical Preference Application must be read
  at the same planning revision.
- Confirmed plan settings must match the current preference values, immutable
  baseline ID, preference revision, planning-input revision, fingerprint, and
  output frame.
- A cleanup change invalidates source preparation. A target-platform change
  continues to require output-frame reconfirmation through the existing atomic
  Apply receipt.
- Planning creates no PATCH request. A mismatch returns the user to the exact
  edit for refresh/replanning.
- Canonical plan approval projects only the server-issued immutable snapshot
  and reservation identities into the exact-edit recovery handoff. It does not
  fabricate or recreate an approval. Canonical recovery stays on the canonical
  journey instead of calling the legacy private snapshot loader.
- Canonical read or evidence failures never fall through to a second store.
- Approved/private-review preference authority remains immutable; revision
  uses the existing Chat-led revision and fresh-plan path.

## Isolated database proof

Forward-only local migration:

`database/canonical-v3-local/supabase/migrations/202607210006_canonical_exact_edit_planning_authority.sql`

It adds the immutable baseline and source-preparation fields to the isolated
canonical V3 state, installs validation/immutability guards, and defines:

- `read_exact_edit_planning_authority_v1`
- `record_exact_edit_planning_evidence_v1`

The historical `supabase/migrations/` directory remains unchanged and has
status `blocked_by_parallel_foundations`.

The local SQL proof covers authority read, evidence commit, exact replay,
cross-workspace denial, baseline immutability, and cleanup-triggered source
repreparation. The loopback TypeScript and PostgREST proofs validate the same
payload with the production boundary schemas. The loopback HTTP allowlist
includes only the reviewed authority-read and evidence-recording RPCs. The
loopback adapter is fixed as non-production and cannot self-promote.

## Verification matrix

Required green commands for this frozen slice:

```text
npm run smoke:planning-exact-edit-preference-authority-port
npm run smoke:canonical-planning-publication-client
npm run smoke:edit-planning-authority
npm run typecheck:server
npm run build
database/canonical-v3-local/run-local-verification.sh
npx playwright test --config tests/e2e/playwright.current-edit-preferences-atomic.config.ts
npm run check:frontend-boundary
npm run check:secrets
git diff --check
```

The mounted browser suite must pass the two cases that were previously marked
expected-fail: cleanup invalidation/repreparation and approved preference lock
with Chat-led revision. Skips and expected failures are not acceptance.

## Explicit release boundary

This is local/private contract and browser evidence only. It does not activate
or prove remote Supabase/Auth/RLS/Storage, a deployed server-only RPC adapter,
providers, Google Cloud, customer pricing, credits, billing, rendering,
deployment, public delivery, or production readiness. Production selection
still requires a source-verified canonical adapter and same-release staging
evidence; absent or unreleased authority fails closed.
