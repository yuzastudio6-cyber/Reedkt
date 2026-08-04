# End-to-End AI Editing Workflow

This document defines the production workflow for ReeditPro's AI-native editing experience. It preserves the existing product rule: ReeditPro plans first, estimates credits second, and begins expensive generation or rendering only after approval.

## Complete Workflow

1. User creates or opens project.
2. User uploads raw footage and optional assets.
3. System ingests media.
4. AI runs Footage Prep.
5. AI builds Source Understanding Map.
6. AI creates Cleanup Plan.
7. AI builds Clean Assembly.
8. User sees Prep Summary.
9. User can continue with AI plan, add Edit Brief, or add Edit Cues.
10. AI creates Edit Plan.
11. System creates credit estimate.
12. User approves credit-costing work.
13. AI runs Professional Integration Pipeline.
14. Render/generation jobs run.
15. QA checks run.
16. Preview becomes ready.
17. Edit Map is created.
18. User can make revisions through Edit Map.
19. User exports.

## Production Rules

- The user gives direction; the AI performs professional editing execution.
- No cue goes directly to render without Professional Integration.
- No expensive generation starts without approval.
- Raw footage is never destroyed.
- Clean Assembly is non-destructive.
- AI must explain what it is doing through progress/activity events.
- A project should never silently get stuck.
- Every failed state needs retry/recovery behavior.
- Preview must pass QA before becoming ready.
- Post-preview edits must become structured Edit Operations.

## Main User Paths

### Path 1: Simple AI Edit

```text
Upload -> Footage Prep -> Clean Assembly -> AI creates plan -> User approves -> Preview
```

This path is for users who want ReeditPro to act like a professional editor with minimal extra direction. The user can continue directly from the Prep Summary into an AI-generated plan.

### Path 2: Directed AI Edit

```text
Upload -> Footage Prep -> Clean Assembly -> User adds Edit Brief/Edit Cues -> AI creates plan -> User approves -> Preview
```

This path is for users who want to guide style, story, asset usage, timing, or avoid rules before the AI creates the plan.

Users can give high-level instructions before Footage Prep finishes. Detailed timestamp or cue work should be anchored to the Clean Assembly when possible, because cleanup may change timing. If a user creates a cue against raw footage before cleanup, the system should keep it pending until it can be remapped safely.
