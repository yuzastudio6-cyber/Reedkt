# Canonical Plan Publication Request Bridge

Status: authenticated local/private backend bridge with frontend-safe plan presentation and protected internal publication evidence

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

The higher-level `canonical-journey` recovery endpoint combines this safe candidate state with the latest handoff, plan, estimate, and approval snapshot so a future frontend can recover one exact next action without reconstructing authority client-side. See `docs/canonical-edit-journey-recovery.md`.

## Frontend candidate boundary

The named-edit frontend now calls the authenticated exact-preference, handoff, and plan-presentation routes through the reviewed browser-safe transport. Before it prepares the handoff, it reads the server-owned Exact Edit Preference authority, applies only explicit current-edit differences with optimistic revision matching and deterministic idempotency, and rebuilds the canonical components with the returned baseline snapshot ID and preference revision. It does not call the protected internal publication route, receive an internal-service token, author source/frame evidence, or execute the `nextAction` returned by journey recovery.

Candidate submission is deliberately narrower than handoff submission. A complete, valid plan can save its exact planning handoff even when publication is blocked. The browser creates a candidate only for the currently proven private source-and-caption work graph, after confirming one finalized MP4 source, one continuous approved source range equal to the final frame count, one full-range safe caption, a supported frame/FPS/duration, no provider prompts, and no unrepresented visual, color, audio, transition, SFX, or multi-segment work. This preserves the difference between “planning inputs saved” and “exact execution candidate saved.”

The response parser returns only a bounded user-facing status. Backend IDs, hashes, routes, tool names, filesystem details, and credentials are not rendered. Foreign tenant identity, changed handoff lineage, unexpected permissions, raw request-body exposure, or path/credential exposure is rejected.

## Server-owned plan presentation

When the browser has an exactly representable candidate, it calls:

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/plan-presentations`

This authenticated route first persists the same content-addressed candidate described above. A server-owned coordinator then reloads that candidate from private persistence and invokes the existing internal publication service with an idempotency key derived from the immutable candidate hash. The browser neither supplies that publication idempotency authority nor calls the internal route.

Presentation is serialized per workspace/project/edit/handoff. Concurrent exact requests converge on one published candidate and one presented plan. Exact replay returns the existing inspection; a competing candidate cannot replace the single published handoff. The response contains the bounded publication-request inspection only. It does not return the canonical request body, component blobs, internal token, filesystem path, credential, snapshot, reservation, job, lease, dispatch, artifact, tool input, provider input, or render authority.

## Internal publication

The internal route is:

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/:candidateId/publish`

It requires authenticated user context, the internal-service boundary, an idempotency key, the workspace, and the exact candidate hash. The route loads the private candidate server-side and then invokes the existing handoff publication service. Current Exact Edit Preferences—including the server-derived source-preparation and frame-confirmation evidence—Preference DNA application, Edit Brief, source media, output frame, cleanup state, canonical components, estimate, and work graph are revalidated before plan publication.

The published plan freezes the same publication-request hash carried by the candidate. A second candidate cannot replace a handoff that has already published, and exact internal replay returns the original canonical authority.

## Side-effect boundary

Standalone candidate submission and inspection do not publish or approve a plan, create a snapshot, reserve or spend credits, create jobs, execute tools, call providers, render media, or deliver an artifact. The plan-presentation coordinator adds only presented canonical plan and estimate authority after the same internal revalidation. Approval, funding, snapshot creation, job derivation, execution, and delivery remain separate gates.

The bridge is local/private evidence with bounded frontend submission. It adds no provider activation, Supabase action, customer billing, wallet mutation, deployment, public delivery, production rendering, Motion Studio, or production-readiness claim. The browser can request plan presentation but cannot invoke internal publication directly; the backend-owned coordinator and full current-state revalidation remain mandatory. Exact plan/estimate approval is now a separate frontend-safe mutation described in `docs/canonical-plan-approval-coordinator.md`; plan presentation itself still grants no approval, snapshot, reservation, job, execution, or delivery authority.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-planning-publication-client`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
- `npm run qa:canonical-journey-ui`
