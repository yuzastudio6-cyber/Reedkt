# Canonical Edit Reference Planning Authority Adapter Verification — 2026-07-20

Status: `source_verified_unreleased_contract_adapter`

## Outcome

The frozen Edit Reference production planning reader now has one server-only
adapter into ReEditPro's existing shared `PlanningPreferenceApplicationAuthorityPort`.
Planning preparation and later revalidation therefore select the same port
policy and retain the three canonical states:

- `not_selected` remains a never-selected state;
- `connected` maps to the planner's immutable `applied` binding; and
- `cleared` retains the removed application, lifecycle receipt, and committed
  planning-revision lineage instead of falling through to a legacy store.

The adapter performs exactly one canonical reader call for each authority
resolution. A canonical error is returned directly and never triggers the
private compatibility reader. The browser cannot supply planner context,
repository evidence, actor identity, or production readiness.

## Evidence Classification

The adapter deliberately emits
`canonical_contract_fixture_unreleased` and `productionAuthority=false`.
Production runtime rejects that evidence class. No live Supabase adapter is
constructed from the injected RPC contract fixture, and no route or runtime
factory mounts the adapter automatically.

A later release may provide a separately reviewed, source-verified production
port only after the canonical database chain, RLS/composite tenant binding,
live RPC adapter, same-SHA release evidence, and production readiness gates
pass. Caller assertion alone cannot promote this adapter.

## Source

- `server/services/edit-reference-production-planning-authority-port-adapter.ts`
- `server/services/planning-preference-application-authority-port.ts`
- `server/edit-references/edit-reference-production-planning-authority.ts`
- `server/edit-references/edit-reference-production-planner-binding-adapter.ts`
- `server/smoke/planning-preference-application-authority-port-smoke.ts`

## Verification

Run:

```bash
npm run smoke:planning-preference-application-authority-port
npx tsx server/smoke/edit-reference-production-planning-context-smoke.ts
npx tsx server/smoke/edit-reference-production-exact-edit-apply-smoke.ts
npm run smoke:edit-planning-authority
npm run typecheck:server -- --pretty false
npm run lint
npm run check:frontend-boundary
npm run check:secrets
```

The combined evidence proves the source-level mapping, exact-edit transaction
contract, planner preparation/revalidation boundary, state separation,
tamper/stale rejection, and fail-closed production behavior. It does not prove
remote persistence, a live Supabase transaction, deployed authentication/RLS,
provider or worker execution, customer pricing, credits, billing, deployment,
or public delivery.
