# Edit Brief Planner Integration Audit

Status: audit only. This report treats confirmed markers as future `ProjectEditSession` planning inputs and adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Existing Planning Surfaces

| Surface | Current purpose | Future Brief relationship |
| --- | --- | --- |
| Project setup / resolver | Builds mock setup packages and resolves Edit Preference contracts. | Confirmed markers should become high-priority resolver inputs later. |
| Preference DNA application | Applies reusable style/DNA to Edit Chats with QA policy. | Markers override DNA when explicit and safe. |
| Edit plan repository | Mock persistence seam for preference-aware edit plans and quality package. | Future marker bridge can attach plan hints. |
| Creative systems | Mock creative hints and style systems. | Markers can constrain local decisions without calling providers. |
| Edit Quality / QA | Mock QA and compliance surfaces. | Marker conflicts and do-not-copy should feed QA. |
| Credit estimate | Estimate-only package today. | Marker complexity may influence future estimates, never spend credits here. |
| Approval gate/history | Mock approval state and version history. | Marker changes should reset/review approval later when applicable. |

## Planner Priority Order

1. Safety / do-not-copy / policy
2. Confirmed Edit Brief markers
3. Main Edit Chat instructions
4. Edit Preference / Preference DNA
5. Auto Professional suggestions
6. Default style

## Bridge Needed Later

- Marker-to-resolver signal mapping.
- Marker-to-edit-plan instruction mapping.
- Marker conflicts with source order, captions, audio, and Preference DNA.
- Marker confirmation state before planner consumption.
- Application logs showing how markers affected planning.

## Audit Result

Confirmed markers should become an explicit, safe, high-priority planning input only after owner-approved Brief architecture. RP-EDITBRIEF-00 does not wire planners, workers, providers, render, or credits.
