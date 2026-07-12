# Canonical Plan Publication Request Bridge

Status: authenticated local/private backend bridge with internal publication evidence

This bridge connects an authenticated planning client to the existing persisted canonical planning handoff without giving that client internal publication or execution authority.

## Submit and inspect

An authenticated client submits the exact handoff-bound plan candidate at:

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests`

The backend verifies workspace/project ownership, loads the owner-scoped persisted handoff, rejects changed handoff or canonical component hashes, rejects secret-like content, and persists the full request as a create-only, content-addressed, checksum-protected private record. Exact content replay converges on the same candidate ID without relying on a generic response cache.

Safe current state is inspected at:

`GET /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/:candidateId?workspaceId=:workspaceId`

When the client no longer has the candidate ID, the latest serialized candidate for that exact handoff is recovered at:

`GET /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/latest?workspaceId=:workspaceId`

Candidate submission is serialized per owner/workspace/project/edit session/handoff. The immutable candidate is written before a checksum-protected latest pointer is replaced, so exact replay is stable and a later accepted candidate becomes recoverable without hiding earlier content-addressed candidates.

Inspection returns hashes and one of:

- `pending_internal_publication`;
- `published`;
- `superseded_by_competing_candidate`.

It returns no raw publication body, filesystem path, credential, plan mutation permission, snapshot permission, credit authority, tool authority, provider authority, or render authority.

Latest discovery is owner/workspace scoped. Cross-user reads are hidden, checksum tampering fails closed, and a fresh service instance recovers the same candidate from private persistence.

## Internal publication

The internal route is:

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/:candidateId/publish`

It requires authenticated user context, the internal-service boundary, an idempotency key, the workspace, and the exact candidate hash. The route loads the private candidate server-side and then invokes the existing handoff publication service. Current Exact Edit Preferences, Preference DNA application, Edit Brief, source media, output frame, cleanup state, canonical components, estimate, and work graph are revalidated before plan publication.

The published plan freezes the same publication-request hash carried by the candidate. A second candidate cannot replace a handoff that has already published, and exact internal replay returns the original canonical authority.

## Side-effect boundary

Candidate submission and inspection do not publish or approve a plan, create a snapshot, reserve or spend credits, create jobs, execute tools, call providers, render media, or deliver an artifact. Internal publication creates only presented canonical plan and estimate authority; approval, funding, job derivation, execution, and delivery remain separate gates.

The bridge is local/private backend evidence. The frontend has not yet been changed to call it. It adds no provider activation, Supabase action, customer billing, wallet mutation, deployment, public delivery, production rendering, Motion Studio, or production-readiness claim.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
