# Edit Brief Planner Integration Architecture

Status: architecture/docs only. This report defines future `ProjectEditSession` Brief planner integration and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Planner Package

The future planner package should include:

- Confirmed markers.
- `ready_for_plan` markers.
- Marker intents.
- Time ranges.
- Asset references.
- Export Settings.
- Conflict warnings.
- Priority rules.

## Planner Priority Order

1. Safety / do-not-copy / policy
2. Confirmed Edit Brief markers
3. Main Edit Chat instructions
4. Edit Preference / Preference DNA
5. Auto Professional suggestions
6. Default editing style

Time-specific Marker instructions should override general style preferences for their time range unless safety blocks them.

## Non-Goals

- No generation.
- No render.
- No worker.
- No progress start.
- No credit reservation/spend.
- No provider/model call.
## RP-EDITBRIEF-11 Mock Plan Bridge

The first planner bridge is mock/local only. Eligible Edit Brief markers become structured plan hints in a `ProjectEditBriefPlannerInputPackage`; skipped markers preserve QA/missing-asset/conflict/copy-risk reasons. The package follows the priority order: safety/do-not-copy, confirmed Brief markers, main Edit Chat, Edit Preference/DNA, Auto Professional, default style. It does not write to the Edit Plan repository or run planner execution.
