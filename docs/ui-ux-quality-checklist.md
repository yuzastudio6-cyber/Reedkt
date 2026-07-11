# ReeditPro UI/UX Quality Checklist

## Product Flow

- Chat remains the editor.
- Upload, source order, goal, plan, credits, approval, progress, preview, revision, export order is preserved.
- No generation, rendering, provider execution, worker job, or credit deduction appears before approval.
- Timeline and advanced controls are secondary.

## Visual Hierarchy

- Deep-space background remains dominant.
- Cyan, blue, and violet are accents only.
- App headers are short.
- One primary action per page region.
- No overwhelming card walls.
- Technical details are hidden by default.
- One route H1; no near-equal duplicate hero immediately below it.
- Ordinary app content is bounded at wide desktop sizes.
- Surface width matches information content.

## Signed-In Home

- Returning users see Continue, Attention, and Recent Work—not onboarding.
- First-time users see one Create First Project action and a compact process explanation.
- Empty sections do not render.
- Every current stage has truthful tone and state-aware action.
- No fabricated thumbnail, plan-ready state, estimate, or progress percentage.
- Recovery failures never become false empty state.

## Spacing

- Tokenized spacing is used.
- Page groups have breathing room.
- Cards are not nested unless necessary.
- Responsive web prevents overflow without creating native mobile app flows.

## Copy

- No "placeholder" headings where user-facing copy can say mock, preview, or future integration.
- No unlimited AI editing claims.
- Software access and Reedit Credits are separated.
- Mock-only actions are named or disabled clearly.
- Visible product copy says `Edit Preferences`; `Preferences` remains technical shorthand only.
- Internal-testing and backend-readiness copy is absent from normal Home and Edit Preferences content.

## Chat Editor

- Required cards stay open while input is needed.
- Advanced/developer cards stay collapsed by default unless warning or blocking.
- Plan and credit cards are easy to find.
- Mock progress starts only after approval.

## Composer And Microphone

- Textarea has a label.
- Send is disabled when empty.
- Microphone is clearly disabled if voice is not connected.
- Attachment and reference controls have accessible names.

## Plan Approval

- Credit estimate appears before approval.
- Approval clearly approves both plan and credits.
- Lower-cost options do not start generation.
- Timing, frame, cleanup, and validation blockers prevent approval.

## Buttons, Inputs, Cards

- Buttons use shared variants and states.
- Inputs have labels and focus states.
- Icon-only buttons have accessible names.
- Badges do not replace controls.
- Status includes text, not color alone.
- Green is limited to completed/approved states; attention and revision states are not success.
- No more than one strong colored status normally competes inside a card or row.

## Motion

- Motion uses tokens.
- Nonessential animation respects `prefers-reduced-motion`.
- Loading and progress states are calm.

## Accessibility

- Landmarks and navigation are labeled.
- `aria-current`, `aria-pressed`, progressbar, disabled, and expanded states are used when relevant.
- Keyboard focus is visible.
- No obvious keyboard traps.
- Status and errors are not color-only.

## Performance

- Build output and chunk warnings are reported.
- Route-level lazy loading is preferred for first split.
- Editor advanced cards, detailed timeline, music, SFX, revisions, exports, and mock planning families are future lazy targets.
- No heavy animation, WebGL, rendering, or UI framework dependencies are added without approval.

## Build And Lint

- Run lint with arm64 Node on this machine.
- Run build with arm64 Node on this machine.
- Report any default Node `bad CPU type` issue as environment-specific.

## Final PR Summary Requirements

- Files created and updated.
- Route QA summary.
- Small fixes applied.
- Deferred issues and risk level.
- Accessibility notes.
- Performance and chunk warning status.
- Lint and build results.
