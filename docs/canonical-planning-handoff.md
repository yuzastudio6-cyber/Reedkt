# Canonical Planning Handoff

Status: authenticated local/private persisted handoff, frontend-safe submission, and publication-binding evidence

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

An authenticated planning client can now persist that handoff-bound publication payload without calling the internal route directly:

`POST /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests`

The content-addressed private candidate is inspectable without its raw body and can be published only through the internal candidate route documented in `docs/canonical-plan-publication-request-bridge.md`. Internal publication loads the candidate server-side and still performs the same full handoff revalidation.

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

## Frontend-safe named-edit bridge

The signed-in named-edit planner first reads the server-owned Exact Edit Preference authority and applies only the explicit current-edit differences through the authenticated optimistic-revision boundary. It then rebuilds the canonical components with the returned immutable baseline snapshot ID and preference revision before compiling the strict handoff request. Source order, optional Preference DNA, optional Edit Brief, output frame, cleanup, timing, and meaning-preservation gates must also be ready. The request sends only finalized source identities, upload order, checksums, and canonical plan components. Browser-held storage paths, signed/public URLs, source bytes, credentials, provider inputs, and caller-authored planning-evidence hashes are excluded.

The browser strictly verifies the returned workspace/project/edit identity, readiness, private create-only persistence, content hashes, and all no-side-effect flags. Foreign identity, extra fields, path/credential material, malformed hashes, or permission escalation fail closed. The outbound compiler also rejects private path, credential, URL-token, or source-byte fields instead of serializing them into canonical components. After the backend verifies finalized source authority, it first requires the canonical preference settings, baseline, and revision to match the exact record; a rejected mismatch leaves the authority revision unchanged. For an unlocked planning record, it derives and idempotently records the source-preparation evidence hash and frame-confirmation identity before binding the handoff. For a locked approved/active record, a Chat-led replacement handoff may reuse only the identical already-verified source/frame evidence and must not advance the preference record; changed locked evidence fails closed. Replacement-plan publication remains separately bound to the exact unconsumed revision decision and next immutable plan version. Identical concurrent saves coalesce only when the full exact request identity matches, and a late response cannot update a different named edit after navigation.

Every valid rich plan may persist its exact handoff components. The browser requests server-owned plan presentation only when the plan is exactly representable by the current proven private source-and-caption review graph. That route persists the publication candidate and coordinates internal publication entirely inside the backend. The browser never calls the protected publish route. It never drops a requested source, caption, visual, provider asset, color operation, audio operation, transition, SFX cue, or multi-segment decision to fit that runner. Exact duration-preserving ordered source sequences with one full-duration caption or two through seven ordered, non-overlapping captions can now compile into the bounded sequence graph described below. A one-source plan may additionally compile the exact approved `clean_natural` or `premium_clean` subtle/balanced FFmpeg color profile when its source trim, complete operation IDs/kinds, replacement voice, frame, and 4K estimate authority all match. Confirmed preserve-source-order plans whose cleanup authority keeps or preserves every source now derive one segment from each exact approved source range instead of cycling category templates or stretching short footage. Short caption ranges remain inside their owning segment and report readability risk rather than extending the final timeline. The normal two-source/rich regression therefore preserves its two one-second sources as exactly two seconds/60 frames and clears only the duration, one-to-one segment, and caption-range blockers. It still stops at `publication_request_required` because transitions, SFX, ducking, broader color/shot-matching work, richer audio, and unsupported segment-operation work are not silently flattened into the bounded runner.

The current exact candidate graph is limited to immutable snapshot validation, approved source-range validation, one dependency-free libass work item per caption cue, one Remotion source-and-caption private composition, and dependency-bound FFprobe final QA. It accepts either one exact source range or a bounded ordered sequence of two through eight unique MP4 source ranges. Sequence ranges must preserve duration, cover one contiguous final timeline in confirmed upload order, map one-to-one to final timing segments, remain inside verified source durations, and use only the supported preserve/keep/tighten cleanup actions. The proof executed two sources and two caption cues; two-through-eight source support and two-through-seven caption support above their proved counts are contract coverage, not maximum-count runtime evidence. Candidate compilation also requires safe caption text, exact cue/output-key lineage, verified video metadata, supported frame/FPS/duration bounds, and no unrepresented rich work. This is private/internal evidence, not public delivery or production rendering.

The HTTP smoke publishes through the persisted-handoff route rather than echoing authority fields back from the caller. It proves exact replay, rejects handoff-hash and canonical-component substitution, rejects preferences or same-project source authority changed after handoff, and verifies the accepted binding is present in canonical plan authority before approval. The broader 50-tool canonical lifecycle from the prior one-caption baseline also publishes its initial plan, focused review plan, and revision plan v2 through persisted handoffs. The caption-track slice has focused end-to-end canonical evidence, but does not claim a new post-change aggregate rerun of that entire revision branch.

## Side-effect boundary

Preparing a handoff performs private create-only handoff persistence and may idempotently promote only the server-derived source-preparation and frame-confirmation evidence described above into an unlocked exact preference authority. When that authority is locked, preparation can only reuse identical existing evidence read-only. It does not publish or approve a plan, create a snapshot, reserve credits, derive or execute jobs, execute tools, call providers, or render media. Handoff-bound plan publication still does not approve the plan, create a snapshot, reserve credits, derive jobs, execute tools, call providers, or render media. Approval remains a separate server-owned, explicit user gate.

The connected slice includes bounded frontend consumption, exact preference synchronization, server-owned plan presentation, and the separate exact canonical approval coordinator. It does not add Supabase, RLS, cloud storage, provider activation, customer pricing or charging, wallet mutation, billing, public delivery, deployment, Motion Studio, or production readiness. Signed-in named edits do not fall back to the older local approval/snapshot path while this canonical path is active. Canonical approval creates only the immutable snapshot, synthetic private-test reservation, and derived ready/blocked jobs; it starts no execution.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:backend-local-journey-authority`
- `npm run smoke:canonical-planning-publication-client`
- `npm run smoke:canonical-plan-approval-client`
- `npm run smoke:canonical-multi-source-final-composition`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run qa:canonical-journey-ui`
- `npm run check:frontend-boundary`
