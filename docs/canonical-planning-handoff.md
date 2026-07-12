# Canonical Planning Handoff

Status: authenticated local/private backend handoff evidence

The canonical planning handoff binds finalized source uploads and the current planning-input state to the exact authority objects required for server-owned canonical plan publication. It replaces caller reconstruction of source, Exact Edit Preference, Preference DNA selection, Edit Brief, output-frame, and source-cleanup authority.

## Authenticated route

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoff`

The strict request contains:

- the authenticated workspace identity;
- a contiguous, one-based list of finalized source items in the user's confirmed order;
- the complete canonical plan components the planner intends to publish;
- the fixed `prepare_canonical_planning_handoff` purpose.

The route is available only in the explicit local/private test runtime. It requires authenticated workspace access and verifies project ownership before reading upload or planning authority.

## Verified authority

The service fails closed unless all of the following agree:

1. every source item has finalized upload-intent, media-asset, storage-object, checksum, size, MIME type, tenant, project, purpose, and private-object lineage;
2. source order is contiguous and exactly equals the canonical plan's source sequence;
3. the current Exact Edit Preference revision and fingerprint match the plan's edit level, target platform, cleanup choice, frame, and preference baseline;
4. output-frame and source-preparation confirmation are ready;
5. the current Preference DNA application state is verified, including approved DNA lineage when a preference is applied;
6. the current Edit Brief state is verified, including its deterministic publication binding when a brief exists;
7. the canonical plan components satisfy the existing planning-input authority resolver.

`preferenceApplicationVerified` and `editBriefVerified` mean the current state was verified. The valid current state can truthfully be `not_selected`, `cleared`, or `applied` for Preference DNA and `not_used` or `bound` for Edit Brief.

## Returned publication inputs

The response contains:

- a verified source-binding manifest candidate;
- the exact `sourceMediaAuthority` expectation;
- the exact `planningInputAuthority` expectation;
- the fully resolved planning-input binding;
- a deterministic handoff hash;
- explicit readiness and no-side-effect evidence.

The HTTP smoke feeds the returned source and planning-input authority directly into canonical plan publication. The broader canonical lifecycle smoke proves the same handoff rejects source-order drift and leaves edit authority unchanged before publication.

## Side-effect boundary

Preparing a handoff does not publish a plan, create a snapshot, reserve credits, execute tools, call providers, or render media. Plan publication and later approval remain separate server-owned gates.

This slice does not add frontend consumption, Supabase, RLS, cloud storage, provider activation, customer pricing or credits, wallet mutation, billing, public delivery, deployment, or production readiness. The next integration gate is browser consumption of this authenticated handoff without reviving the disabled legacy caller-authored execution route.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
