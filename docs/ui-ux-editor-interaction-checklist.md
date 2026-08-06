# Editor Interaction QA Checklist

Use this checklist for `/editor` interaction passes. The goal is to verify that the chat-first editing workflow remains calm, reachable, approval-safe, and free of clipped controls.

## Prompt 9 Baseline Steps

1. Open `/editor`.
2. Expand and collapse the utility panel.
3. Select a demo scenario.
4. Add a mock clip.
5. Reorder clips.
6. Remove a clip.
7. Edit a clip note.
8. Toggle important and optional flags.
9. Attach a mock reference.
10. Paste or edit the reference URL.
11. Skip the reference.
12. Toggle reference focus chips.
13. Send a revision message.
14. Use lower credit cost.
15. Remove Real Motion.
16. Approve the plan.
17. Verify approval checking is visible.
18. Verify progress starts only after approval gates pass.
19. Verify preview ready appears only after progress readiness.
20. Open and close the advanced timeline.
21. Open advanced details if available.
22. Check keyboard focus and visible focus rings.
23. Check for no horizontal overflow.
24. Check composer visibility at the bottom of the editor.
25. Check long text, URL, and filename wrapping.

## Expected Results

- Source clip changes reset approval, progress, preview, and approved snapshot state.
- Reference attach, URL edit, and skip reset approval-sensitive state.
- Normal chat messages never approve the plan or start generation.
- Plan approval happens only through `PlanReviewApprovalCard`.
- Approval failure is a compact `assistant_error` and does not imply credit use.
- Progress appears only after approval gates pass.
- Preview appears only after progress readiness.
- The composer remains visible and does not cover the last card.
- Expanded utility and advanced panels do not create horizontal overflow.
- Focus rings are visible for buttons, inputs, chips, toggles, composer, and drawer controls.

## Prompt 10 Expanded Flow Checks

1. Capture `/editor` at `1024`, `1280`, `1440`, `1728`, and `1920`.
2. Verify true `125%` zoom if tooling supports it; otherwise record the limitation and use a code-level zoom review plus `1024px` proxy.
3. Open the advanced timeline.
4. Confirm the advanced timeline close button is visible and labelled.
5. Confirm the timeline drawer remains bounded and scrolls internally.
6. Confirm timeline horizontal scrolling is contained inside the timeline wrapper.
7. Open SoundSync SFX from the plan review message.
8. Confirm SFX plan review and SFX credit approval remain visible.
9. Expand and collapse `SFX planning details`.
10. Confirm SFX provider route, prompt, timing, mix, QA, and library details wrap without horizontal overflow.
11. Confirm SFX copy remains mock-safe and does not imply provider execution.
12. Open Music/SoundSync from the plan review message.
13. Confirm music context, cue sheet approval, and credit approval remain visible.
14. Expand and collapse `Music cue details`.
15. Confirm music cue cards and Lyria prompt preview wrap without horizontal overflow.
16. Confirm music copy remains mock-safe and does not imply provider execution.
17. Confirm the floating composer stays visible with background around it.
18. Confirm the composer does not become a hard bottom footer row.
19. Confirm deep controls can scroll above the composer before focus/click.
20. Check non-editor routes at `1280px` for shared CSS regressions.

## Prompt 11 Descriptor And Viewport Checks

1. Open `/editor` and confirm the default chat still renders through the main structured message list.
2. Complete required setup gates until the plan review message exposes SoundSync actions.
3. Open `Plan SFX with SoundSync`.
4. Confirm SFX visible messages have understandable labels and no dense default card wall.
5. Confirm `SFX planning details` is collapsed by default and keyboard-expandable.
6. Approve SFX plan and SFX credits only through their visible cards; confirm mock progress starts only after both approvals.
7. Confirm SFX progress and revision options remain descriptor-backed and no provider execution is implied.
8. Open `Plan music with SoundSync`.
9. Confirm Music/SoundSync visible messages have understandable labels and no dense default card wall.
10. Confirm `Music cue details` is collapsed by default and keyboard-expandable.
11. Approve music plan and music credits only through their visible cards; confirm mock progress starts only after both approvals.
12. Confirm music QA, mix, and revision options remain descriptor-backed and mock-safe.
13. Open `Show detailed timeline only if I ask`.
14. Confirm the timeline appears inside the editor chat canvas, not below the editor route.
15. Confirm the timeline close button is labelled and reachable.
16. Confirm timeline body scrolling and horizontal timeline scrolling are internal to the drawer.
17. Check `/editor` at `1024`, `1280`, `1440`, `1728`, and `1920`.
18. Confirm no horizontal overflow, clipped focus rings, clipped cards, or clipped action rows.
19. Confirm floating composer remains visible and does not become a hard footer.
20. If true zoom/device-scale exists, repeat editor default, SFX, Music, and timeline states at `125%`; otherwise record the limitation and use code-level zoom review plus `1024px` proxy.

## Final Editor Polish Prompt 4 Checks

1. Confirm composer attach/reference/mic/send controls have clear labels, browser titles, and visible focus treatment.
2. Confirm `Shift+Enter` preserves textarea newline behavior and `Control+Enter` sends a revision without starting generation.
3. Confirm source role select, source note textarea, important/optional flags, reorder controls, remove controls, and add clip action are keyboard reachable.
4. Confirm reference URL, focus chips, skip, and attach actions are keyboard reachable.
5. Confirm plan review approve action is reachable above the composer before click.
6. Confirm approval success starts progress only after approval and preview appears only after mock progress readiness.
7. Confirm guarded approval failure still renders `assistant_error`, keeps approval false, and does not imply credit use.
8. Confirm timeline close controls expose labels/titles and close with keyboard activation.
9. Confirm SFX and Music details summaries toggle with keyboard activation and stay bounded.
10. Confirm final screenshots are saved under `docs/ui-ux-screenshots/prompt-19-final-editor-polish/`.
