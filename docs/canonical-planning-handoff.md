# Canonical Planning Handoff

Status: authenticated local/private persisted handoff and publication-binding evidence

The canonical planning handoff binds finalized source uploads and the current planning-input state to the exact authority objects required for server-owned canonical plan publication. It replaces caller reconstruction of source, Exact Edit Preference, Preference DNA selection, Edit Brief, output-frame, and source-cleanup authority.

## Authenticated route

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoff`

The strict request contains:

- the authenticated workspace identity;
- a contiguous, one-based list of finalized source items in the user's confirmed order;
- the complete canonical plan components the planner intends to publish;
- the fixed `prepare_canonical_planning_handoff` purpose.

The route is available only in the explicit local/private test runtime. It requires authenticated workspace access and verifies project ownership before reading upload or planning authority.

An accepted handoff is persisted through the shared private-local boundary as a tenant-scoped, content-addressed, create-only, checksum-protected record. Exact replay returns the same `handoffId`, `handoffHash`, component hash, and authority payload. The response never exposes a filesystem path.

The connected internal publication route is:

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publish`

Its body contains the planning request, estimate, work graph, exact canonical plan, and expected handoff hash. It deliberately omits caller-supplied `planningInputAuthority` and `sourceMediaAuthority`. The backend loads those authorities from the tenant-scoped persisted handoff, verifies the exact canonical component hash, revalidates current planning-input and source authority, and then freezes a compact handoff binding into the canonical plan component references. Approval copies that reference into the immutable snapshot lineage.

One persisted handoff can publish exactly one full canonical publication request. The frozen binding includes the complete publication-request hash and a hash of the accepted idempotency key. Exact replay with the same request and key returns the original canonical authority; a second key, changed estimate, changed work graph, changed revision authority, or any other publication substitution fails closed. Same-host concurrent exact requests serialize and converge on one plan; concurrent competing keys produce one winner and one conflict. The canonical plan binding is the durable single-host receipt, so restart recovery can distinguish an exact replay from a second publication without a separate mutable handoff-consumption record. A request that fails validation before plan persistence does not consume the handoff.

The former direct HTTP route, `POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-plans`, now fails closed with `TOOL_NOT_READY` and identifies the persisted-handoff publication route as its replacement. Service-level construction remains available to bounded backend fixtures, but authenticated HTTP callers cannot bypass persisted server-loaded planning/source authority.

The older `local-edit-plans` route is available only in the explicit local/internal testing runtime. Its response is classified `legacy_local_preview_only`, is owner/workspace scoped, and grants no canonical-plan, snapshot, credit, tool, provider, worker, or render authority. It cannot substitute for this persisted handoff or the internal handoff-bound publication route.

Authenticated restart/recovery inspection is available at:

`GET /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId?workspaceId=:workspaceId`

When the caller no longer has the handoff ID, the latest serialized preparation for that exact edit session is discoverable at:

`GET /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/latest?workspaceId=:workspaceId`

The latest pointer is a small checksum-protected, tenant-scoped private record updated only after an immutable handoff write succeeds. Preparation is serialized per owner/workspace/project/edit session, so two different accepted preparations have a deterministic latest winner while both immutable handoffs remain addressable by ID. The tenant-scoped inspection response reports checksum-verified handoff identity and either `unpublished` with full publication revalidation required, or `published` with immutable plan identity and exact-replay-only status. It is inspection-only: it returns no filesystem path, credential, raw media, execution input, provider authority, credit authority, or mutation permission. Same-workspace users cannot inspect another owner's handoff, handoff or pointer checksum tampering fails closed, and a fresh service instance recovers state from private persistence and canonical plan binding.

## Verified authority

The service fails closed unless all of the following agree:

1. every source item has finalized upload-intent, media-asset, storage-object, checksum, size, MIME type, tenant, project, purpose, and private-object lineage;
2. source order is contiguous and exactly equals the canonical plan's source sequence;
3. the current Exact Edit Preference revision and fingerprint match the plan's edit level, target platform, cleanup choice, frame, and preference baseline;
4. output-frame and source-preparation confirmation are ready;
5. the current Preference DNA application state is verified, including approved DNA lineage when a preference is applied;
6. the current Edit Brief state is verified, including its deterministic publication binding when a brief exists;
7. the canonical plan components satisfy the existing planning-input authority resolver.

Source authority revision and checksum are project-scoped. An upload in another project cannot invalidate this edit's approved source authority, while any upload-authority change in the same project changes the candidate and requires an exact reload/replan. Live storage-object bytes and identity are still reverified at every authority boundary.

`preferenceApplicationVerified` and `editBriefVerified` mean the current state was verified. The valid current state can truthfully be `not_selected`, `cleared`, or `applied` for Preference DNA and `not_used` or `bound` for Edit Brief.

## Returned publication inputs

The response contains:

- a verified source-binding manifest candidate;
- the exact `sourceMediaAuthority` expectation;
- the exact `planningInputAuthority` expectation;
- the fully resolved planning-input binding;
- a deterministic canonical-plan component hash, handoff hash, and content-addressed handoff ID;
- non-production private persistence evidence;
- explicit readiness and no-side-effect evidence.

The HTTP smoke publishes through the persisted-handoff route rather than echoing authority fields back from the caller. It proves exact replay, rejects handoff-hash and canonical-component substitution, rejects preferences or same-project source authority changed after handoff, and verifies the accepted binding is present in canonical plan authority before approval. The broader 50-tool canonical lifecycle also publishes its initial plan, focused five-job review plan, and revision plan v2 through persisted handoffs. It proves source-order drift is rejected, each changed revision receives a fresh component-bound handoff, both snapshot generations preserve the exact binding, and approved execution reload validates that binding before work proceeds.

## Side-effect boundary

Preparing a handoff performs only the private create-only authority persistence described above. It does not publish a plan, create a snapshot, reserve credits, execute tools, call providers, or render media. Handoff-bound plan publication still does not approve the plan, create a snapshot, reserve credits, derive jobs, execute tools, call providers, or render media. Approval remains a separate server-owned gate.

This slice does not add frontend consumption, Supabase, RLS, cloud storage, provider activation, customer pricing or credits, wallet mutation, billing, public delivery, deployment, or production readiness. The next integration gate is browser consumption of this authenticated handoff without reviving the disabled legacy caller-authored execution route.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:backend-local-journey-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
