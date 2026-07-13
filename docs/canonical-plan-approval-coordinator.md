# Canonical Plan Approval Coordinator

Status: authenticated local/private browser-to-backend approval bridge

The canonical plan approval coordinator connects the named-edit Plan Review button to the exact canonical plan and estimate that the authenticated user reviewed. It is intentionally narrower than execution.

## Route and browser request

The frontend-safe route is:

`POST /v1/edit-plans/:editPlanId/canonical-approval`

The body contains only:

- workspace, project, and edit-session identity;
- expected plan version and plan hash;
- expected estimate identity and estimate hash;
- the exact maximum credits shown in Plan Review.

The browser never supplies the canonical authority revision, an internal-service token, raw plan components, work items, job identities, storage paths, credentials, leases, dispatch grants, provider inputs, or render inputs.

## Server-owned approval authority

The coordinator loads the current canonical plan and estimate from server-owned private authority. It rejects a changed project, edit session, version, plan hash, estimate identity, estimate hash, or maximum credit amount before mutation. The existing canonical approval service then revalidates the current upload/source binding, synchronized Exact Edit Preference baseline/revision plus backend-derived source/frame evidence, Preference DNA application, Edit Brief, frame and cleanup state, plan components, tool identity authority, tool payload authority, estimate validity, and synthetic test-credit availability.

The server derives the authority revision and approval idempotency key. A browser cannot select either value.

One successful local/private approval atomically:

1. marks the exact plan and estimate approved;
2. creates one immutable approved snapshot;
3. creates one synthetic private-test credit reservation for the exact approved maximum;
4. derives the approved jobs in ready or dependency-blocked state.

It does not request an execution package, claim a lease, issue or consume a dispatch grant, run a job or tool, call a provider, render media, mutate a customer wallet, execute paid billing, settle usage, or deliver an artifact.

## Exact replay and concurrency

Approval is serialized per workspace and plan inside the current single-process local/private runtime. Two concurrent exact browser requests converge on one approval lineage: one returns `approved_now`, and the other returns `exact_replay`. A replay is returned only while the snapshot remains in the pre-execution state: the synthetic reservation is still `reserved`, and every derived job is still ready or blocked. Once execution or reconciliation changes that state, this approval endpoint no longer pretends the old pre-execution receipt is current.

This lock and persistence evidence is single-host/local. It is not a distributed lock, deployed worker guarantee, or production transaction claim.

## Credit-total binding

The Plan Review total is the approval maximum. The canonical planning compiler represents ordinary estimate lines and fallback allowance separately, then requires:

`sum(canonical line items) + fallback allowance = visible Plan Review total`

The visible fallback line is not counted a second time in canonical line items. Missing, duplicated, mismatched, or over-total fallback data blocks canonical publication before approval. The coordinator then requires the reserved test credits to equal that same maximum.

This is synthetic local/private reservation evidence. It is not Stripe billing, customer-wallet mutation, settlement, charging, refund, or production ledger evidence.

## Bounded receipt

The response includes only:

- exact workspace/project/edit identity;
- approved plan/estimate identity, version, hashes, and maximum;
- approval, snapshot, reservation, and snapshot hash identity;
- reserved credits and bounded ready/blocked job counts;
- explicit false flags for billing, wallet, execution, tool, provider, render, and delivery activity;
- private-local, tenant-scoped, non-distributed, non-production flags.

The strict browser parser rejects unknown fields, foreign identity, substituted version/hash/credits, non-reserved state, inconsistent job counts, private material, or any forbidden side-effect flag.

## Named-edit UI behavior

The Plan Review button becomes available only when all of these agree:

- the route is a backend-connected named edit;
- journey recovery says the exact plan and estimate are `presented`;
- the plan ID, plan version, and plan hash match the just-presented browser result;
- the recovered estimate identity and hash are valid approval authority;
- the recovered maximum equals the credit total visible in Plan Review.

Approval is explicit and user-triggered. While the request is in flight, the button is disabled, exposes `aria-busy`, and shows a live approval status. Success refreshes journey recovery and presents `approved_snapshot_available`. It does not switch the editor into processing, create a local execution rehearsal, or start the legacy private-review path.

Insufficient credits, stale authority, access denial, invalid responses, and unknown network outcomes remain distinct. When the mutation outcome is unknown, the UI tells the user to refresh the saved workflow instead of blindly retrying a possibly completed reservation.

## Scope boundary

This slice adds no Supabase migration or remote Supabase action, provider activation, Google Cloud resource, customer billing, deployment, production render, public export, Motion Studio, or MS-001 behavior. Package request, work-graph advancement, review assembly, review decision, revision submission, and private-history opening remain separate browser mutation milestones.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-plan-approval-client`
- `npm run smoke:canonical-planning-publication-client`
- `npm run smoke:canonical-edit-journey-client`
- `npm run qa:canonical-journey-ui`
- `npm run typecheck:server`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run check:frontend-boundary`
- `npm run check:secrets`
