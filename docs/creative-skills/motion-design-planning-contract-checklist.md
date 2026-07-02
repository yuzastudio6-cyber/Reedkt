# Motion Design Planning Contract Checklist

This checklist is for future prompts that add, revise, or validate motion-design skill planning. It is documentation only. It does not authorize runtime code, animation code, TypeScript contracts, SQL, migrations, workers, providers, UI, browser/WebGL/canvas execution, package changes, or app behavior changes.

## Required Checks

| Check | Required result |
| --- | --- |
| Universal inheritance | The prompt references `skill-planning-contracts.md` and preserves planning reason, restraint, timing, composition, audio, tool, credit/approval, QA, and revision envelopes. |
| Transition inheritance | If motion crosses a cut or behaves like transition support, the prompt references `transition-planning-contract.md` for timing and edge behavior. |
| Overlay/compositing inheritance | If motion moves a visual layer, the prompt references `overlay-compositing-planning-contract.md` for zones, safe area, collisions, blend/opacity/contact, masking, tracking, occlusion, and layer order. |
| Graphic design inheritance | If motion reveals or animates graphics, the prompt references `graphic-design-planning-contract.md` for information hierarchy, layout, typography, readability, density, and source/proof safety. |
| Motion purpose | Every motion plan states what moves, why it moves, when it moves, how it moves, and when it stops. |
| Motion role | The plan selects a role such as `subtle_reveal`, `graphic_card_reveal`, `callout_motion`, `diagram_build`, `browser_app_focus_motion`, `transition_motion_support`, `Stroke_Motion_support`, `Real_Motion_support`, `three_d_entry_exit_support`, or `no_motion_design`. |
| Motion subject | The moving subject is named: caption word, graphic card, callout line, browser highlight, product overlay, 3D object, line path, chart value, or other concrete visual element. |
| Motion energy | The plan sets a motion energy level: `none`, `invisible`, `subtle`, `restrained`, `balanced`, `energetic`, or `hero`. |
| Motion language | The plan describes the motion language, such as fade, slide, mask reveal, draw-on, line trace, count-up, stagger, parallax, depth push, orbit, hold still, or settle. |
| Easing intent | The plan states easing/curve intent and why it fits the edit tone: linear, ease-in, ease-out, ease-in-out, soft settle, spring-like, snap-like, cinematic slow, beat-locked, or another documented intent. |
| Timing anchor | The plan anchors motion to transcript, StoryTiming beat, cut point, music beat, SFX, UI action, product action, proof reveal, or emotional pause. |
| Entry/hold/exit | The plan defines entry, hold, and exit behavior, including whether the motion should settle, remain still, loop, or disappear. |
| Readability safety | Captions, labels, cards, proof text, and UI labels remain readable for the required hold time and are not animated too aggressively. |
| Speech safety | Motion does not compete with dense speech, emotional pauses, speaker faces, or important verbal reveals. |
| Repetition control | The plan checks whether the same motion pattern is being repeated intentionally, repeated unintentionally, overused, or should be avoided next. |
| Safe-zone relationship | Motion respects safe areas, face/object/caption avoidance, aspect ratio behavior, and overlay/graphic layout constraints. |
| Credit and approval | Generated, premium, 3D, provider-backed, or unusually expensive motion concepts include credit estimate and approval requirements before execution. |
| QA | QA checks include timing, readability, collisions, distraction, motion comfort, render/export risk, StoryTiming conflicts, SoundSync conflicts, and unsupported runtime claims. |
| Revision | Revision options are available, such as reduce energy, lengthen hold, simplify easing, remove bounce, change zone, disable motion, or replace with `no_motion_design`. |
| StoryTiming handoff | Motion that affects beat timing, reveals, transitions, SFX, or captions records the relevant StoryTiming or timing conflict handoff. |
| Runtime boundary | The prompt remains docs-only unless a later authorized prompt explicitly opens runtime implementation. |

## Fail The Prompt If

- It allows execution from only a motion name.
- It describes motion as a random effect, generic polish, or automatic decoration.
- It adds motion everywhere by default.
- It lacks a story, meaning, hierarchy, rhythm, product-clarity, or comprehension reason.
- It omits a concrete motion subject.
- It omits motion role, energy, language, or easing intent.
- It omits a timing anchor.
- It omits entry, hold, or exit behavior.
- It ignores caption, label, card, proof, or UI-label readability.
- It ignores speech safety, emotional pauses, faces, product actions, or important source visuals.
- It ignores safe areas, screen zones, collisions, aspect ratios, or layer order when moving overlays or graphics.
- It repeats the same motion pattern mechanically across many beats.
- It treats bounce, shake, glitch, blur, orbit, parallax, or 3D entry as premium by default.
- It implies generated, premium, or 3D motion without credit estimate and approval behavior.
- It invents exact browser/app UI behavior, websites, dashboards, metrics, labels, or evidence pages.
- It duplicates transition, overlay/compositing, graphic design, StoryTiming, SoundSync, render strategy, provider prompt, worker, QA, credit, or Supabase ownership.
- It adds runtime code, animation code, Remotion/Lottie/SVG/Three/Babylon/canvas/WebGL/browser execution, TypeScript contracts, SQL, migrations, provider calls, workers, UI, package installs, package mutations, or dev server work.

## Source Truth Reminders

- Universal planning contract: `docs/creative-skills/skill-planning-contracts.md`
- Transition timing and edge behavior: `docs/creative-skills/transition-planning-contract.md`
- Overlay/compositing safety: `docs/creative-skills/overlay-compositing-planning-contract.md`
- Graphic hierarchy and structure: `docs/creative-skills/graphic-design-planning-contract.md`
- Motion design contract: `docs/creative-skills/motion-design-planning-contract.md`
- StoryTiming ownership remains in existing StoryTiming docs and types.
- SoundSync/music/SFX timing ownership remains in existing audio timing docs and services.
- Render/provider/worker/tool/runtime ownership remains in existing repo docs and code.

## Next Contract Check

The next recommended prompt is `RP-SKILLS-07 - 3D Visual Planning Contract`. It should stay docs-only and define 3D visual planning fields without creating 3D runtime, WebGL/canvas code, workers, providers, packages, UI, TypeScript contracts, SQL, or migrations.
