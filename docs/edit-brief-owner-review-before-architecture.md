# Edit Brief Owner Review Before Architecture

Status: audit only. Owner decisions pending for future `ProjectEditSession` Edit Brief architecture. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Pending Owner Decisions

| Decision | Current default | Status |
| --- | --- | --- |
| Brief tab name | Edit Brief | pending owner approval |
| Route | `/projects/:projectId/edits/:editSessionId/brief` | pending owner approval |
| Marker drawer vs popup | Drawer preferred for dense editing | pending owner approval |
| Marker AI default | Off or confirm-only until provider gates exist | pending owner approval |
| Marker types | Use existing Edit Cue roles as candidate source | pending owner approval |
| Marker statuses | Draft, needs review, confirmed, blocked, applied candidates | pending owner approval |
| Export settings visible in Brief | Yes, session-level access | pending owner approval |
| Source attachments metadata-only first | Yes | pending owner approval |
| Main chat marker summary events | Summaries only, not raw marker messages | pending owner approval |
| Marker-vs-DNA precedence | Confirmed Marker outranks DNA, after safety/policy | pending owner approval |

## Required Review Inputs

- Existing Edit Brief/Edit Cue de-duplication decision.
- Whether future user-facing term is Marker, Cue, or both.
- Whether the first implementation milestone should be architecture-only, types/contracts, or mock repository.
- Confirmation that no production runtime should be enabled.

All decisions remain pending. No approval is fabricated by RP-EDITBRIEF-00.

## RP-EDITBRIEF-01 Follow-Up

RP-EDITBRIEF-01 documents the product flow and architecture map, but these owner decisions still remain pending. The new owner review source is `docs/edit-brief-owner-review-decisions.md`. Do not proceed to RP-EDITBRIEF-02 types/contracts/mock fixtures until owner review confirms the route, naming, Marker policy, attachment policy, Export Settings fields, planner priority, and schema timing.
