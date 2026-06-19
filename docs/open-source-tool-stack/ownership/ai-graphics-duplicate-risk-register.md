# AI Graphics Duplicate Risk Register

Decision: `ai_graphics_owner_assignment_registered_pending_duplicate_review`

| Risk | Status | Handling |
| --- | --- | --- |
| Existing lane-level AI graphics ownership appears in `docs/open-source-tool-stack/open-source-tool-stack-owner-map.md` | `existing_lane_reference_found` | Treat as source context, not a conflicting named owner. |
| AI graphics / Worker metadata overlap appears in owner-lane reconciliation docs | `duplicate_review_required` | Keep `assignmentStatus: pending_duplicate_review` and `exclusiveOwnershipClaimed: false`. |
| Tool Route and Worker Runtime lanes include the 13 draft metadata tools | `coordination_required` | Atlas may coordinate metadata handoff only; Tool Route and Worker retain their execution boundaries. |
| Track A / Track B / Sound / Map / Provider Gateway ownership | `not_assigned` | Do not assign those tools to Atlas. |

Duplicate risk found: `true`

Concrete conflicting named owner found: `false`

Exclusive ownership claimed: `false`
