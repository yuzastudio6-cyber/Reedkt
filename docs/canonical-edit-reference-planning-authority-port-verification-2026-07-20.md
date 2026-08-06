# Canonical Edit Reference Planning Authority Port Verification

Date: 2026-07-20

Scope: backend source and private/local compatibility only

Production ready: **false**

## Outcome

The shared planner no longer reads `private-preference-intelligence-store`
as its implicit reusable Preference/DNA/Application authority. It now resolves
that input through one server-only
`planning-preference-application-authority-port-v1`.

The port preserves three different canonical states:

- `not_selected`: no Edit Preference has ever been selected for the edit;
- `connected`: one canonical application is mapped to the planner's existing
  `applied` binding; and
- `cleared`: durable remove lineage remains explicit and cannot fall through to
  a prior application or the compatibility store.

Each resolution selects exactly one authority. If a canonical port was
injected, its result or error is final for that resolution. There is no legacy
read after a canonical clear, error, invalid result, or stale expectation.
Expectation preparation and later binding/revalidation use the same port
selection policy and exact application identity, version, and content hash.

## Canonical contract alignment

This bridge was reconciled against the read-only Edit Reference feature source
at commit `a23862bba60386da9f415884cca0218bbc0db75f`. It reserves the production
repository authority
`canonical_edit_reference_production_repository`, the canonical read state
semantics of `read_exact_edit_reference_application_state_v2`, and the release
gate `server_only_application_and_planning_read_rpc_adapters_verified`.

It does **not** copy or mount the feature branch's process-branded injected RPC
fixture. It does not implement the future lifecycle mutation
`mutate_edit_reference_application_lifecycle_v3`. The live repository adapter,
transactional tenant/RLS proof, and one atomic application-to-planning
transaction remain separate future integration work.

## Runtime boundary

The optional port enters through `ReeditProApiAppOptions`, is held only in the
server runtime state, and is projected into `ServiceContext`. No route body,
header, browser client, or frontend contract can select the repository, state,
application, fallback, or executable implementation.

Hosted/cloud mode rejects the local compatibility path, even when it is not a
production build. Production mode additionally rejects all of the following:

- no injected port;
- the private compatibility adapter;
- a canonical contract fixture marked unreleased;
- a noncanonical source authority;
- a result that does not prove the legacy store was skipped; or
- a result without the canonical verified-runtime classification.

There is currently no production factory capable of supplying that verified
classification. The acceptance case in the smoke is a future-interface
contract fixture only and is not release evidence.

## Compatibility boundary

Protected local/internal workflows continue through a deliberately named
`private_preference_intelligence_compatibility` adapter when no canonical port
is injected. That adapter preserves current single-host test behavior but is
always classified `private_internal_compatibility`, reports that it performed
the legacy read, and can never satisfy the production gate.

## Evidence

The focused smoke verifies:

- `not_selected`, `connected`, and `cleared` remain distinct;
- one selected port read per resolution;
- canonical clear and canonical error never trigger fallback;
- durable clear identity/version/hash, remove receipt, and planning revision;
- stale expectation and receipt tampering fail before publication;
- the server-only HTTP context carries the injected port;
- local compatibility is non-promotable; and
- production requires the canonical verified-runtime classification.

The existing canonical edit-planning regression verifies that the local
compatibility path still prepares, publishes, revalidates, approves, and
rejects stale/tampered planning authority as before.

The following commands completed with exit code `0` on the bounded source
tree:

- `npm run smoke:planning-preference-application-authority-port`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-planning-publication-client`
- `npm run typecheck:server -- --pretty false`
- `npm run lint`
- `npm run build`
- `npm run check:frontend-boundary`
- `npm run check:secrets`
- `git diff --check`

No SQL, migration, Supabase call, provider call, media execution, customer
price, credits, service fee, wallet mutation, billing, deployment, public
delivery, or remote mutation is part of this slice.

## Remaining gates

1. Reconcile the feature-owned production planning reader and adapter into the
   same source lineage without retaining a second Preference authority.
2. Implement and review the server-only transactional repository/RPC adapters
   for the V3 lifecycle mutation and V2 planning read.
3. Prove authenticated tenant isolation, RLS, CAS, idempotent replay, explicit
   clear history, and atomic plan/estimate invalidation on controlled staging.
4. Run the same-SHA signed-in website journey from preference creation through
   DNA approval, exact-edit apply, fresh plan/estimate, approval, execution,
   private review, reload, replace, and remove.

Until those gates pass, the result is a source-verified backend integration
port with protected local compatibility—not a production-ready Edit Reference
workflow.
