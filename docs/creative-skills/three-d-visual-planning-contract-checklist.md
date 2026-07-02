# 3D Visual Planning Contract Checklist

This checklist is for future prompts that add, revise, or validate 3D visual skill planning. It is documentation only. It does not authorize runtime code, TypeScript contracts, SQL, migrations, workers, providers, UI, browser/WebGL/canvas/3D execution, model loading, animation code, package changes, or app behavior changes.

## Required Checks

| Check | Required result |
| --- | --- |
| Universal planning contract inherited | The prompt references `skill-planning-contracts.md` and preserves planning reason, restraint, timing, composition, audio, tool, credit/approval, QA, and revision envelopes. |
| Overlay/compositing contract referenced | 3D overlays reference `overlay-compositing-planning-contract.md` for screen zone, safe area, collisions, edge treatment, layer order, aspect ratio, tracking, masking, occlusion, and source/redaction safety. |
| Motion design contract referenced for entry/hold/exit | Moving 3D references `motion-design-planning-contract.md` for entry, hold, exit, energy, language, easing, repetition, and comfort. |
| Graphic design contract referenced for labels/callouts | Labels, cards, proof callouts, annotations, and hierarchy around 3D reference `graphic-design-planning-contract.md`. |
| Transition contract referenced when 3D crosses cuts | 3D transition objects reference `transition-planning-contract.md` for timing, edge behavior, SFX, and speech safety. |
| 3D purpose present | The plan states why 3D exists and what spoken/visual meaning it supports. |
| 3D role present | The plan chooses a role such as `no_3d`, `three_d_object_broll`, `three_d_overlay_integration`, `three_d_screen_interaction`, `three_d_explainer_visual`, `three_d_symbolic_metaphor`, `three_d_hero_reveal`, `three_d_transition_object`, or `three_d_product_feature_breakout`. |
| Object/concept type present | The object, product, model, screen element, data form, place, environment, or metaphor is named. |
| B-roll versus overlay decision present | The plan states whether 3D is B-roll, overlay, screen interaction, explainer, metaphor, hero, transition object, data visualization, or product breakout. |
| Screen interaction mode present when relevant | Screen/app/browser 3D includes source status and does not invent exact UI, metrics, dashboards, pricing, labels, or evidence pages. |
| Screen zone/safe area present | The plan defines screen zone, safe area, face/caption/object/product/action protection, and aspect-ratio behavior. |
| Scale/depth/camera intent present | The plan defines camera angle, scale strategy, depth position, perspective needs, and anchor/surface relationship. |
| Lighting/material/shadow/contact/reflection intent present | Integrated 3D defines material style, lighting direction, shadow/contact, reflection, color, blur, exposure, and edge/compositing intent where needed. |
| Tracking/masking/occlusion need declared | The plan explicitly says whether tracking, masking, and occlusion are required and includes fallback if unavailable. |
| Source/model/provenance status declared | The plan records whether source/model status is user-provided, generated future, stock future, procedural, mock-only, unknown, needs rights review, needs brand review, or needs user confirmation. |
| Caption/graphic/face/object safety present | Captions remain readable, graphic labels do not crowd the frame, and faces, expressions, hands, products, and important actions stay protected. |
| Motion behavior summary present | Entry, hold, exit, motion energy, easing, camera/object motion, SFX relationship, and repetition limit are summarized when 3D moves. |
| Credit/approval behavior present | Premium/generated/rendered/composited/tracked/masked/occlusion-heavy 3D includes credit estimate and approval behavior. |
| Lower-cost alternative present | Optional premium 3D includes a lower-cost alternative such as graphic design, B-roll, caption emphasis, Stroke Motion, or no extra visual. |
| QA checks present | QA includes meaning, role, placement, collisions, scale/depth, lighting/material, tracking/masking/occlusion, source/model status, user preference, repetition, audio/SFX, reference safety, credit, and approval. |
| Revision options present | Revisions can remove 3D, reduce complexity, change zone, convert overlay to B-roll, convert to graphic design, remove tracking/occlusion, slow motion, or lower cost. |
| StoryTiming handoff present | 3D reveals, transitions, SFX, captions, hero holds, and conflicts record the relevant StoryTiming or timing handoff. |
| Runtime actions avoided | The prompt remains docs-only unless a later authorized prompt explicitly opens implementation. |

## Fail The Prompt If

- 3D can execute from only a 3D name.
- 3D has no story/meaning/wow reason.
- 3D role is missing.
- 3D is applied everywhere by default.
- B-roll versus overlay is unclear.
- Screen placement is missing.
- Face/caption/object safety is ignored.
- Scale/depth/camera intent is missing.
- Lighting/material/shadow/contact intent is missing where integration is needed.
- Source/model/provenance is ignored.
- 3D screen interaction invents exact UI/source details.
- Tracking/masking/occlusion is assumed without readiness/approval.
- Premium/generated 3D lacks credit estimate.
- Premium/generated 3D lacks approval.
- Lower-cost alternative is missing for optional premium 3D.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks WebGL/canvas/browser/3D runtime.
- Prompt adds provider calls, workers, render/export code, model loading, animation code, Supabase execution, credentials, secrets, or app behavior.

## Source Truth Reminders

- Universal planning contract: `docs/creative-skills/skill-planning-contracts.md`
- Transition planning: `docs/creative-skills/transition-planning-contract.md`
- Overlay/compositing planning: `docs/creative-skills/overlay-compositing-planning-contract.md`
- Graphic design planning: `docs/creative-skills/graphic-design-planning-contract.md`
- Motion design planning: `docs/creative-skills/motion-design-planning-contract.md`
- 3D visual planning: `docs/creative-skills/three-d-visual-planning-contract.md`
- 3D/browser tool candidates remain represented in the existing tool registry and tool-calling study docs.
- Real Motion remains a premium, face-safe, approval-gated signature system.
- Depth-aware overlay, mask, tracking, render, StoryTiming, SoundSync/SFX, provider, worker, credit, and Supabase ownership remains with existing source truths.

## Next Contract Check

The next recommended prompt is `RP-SKILLS-08 - B-roll Planning Contract`. It should stay docs-only and define B-roll planning fields without creating runtime, TypeScript contracts, SQL, migrations, workers, providers, packages, UI, browser/WebGL/canvas/3D runtime, animation code, or app behavior.
