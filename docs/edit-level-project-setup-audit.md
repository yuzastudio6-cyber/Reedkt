# Edit Level Project Setup Audit

## Current UI

The current project/edit setup surface is chat-native. `src/components/editor/InlineEditLevelCard.tsx` asks "How deep should this edit be?" and shows Basic, Pro, and Premium cards. `src/components/editor/InlinePlanningContextCard.tsx` repeats the selected level and Veo policy.

`src/components/editor/ChatNativeEditor.tsx` stores `editLevel` and `editLevelConfirmed` in local state, resets approval/progress/preview state when level changes, and blocks plan approval until the level is confirmed. RP-EDITLEVEL-00 must not modify this behavior.

## Current Defaults

`src/components/editor/chatNativeData.ts` defaults the mock chat input to `editLevel: 'pro'`. Demo scenarios in `src/lib/demo-scenario-index.ts` and `src/lib/demo-scenarios.ts` cover `basic`, `pro`, and `premium`.

## Current Persistence

The current setup is local/mock and type-driven. The level flows through `PlannerInput`, `CompiledEditingIntent`, `EditPlan`, QA, routing, and credit estimate metadata. Durable database persistence is future work.

## Gaps

- Current labels are Basic/Pro/Premium, not Normal/Premium/Ultra Premium.
- There is no `EditLevelProfile` resolver.
- There is no product value for whether Basic remains an alias for Normal.
- There is no level-aware tool budget object.
- Requested legacy project setup docs under `docs/project-edit-session-*` are missing in this checkout.

## Recommendation

Reuse the existing chat card, planning context, local state, demo scenarios, and approval reset semantics. In a later milestone, add display profiles and resolver logic without directly renaming the current runtime union first.
