# Canonical Edit Journey Recovery

Status: authenticated local/private backend recovery contract

The canonical journey endpoint lets a planning client recover one authoritative backend state after refresh:

`GET /v1/projects/:projectId/edit-sessions/:editSessionId/canonical-journey?workspaceId=:workspaceId`

The backend loads the latest owner-scoped planning handoff, publication-request candidate, canonical plan, estimate, approval snapshot, synthetic reservation, and derived-job counts. The client does not reconstruct lineage by combining unrelated cached responses.

## Stages and next actions

| Stage | Next action |
| --- | --- |
| `planning_handoff_required` | Prepare the canonical planning handoff. |
| `publication_request_required` | Submit the exact handoff-bound publication candidate. |
| `internal_publication_pending` | Internal service publishes the persisted candidate after full revalidation. |
| `plan_approval_required` | Authenticated user reviews and approves the exact plan and estimate. |
| `approved_snapshot_available` | Request an execution package from the immutable funded snapshot. |
| `cancellation_pending` | Wait for cancellation reconciliation. |
| `replanning_required` | Prepare a replacement plan through a new handoff. |

Every response includes one `nextAction` with a code, actor, method, and route template. It also contains only bounded identity/hash/status summaries for stages that already exist.

## Safety boundary

Journey recovery is inspection-only. It returns no raw planning inputs, raw publication request body, filesystem path, credential, snapshot mutation permission, credit mutation permission, tool execution authority, provider authority, or render authority.

Plan-to-snapshot recovery verifies there is at most one immutable snapshot per canonical plan and that the approval, reservation, plan, and snapshot identities agree. It exposes reservation state and derived-job counts, not private execution inputs.

The endpoint requires authenticated workspace/project ownership and is private local/internal evidence. Cross-user reads are hidden. Production, Supabase, providers, customer billing, deployment, public delivery, and production rendering remain unchanged and gated.

## Verification

- `npm run smoke:edit-planning-authority`
- `npm run typecheck:server`
- `npm run lint`
- `npm run check:frontend-boundary`
- `npm run qa:internal-pipeline`
