# Graphic Design Planning Contract Checklist

Use this checklist for future Graphic Design / VisualExplain Creative Skill prompts.

This checklist is documentation only. It does not create schema, TypeScript, SQL, migrations, prompts, runtime code, workers, UI, provider calls, render/export behavior, Supabase execution, browser/WebGL/canvas runtime, Playwright execution, package changes, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Universal planning contract inherited | The prompt inherits `skill-planning-contracts.md` and does not redefine the universal plan. |
| Overlay/compositing contract inherited where visual layer applies | The prompt references `overlay-compositing-planning-contract.md` for screen zone, safe area, collision, layer, edge, aspect ratio, and source/redaction planning. |
| Graphic purpose present | The graphic improves viewer understanding, clarity, proof, hierarchy, product explanation, story meaning, or premium emphasis. |
| Graphic role present | The plan names a role such as `lower_third_identity`, `feature_callout`, `framework_diagram`, `proof_card`, `browser_app_annotation`, or `no_graphic_design`. |
| Viewer understanding gain present | The plan explains what the viewer understands better because the graphic exists. |
| Information hierarchy present | Primary, secondary, tertiary/context/disclaimer/CTA priorities are declared where relevant. |
| Layout family present | The plan names a layout family such as `side_card_layout`, `comparison_columns`, `flow_diagram_layout`, or `minimal_label_only`. |
| Typography intent present | The plan describes readability priority, size/weight intent, contrast, line breaks, emphasis, and platform readability. |
| Readability strategy present | Read time, duration, density, and platform constraints are considered. |
| Screen zone/safe area present | Graphic placement respects face, object, caption, product/action, platform UI, and aspect ratio safety. |
| Caption relationship present | Graphic text and captions do not compete or duplicate each other without purpose. |
| Source/proof safety present where relevant | Metrics, claims, browser/app visuals, testimonials, proof, and sensitive data have source status and redaction/safe wording plans. |
| Visual density present | Density is declared as `none`, `minimal`, `restrained`, `balanced`, `rich`, or `hero`. |
| Credit/approval behavior present | Premium or generated graphics include estimate and approval behavior. |
| QA checks present | Graphic QA includes hierarchy, readability, caption safety, source/proof safety, user preference, and credit/approval compliance. |
| Revision options present | Safe changes such as remove, simplify, reduce text, change layout, move, increase readability, or lower cost are documented. |
| StoryTiming handoff present | Timing/readability/caption/overlay conflicts are handed to future StoryTiming. |
| Runtime actions avoided | The prompt remains docs-only unless a later milestone explicitly authorizes implementation. |

## Fail The Prompt If

Fail the prompt if:

- A graphic can execute from only a graphic name.
- The graphic has no story/meaning/clarity reason.
- The graphic is applied everywhere by default.
- The graphic lacks information hierarchy.
- The graphic lacks layout family.
- The graphic lacks typography/readability intent.
- The graphic ignores caption/face/object safety.
- The graphic uses unverified metrics or claims.
- A browser/app graphic invents exact source details.
- A premium/generated graphic lacks a credit estimate.
- A premium/generated graphic lacks approval behavior.
- The prompt adds runtime code.
- The prompt adds TypeScript before the type-contract milestone.
- The prompt adds a migration before the schema milestone.
- The prompt installs dependencies.
- The prompt mutates package files.

## Source-Truth Reminders

- Universal contract: `docs/creative-skills/skill-planning-contracts.md`.
- Overlay/compositing contract: `docs/creative-skills/overlay-compositing-planning-contract.md`.
- Graphic design contract: `docs/creative-skills/graphic-design-planning-contract.md`.
- Existing overlap includes `design.md`, signature systems, VisualExplain docs, provider prompts, tool registry/data-viz planning, StoryTiming, SFX timing, planner validation, mock planner, prompt builders, and provider routing.
- Full motion design belongs to `RP-SKILLS-06`.
- Full 3D visual planning belongs to `RP-SKILLS-07`.
- Full B-roll planning belongs to `RP-SKILLS-08`.
- Full caption planning belongs to `RP-SKILLS-09`.
- Full sound/music planning belongs to `RP-SKILLS-10`.
- Full StoryTiming coordination belongs to `RP-SKILLS-11`.
