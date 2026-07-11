# Editor Copy Density Audit

Prompt 21 reviews `/editor` copy after the visual signoff passed with notes. The goal is shorter, calmer user-facing language without changing layout, product behavior, approval gates, or mock-safe boundaries.

## A. Main Chat Messages

- Greeting: shorten. Replace setup explanation with one clear planning promise.
- Source confirmation: shorten. Keep source-context meaning without over-explaining final edit order.
- Frame, cleanup, edit level, and visual preference questions: keep, with shorter prompts where possible.
- Reference prompt: shorten. Make reference optional and style-focused.
- Video understanding, adaptive strategy, timing, compiled intent: replace technical planner language with user-facing intent.
- Approval success/progress: shorten. Use "Plan approved. I'm preparing the preview."
- Preview ready: keep clear next actions; remove repeated mock/backend paragraphs from chat-level copy.
- Approval failure: replace technical wording with calm blocker copy and one credit-safety sentence.

## B. Composer

- Placeholder: keep `Message ReeditPro...`; it is compact and clear.
- Visible helper: keep visually hidden.
- Attach/reference labels: shorten clip action to "Add clip" / "Attach sample clips" while preserving icon control accessibility.
- Mic label: keep explicit mock-disabled copy because no voice recording exists.

## C. Source Sequence

- Heading: keep.
- Helper: shorten to one sentence: source order is context, not final edit order.
- Clip labels: keep role, notes, important, optional, and move/remove accessible labels.
- Note placeholder: replace long instruction with "Note for edit."
- Add action: visible "Add clip"; tests accept old/new wording.
- Mode/details copy: shorten source-mode helpers and warnings.

## D. Reference

- Heading: keep "Style studied, not copied."
- Helper: shorten to pacing/captions/style guidance.
- URL placeholder: keep.
- Actions: visible "Skip"; accessible name remains "Skip reference."
- DNA details: collapse remains; summary becomes "Style cues I'll study."
- Safety: keep style-not-copying meaning, but avoid long legal/technical prose.

## E. Plan Review

- Heading: shorten to "Approve the plan."
- Summary labels: use "What I'll make," "Style," and "Credit estimate."
- Credit note: reduce to "Credits are only used after you approve."
- Primary action: "Approve plan."
- Secondary actions: "Lower cost," "Remove Real Motion," and "Ask a question."
- Approval behavior: unchanged.

## F. Utility, Demo, And Planning

- Demo selector: replace "Mock prototype" with "Demo."
- Demo helper: clarify no providers are called without making mock language dominant.
- Planning progress: rename visible heading to "Planning details."
- Advanced/developer mode: keep available but not default-expanded.

## G. Timeline

- Heading and close copy: keep.
- Helper: defer. Timeline is secondary and already bounded; no product bug was found in Prompt 20.

## H. SFX And Music

- Visible SFX/Music entry cards: shorten to timing, mix, credits, and voice-safe planning.
- SFX detail cards: reduce "mock" emphasis while preserving "no provider called" truth.
- Music detail cards: reduce "mock" emphasis while preserving no Lyria/render/credit deduction truth.
- Provider/prompt/library details: remain collapsed or inside explicit details.

## Decisions

- Keep: approval/credit trust language, provider-not-called truth, accessible labels, and data-testid hooks.
- Shorten: main assistant turns, source/reference helpers, Plan Review, progress, preview, demo, SFX, and Music visible copy.
- Move to details: provider route, prompt, library, and technical QA wording.
- Hide visually but keep accessible: composer label/helper behavior.
- Replace terms: "mock prototype" -> "Demo"; "mock progress" -> "Demo progress" or "Progress"; "frontend demo" -> "demo."
- Defer: advanced/developer planning card copy that only appears when explicitly expanded.
