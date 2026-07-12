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
| `execution_in_progress` | Advance the server-derived private work graph for the exact execution package. |
| `private_review_ready` | Record one exact decision against the completed private-review assembly and final-artifact hashes. |
| `revision_requested` | Prepare a replacement plan through a new content-addressed planning handoff. |
| `private_review_accepted` | Wait for a separately authorized public-delivery milestone; acceptance grants no delivery authority. |
| `cancellation_pending` | Wait for cancellation reconciliation. |
| `replanning_required` | Prepare a replacement plan through a new handoff. |

Every response includes one `nextAction` with a code, actor, method, and route template. It also contains only bounded identity/hash/status summaries for stages that already exist. Package recovery exposes the package record, package hash, snapshot identity, and private-internal purpose. Review recovery exposes the assembly identity, manifest hash, final-artifact hash, and persisted decision status when one exists.

`execution_in_progress` remains the recovery state until a completed private-review assembly exists. The private work-graph route is replay-safe and returns its own exact terminal assembly gate after required jobs complete; journey recovery never invents completed work from package creation alone.

The response schema binds every stage to its exact action code, actor, HTTP method, and authority-derived route. It also enforces required and forbidden summaries, published-handoff state, plan/estimate status, package-to-snapshot identity, and exact review decision/status pairs. Cross-stage field injection, action or route substitution, foreign snapshot identity, a decision inside `private_review_ready`, and mismatched revision/acceptance lineage fail validation instead of becoming recoverable client state.

## Safety boundary

Journey recovery is inspection-only. It returns no raw planning inputs, raw publication request body, filesystem path, credential, snapshot mutation permission, credit mutation permission, tool execution authority, provider authority, or render authority.

Plan-to-snapshot recovery verifies there is at most one immutable snapshot per canonical plan and that the approval, reservation, plan, and snapshot identities agree. Execution and review recovery revalidate current package/snapshot/reservation authority, checksum-protected review manifests, and exact decision lineage. It exposes reservation state, derived-job counts, package/review hashes, and decision status—not private execution inputs or artifact bytes.

The endpoint requires authenticated workspace/project ownership and is private local/internal evidence. Cross-user reads are hidden. Production, Supabase, providers, customer billing, deployment, public delivery, and production rendering remain unchanged and gated.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
