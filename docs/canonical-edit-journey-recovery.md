# Canonical Edit Journey Recovery

Status: authenticated local/private backend recovery contract

The canonical journey endpoint lets a planning client recover one authoritative backend state after refresh:

`GET /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-journey?workspaceId=:workspaceId`

The backend loads the latest owner-scoped planning handoff, publication-request candidate, canonical plan, estimate, approval snapshot, synthetic reservation, derived-job counts, execution package, completed private-review assembly, and completed review decision. The client does not reconstruct lineage by combining unrelated cached responses.

## Stages and next actions

| Stage | Next action |
| --- | --- |
| `planning_handoff_required` | Prepare the canonical planning handoff. |
| `publication_request_required` | Submit the exact handoff-bound publication candidate. |
| `internal_publication_pending` | Internal service publishes the persisted candidate after full revalidation. |
| `plan_approval_required` | Authenticated user reviews and approves the exact plan and estimate. |
| `approved_snapshot_available` | Request an execution package from the immutable funded snapshot. |
| `execution_in_progress` | Advance the server-derived private work graph for the exact execution package; recover its latest bounded checkpoint when one exists. |
| `private_review_assembly_required` | Assemble the exact private review after required work has a persisted completion certificate. |
| `private_review_ready` | Record one exact decision against the completed private-review assembly and final-artifact hashes. |
| `revision_requested` | Prepare a replacement plan through a new content-addressed planning handoff. |
| `private_review_accepted` | Wait for a separately authorized public-delivery milestone; acceptance grants no delivery authority. |
| `cancellation_pending` | Wait for cancellation reconciliation. |
| `replanning_required` | Prepare a replacement plan through a new handoff. |

Every response includes one `nextAction` with a code, actor, method, and route template. It also contains only bounded identity/hash/status summaries for stages that already exist. Package recovery exposes the package record, package hash, snapshot identity, and private-internal purpose. In-progress recovery may expose the latest package/snapshot-bound checkpoint hash, sequence, status, timestamp, completed/blocked/pending counts, required-incomplete count, and next required gate. Completed-work recovery exposes the package/snapshot identity, response hash, terminal status, completion time, bounded counts, and exact assembly gate. Review recovery exposes the assembly identity, manifest hash, final-artifact hash, and persisted decision status when one exists. A completed decision also exposes its decision-manifest hash and a credential-free private-history descriptor. That descriptor binds the authenticated history route to the exact workspace, execution package, decision manifest, and final-artifact hashes so a refreshed client can request either the current or a superseded private review without reconstructing lineage from cached state.

`execution_in_progress` remains the recovery state until all required jobs produce a package-scoped completion certificate. The certificate is private, create-only, checksum-verified, authority-bound, and restart-recoverable. Another graph-run key reuses the first certificate instead of replacing it. Once the certificate exists, recovery advances to `private_review_assembly_required`; it does not make the client rerun an already completed graph. Journey recovery never invents completed work from package creation alone.

During execution, the orchestrator attempts a progress update before work begins, after each resolved job, and when a run finishes. The store commits a new content-addressed immutable checkpoint only when the candidate advances completed/resolved state. A checksum-protected atomic latest pointer identifies the newest monotonic checkpoint. Completed-job and resolved-job counts cannot regress; a second run key cannot replace a stronger blocked checkpoint or a terminal completed checkpoint with earlier state. A crash may leave an unreferenced immutable checkpoint, but the latest pointer remains on the last fully committed state and a later run can resume from the separately persisted per-job evidence. This is single-process/single-host private recovery evidence, not a distributed scheduler or production event stream.

The response schema binds every stage to its exact action code, actor, HTTP method, and authority-derived route. It also enforces required and forbidden summaries, published-handoff state, plan/estimate status, package-to-snapshot identity, exact review decision/status pairs, and private-history descriptor lineage. Cross-stage field injection, action or route substitution, foreign snapshot or package identity, a decision or history descriptor inside `private_review_ready`, and mismatched revision/acceptance/history lineage fail validation instead of becoming recoverable client state.

## Safety boundary

Journey recovery is inspection-only. It returns no raw planning inputs, raw publication request body, work-graph job identity or outcome, artifact identity or bytes, filesystem path, credential, bearer token, signed URL, lease, dispatch grant, snapshot mutation permission, credit mutation permission, tool execution authority, provider authority, or render authority. The progress checkpoint summary contains counts and lineage only. The private-history descriptor contains only a method, an authenticated route, and immutable query identities/hashes. The client must still authenticate normally; the no-store history route independently revalidates membership, project/package/assembly/decision lineage, current-or-superseded plan state, reservation state, final-artifact QA, and reconciliation before returning the exact private bytes.

Plan-to-snapshot recovery verifies there is at most one immutable snapshot per canonical plan and that the approval, reservation, plan, and snapshot identities agree. Execution and review recovery revalidate current package/snapshot/reservation authority, the package completion certificate, checksum-protected review manifests, and exact decision lineage. It exposes reservation state, derived-job counts, completion/package/review hashes, and decision status—not job outcomes, artifact identities or bytes, private execution inputs, or filesystem paths.

The endpoint requires authenticated workspace/project ownership and is private local/internal evidence. Cross-user reads are hidden. Production, Supabase, providers, customer billing, deployment, public delivery, and production rendering remain unchanged and gated.

## Browser consumption

The named-edit chat route now consumes this endpoint through a frontend-safe, read-only recovery bridge. The bridge is enabled only for `/projects/:projectId/edits/:editSessionId`; the compatibility `/editor` surface does not issue canonical recovery reads.

Before anything reaches the UI, the browser parser requires the exact workspace, project, and edit identity; the stage-specific action code, actor, method, and route; required and forbidden authority fields; plan/estimate state; snapshot/package lineage; progress-count partitions; completion lineage; review-decision pairs; history-descriptor lineage; and inspection-only permission set. Unknown fields, route substitution, foreign identity, cross-stage decision data, inconsistent progress, authority escalation, or malformed history lineage fail closed.

The presentation adapter projects only user-facing status, bounded preparation counts, plan/estimate summaries when applicable, the persisted review decision when applicable, and the next safe explanation. It never renders backend routes, hashes, record identifiers, filesystem/storage details, provider/tool names, credentials, signed URLs, or execution authority. Returned `nextAction` metadata is validated but never executed by this bridge.

The status appears as one compact assistant-system surface inside the existing chat flow. It includes explicit copy that refreshing is read-only and cannot start editing, spend credits, or publish a video. Loading, unavailable, access-denied, not-found, and invalid-response states remain distinct. Identical in-flight reads are coalesced by authenticated scope/project/edit identity, manual refresh is accessible, and automatic refresh runs only for bounded in-flight stages while the page is visible.

This closes frontend inspection/recovery only. Canonical planning-handoff submission, publication-candidate submission, internal publication, plan/estimate approval, approved-snapshot package request, work-graph advancement, private-review assembly, review decision, revision submission, and authenticated history opening still require separate frontend mutation slices and their own evidence. The browser must not infer or invoke any of those actions from the recovery response.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:canonical-edit-journey-client`
- `npm run qa:canonical-journey-ui`
- `npm run qa:editor`
- `npm run qa:viewport`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
