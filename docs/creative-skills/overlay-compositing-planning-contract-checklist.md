# Overlay and Compositing Planning Contract Checklist

Use this checklist for future overlay/compositing Creative Skill prompts.

This checklist is documentation only. It does not create schema, TypeScript, SQL, migrations, prompts, runtime code, workers, UI, provider calls, render/export behavior, Supabase execution, browser/WebGL/canvas runtime, Playwright execution, package changes, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Universal planning contract inherited | The prompt inherits `skill-planning-contracts.md` and does not redefine the universal plan. |
| Overlay purpose present | The overlay has a story, meaning, proof, comprehension, emotion, spatial, product, or justified wow reason. |
| Overlay role present | The plan names a role such as `caption_overlay`, `lower_third`, `graphic_design_card`, `browser_app_frame`, `three_d_object_overlay`, or `no_overlay`. |
| Screen zone present | The plan names a planned zone, not vague placement. |
| Safe area strategy present | The plan explains how it respects aspect ratio, platform UI, and frame safety. |
| Face/object/caption collision planning present | Faces, expressions, mouth/eyes, gestures, products, action, captions, and important source content are protected. |
| Edge treatment present | Visual overlays name persistent edge behavior such as `hard_edge`, `soft_edge`, `feathered_edge`, `browser_frame_edge`, or `no_visible_edge`. |
| Blend/opacity/shadow/contact strategy present where relevant | Composite intent is described without forcing unsupported renderer behavior. |
| Tracking/masking/occlusion need declared | The plan states whether tracking, masking, depth, occlusion, or manual review is required. |
| Layer order present | Captions, graphics, 3D, Real Motion, Stroke Motion, B-roll, transition layers, and base video are ordered or declared irrelevant. |
| Aspect ratio behavior present | The plan explains how placement adapts across target ratios. |
| Source status/redaction present where relevant | Browser/app/evidence overlays include source status, redaction, sensitive-data, and safe-wording plans. |
| Credit/approval behavior present | Premium or generated overlays include estimate and approval behavior. |
| QA checks present | Overlay QA includes story reason, no random decoration, safe area, caption readability, source status, and credit/approval compliance. |
| Revision options present | Safe changes such as remove, move, soften, reduce opacity, replace with simpler skill, or lower cost are documented. |
| StoryTiming handoff present | The plan declares timing/composition conflict risks and hands coordination to future StoryTiming. |
| Runtime actions avoided | The prompt remains docs-only unless a later milestone explicitly authorizes implementation. |

## Fail The Prompt If

Fail the prompt if:

- An overlay can execute from only an overlay name.
- The overlay has no story/meaning reason.
- The overlay is applied everywhere by default.
- The overlay lacks a screen zone.
- A visual overlay lacks edge treatment.
- The overlay ignores face/object/caption safety.
- A browser/app overlay invents exact source details.
- Sensitive data risk lacks a redaction/source plan.
- A premium/generated overlay lacks a credit estimate.
- A premium/generated overlay lacks approval behavior.
- Tracking/masking/occlusion is assumed without readiness/approval.
- The prompt adds runtime code.
- The prompt adds TypeScript before the type-contract milestone.
- The prompt adds a migration before the schema milestone.
- The prompt installs dependencies.
- The prompt mutates package files.

## Source-Truth Reminders

- Universal contract: `docs/creative-skills/skill-planning-contracts.md`.
- Transition edge behavior: `docs/creative-skills/transition-planning-contract.md`.
- Overlay/compositing contract: `docs/creative-skills/overlay-compositing-planning-contract.md`.
- Existing overlap includes frame layout, speaker/visual layout, depth-aware overlay planning, Real Motion, tool registry/browser-capture candidates, provider boundaries, planner validation, and mask/depth worker lanes.
- Full graphic design belongs to `RP-SKILLS-05`.
- Full motion design belongs to `RP-SKILLS-06`.
- Full 3D visual planning belongs to `RP-SKILLS-07`.
- Full B-roll planning belongs to `RP-SKILLS-08`.
- Full caption planning belongs to `RP-SKILLS-09`.
- Full sound/music planning belongs to `RP-SKILLS-10`.
- Full StoryTiming coordination belongs to `RP-SKILLS-11`.
