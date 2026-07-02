# Edit Level Edit Session Integration Audit

## Current Edit Session Surface

The active edit session is the chat-native editor. It currently shows edit-level selection as a required setup card, displays the selected level in planning context, and feeds the level into the mock planner.

Relevant current surfaces:

- `src/components/editor/InlineEditLevelCard.tsx`
- `src/components/editor/InlinePlanningContextCard.tsx`
- `src/components/editor/chatNativeData.ts`
- `src/components/editor/ChatNativeEditor.tsx` (audit only; no runtime edits in RP-EDITLEVEL-00)
- `src/types/reeditpro.ts`
- `src/lib/mock-planner/guided.ts`
- `src/lib/mock-planner/full.ts`

## Fields And Metadata

The session-level value is currently `PlannerInput.editLevel`. It reaches:

- compiled intent resolved settings;
- professional editing directive;
- video understanding/adaptive strategy;
- visual asset/provider route selection;
- QA and validation checks;
- credit estimate;
- approved snapshot compatibility data.

## Future Integration

Future implementation should store both:

- stable runtime value used by workers and approved snapshots;
- user-facing display label from `EditLevelProfile`.

Changing the selected level should continue resetting approval, progress, preview readiness, and approved snapshot readiness.

## Gaps

- No durable edit session table is wired to this field in the frontend mock.
- No `EditLevelProfile` metadata is stored in approved snapshots yet.
- Requested `docs/project-edit-session-*` docs and `src/types/project-edit-session.ts` were missing.
