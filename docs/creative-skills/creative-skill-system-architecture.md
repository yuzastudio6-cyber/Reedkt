# Creative Skill System Architecture Doctrine

## Purpose

This document defines the doctrine for ReeditPro Creative Skills before implementation. It guides future `RP-SKILLS` prompts and explains how skills should preserve professional editing taste while enabling more ambitious, surprising, high-end edits.

This is documentation only. It does not create schema, TypeScript contracts, runtime code, workers, UI cards, prompts, migrations, provider integrations, generation logic, render/export logic, package changes, Supabase connections, SQL, credentials, or runtime execution.

Future prompts should use this doctrine before creating skill planning contracts, skill taxonomy, skill catalog data models, edit preference models, visual opportunity engines, creative concept engines, skill resolvers, skill-aware credit estimation, skill QA, Supabase migrations, or worker/job integrations.

## Core Definition

A ReeditPro skill is a creative editing capability that can be reasoned about, planned, routed, costed, approved, executed by future tools/workers, QA'd, and revised.

A skill is not:

- An effect.
- A preset.
- A template.
- A tool.
- A worker.
- A provider.
- A prompt.
- An automatic rule.
- A guarantee that something appears in every edit.

Skills describe creative capability. They do not execute themselves. A skill can influence a plan only when it is justified by user intent, source media, transcript, story structure, platform, workflow context, edit preference, edit level, credit budget, timing, layout, and QA.

## Creative Standard

Professional editing does not mean using less everywhere. It means using the strongest idea where it belongs.

ReeditPro should be capable of visually impressive, surprising, out-of-this-world edits. The system should not collapse into normal, generic polish. It should encourage creative leaps, premium visual moments, 3D, motion design, SoundSync, graphic design, overlays, and cinematic composition when those choices make the video better.

At the same time, the AI should not decorate every second. Visual density must be intentional. Restraint is part of taste. A serious emotional pause may need no transition. A simple proof statement may need a clean caption and cut instead of a giant reveal. A premium product or property moment may deserve rich 3D, Graphic Design, or Real Motion support.

Using less is not the goal. Using better is the goal.

## Hard Rules, Soft Guidance, And Creative Freedom

Creative Skill planning has three layers.

### Hard Rules

Hard rules cannot be overridden by skill defaults:

- No expensive generation, rendering, provider calls, or tool execution before plan and credit approval.
- No credit reservation, spend, or deduction before approval according to credit ledger rules.
- No shot-for-shot reference copying, exact title sequence copying, lyric copying, or exact timing copying from Reference DNA.
- No heavy 3D, Real Motion, premium generation, or credit-heavy SoundSync/SFX without credit estimate and approval.
- Do not cover faces, captions, important objects, product details, UI, text, or proof visuals unless intentionally planned.
- Direct user "no" instructions override skill defaults.
- Basic edits must still be professional.
- Provider and tool execution must stay behind approval, backend, future worker, and runtime-readiness boundaries.
- Skills must not create parallel source sequence, StoryTiming, tool registry, provider prompt, worker, credit, approval, or Supabase lanes.

### Soft Guidance

Soft guidance informs planning without forcing outcomes:

- Real estate often needs spatial coherence, premium calm, accurate property context, and face-safe placement.
- Education often needs clarity, hierarchy, readable captions, diagrams, examples, and pacing that supports comprehension.
- Marketing often needs proof, benefit emphasis, CTA clarity, brand consistency, and controlled visual energy.
- Social shorts often need early payoff, readable captions, pace, and quick comprehension.
- Luxury often needs controlled motion, material quality, restraint, quiet confidence, and fewer but stronger visual moves.
- Workflow context should guide the plan, not force a skill, signature system, provider, or tool.

### Creative Freedom

Creative freedom is where ReeditPro earns its taste:

- The AI can choose the actual creative idea.
- The AI can invent visual metaphors when they support the story.
- The AI can decide whether 3D appears as B-roll, overlay integration, hero reveal, explainer, screen interaction, symbolic metaphor, or environment extension.
- The AI can choose not to use a skill.
- The AI can vary style, motion, timing, edge treatment, sound, color, pacing, and composition per video.
- The AI can reject a bigger idea when a simpler idea is stronger.

## Skill Lifecycle

A future skill should move through this lifecycle:

1. User intent and edit preference.
2. Source sequence and media analysis.
3. Visual, audio, and story opportunity detection.
4. Creative concept ideation.
5. Skill candidate scoring.
6. Skill planning contract creation.
7. StoryTiming and composition coordination.
8. Tool candidate selection.
9. Credit estimate.
10. User approval.
11. Job and worker execution later.
12. QA.
13. Preview.
14. Revision.
15. Export.

Execution is future work. No skill should jump from a name to execution, provider calls, rendering, worker dispatch, or credit spend.

## Skill Versus Tool

A skill is the creative capability. A tool is an execution option. A worker is the controlled executor. A provider is an external or internal generation, rendering, or processing system.

A skill can have many tool candidates. A tool can support many skills. Tool candidates are ranked guidance, not hard locks.

Examples:

- Stroke Motion may prefer SVG, Lottie, Remotion-style deterministic renderers, or other controlled renderers when timing, transparent overlays, exact text, or inspectable motion matter.
- 3D overlay integration may use future Three.js, Babylon, Remotion, compositing, mask, tracking, or render-worker flows depending on approval and runtime readiness.
- Browser/app visuals may use authorized capture and planning flows. ReeditPro should not invent exact private screens with AI when source truth, capture permission, or redaction status is required.

The source truths for tools remain `open-source-tool-registry.md`, `docs/tool-calling/*`, `src/lib/tool-registry.ts`, and `server/tool-registry/*`. Creative Skills should reference those owners instead of creating a second tool registry.

## Skill Versus Signature System

The existing signature systems remain important:

- Stroke Motion.
- Graphic Design / VisualExplain.
- Real Motion.
- SoundSync as an audio and timing support engine, not a visual signature system.

The Creative Skill System is broader than signature systems. It also includes clean cuts, pacing cleanup, captions, caption animation, transitions, overlays, B-roll, browser/app visuals, 3D visuals, audio cleanup, music/SFX planning, color, QA, and other professional editing capabilities.

A signature system can use multiple skills. A skill can support a signature system without being one. For example, caption animation can support Graphic Design, Stroke Motion, Real Motion, or a simple clean edit. SoundSync can support any visual direction but should not be treated as a visual signature by itself.

## Skill Planning Requirement

No skill should execute from only a skill name.

Every selected skill must eventually produce a planning contract before execution. `RP-SKILLS-01` does not create that contract; it defines the doctrine that `RP-SKILLS-02` should use.

A future skill plan should answer:

- Why this skill?
- Why here?
- Why now?
- Why this intensity?
- Why this visual treatment?
- Why not something simpler?
- Why not something bigger?
- How does it fit user preference?
- How does it fit the screen?
- How does it affect captions?
- How does it affect audio/music?
- What tool family could execute it?
- What does it cost?
- Does it require approval?
- What QA checks must pass?

The plan must be specific enough for future tools and workers to execute without improvising creative intent, while still keeping execution behind approval and runtime boundaries.

## Professional Restraint Model

Future skill planning should support these restraint decisions:

| Decision | Meaning |
| --- | --- |
| `use_full` | The skill is strongly justified and should be planned as a primary creative move. |
| `use_subtle` | The skill is useful but should stay quiet, secondary, or lightly applied. |
| `use_optional` | The skill is a good candidate but should be presented as optional, especially if it has credit impact. |
| `delay` | The skill might work later, but the current beat needs setup, clarity, or a quieter moment first. |
| `replace_with_simpler_skill` | A lighter skill solves the edit need better than the original candidate. |
| `do_not_use` | The skill is not justified for the beat, user preference, credit budget, layout, source truth, or story. |

Examples:

- A minor sentence should not get a 3D hero reveal.
- A premium product moment might deserve 3D.
- A serious emotional pause may need no transition.
- A social proof moment may deserve Graphic Design, B-roll, or a clean data card.
- Captions may be reduced during a visual hero moment so the viewer can read the image.

## Creative Idea Model

ReeditPro should not jump directly from transcript to skill or tool. Future planning should include:

1. Visual opportunity.
2. Creative concept candidates.
3. Selected creative concept.
4. Rejected concepts.
5. Skill mapping.
6. Planning contract.

Example:

Opportunity:

The speaker says, "this is a major investment."

Concept candidates:

1. 3D glass house blueprint builds beside footage.
2. Premium ROI graphic card.
3. Clean caption emphasis only.

Selected:

3D glass house blueprint.

Reason:

It supports the spoken meaning, fits real estate, creates a premium wow moment, and avoids a loud viral feel.

Rejected:

Loud chart explosion, because it conflicts with the premium/natural preference.

This model keeps creative invention alive while forcing every idea to explain why it belongs.

## 3D Doctrine

3D is not one skill. It is a family of roles. Future 3D planning should choose the role before choosing a tool or provider.

| 3D role | Definition |
| --- | --- |
| 3D object B-roll | A generated or rendered object used as a cutaway or supporting visual. |
| 3D overlay integration | A 3D element composited into source footage with placement, scale, depth, light, and occlusion planning. |
| 3D screen interaction | A 3D element that interacts with a screen, app, website, dashboard, phone, or interface surface. |
| 3D explainer visual | A 3D model, diagram, process, or spatial view that clarifies a concept. |
| 3D symbolic metaphor | A 3D visual that expresses meaning rather than literal source content. |
| 3D hero reveal | A premium visual moment where 3D is the main spectacle. |
| 3D environment extension | A scene extension, set extension, room extension, property extension, or atmospheric spatial expansion. |
| 3D transition object | A 3D object or movement used as a transition between moments. |
| 3D data visualization | A spatial chart, map, graph, model, or data object used when 3D improves comprehension. |
| 3D product feature breakout | A product, part, feature, layer, or mechanism separated or highlighted in 3D. |

Required 3D planning concerns:

- Role.
- Object type.
- Screen placement.
- Scale.
- Depth.
- Camera angle.
- Lighting.
- Material.
- Shadow/contact.
- Edge treatment.
- Occlusion/masking.
- Tracking.
- Entry/exit motion.
- Composite strategy.
- Audio relationship.
- Credit/approval behavior.
- QA.

3D should be used for exceptional, meaningful visual moments, not random decoration.

## Edge And Compositing Doctrine

Hard edge and soft edge planning matters because it tells future workers and renderers how an element belongs in the frame.

Hard edge can fit:

- UI cards.
- Browser frames.
- Graphic panels.
- Data cards.
- Comparison layouts.
- Intentional split screens.

Soft edge can fit:

- Cinematic overlays.
- 3D or Real Motion integration.
- Atmospheric graphics.
- Premium property visuals.
- Light or glow elements.
- Subtle product emphasis.

Future skill planning contracts must capture edge treatment. A hard-edged browser card and a soft-lit 3D object need different layout, depth, masking, shadow, and QA decisions.

## Sound And Music Doctrine

SoundSync and music must be planned, not randomly added.

Future sound/music skill planning should capture:

- Music role.
- Mood.
- Energy curve.
- Cue points.
- Beat map.
- Ducking.
- Speech safety.
- Lyrics policy.
- SFX restraint.
- Ambience preservation.
- Room tone.
- Transition sound.
- Signature skill sound support.

Sometimes the professional decision is no music, ambience only, repaired room tone, or a very quiet bed under speech. SFX should support edit layers such as transitions, title cards, Graphic Design reveals, Stroke Motion completions, Real Motion movement, premium product moments, or montage hits. It should not become random source-footage noise.

The source truths for SoundSync, music, and SFX remain `soundsync-audio-pipeline-planning.md`, `soundsync-sfx-director.md`, `docs/chat-native-music-ui.md`, `docs/chat-native-sfx-ui.md`, `docs/production-soundsync-*`, `src/types/audio-music.ts`, and `src/types/sfx-director.ts`.

## StoryTiming Coordination Doctrine

Skills cannot plan in isolation.

Examples:

- 3D affects caption placement.
- Captions affect Graphic Design.
- Transitions affect SoundSync.
- B-roll affects pacing.
- SFX affects speech clarity.
- Browser visuals affect redaction and source status.
- Real Motion and 3D affect face-safe placement.

StoryTiming / Composition Coordination is the future layer that should coordinate:

- Primary visual focus.
- Secondary visual support.
- Caption zone.
- Overlay zone.
- Speaker safe zone.
- Music ducking state.
- SFX permission.
- Transition permission.
- Visual density state.
- Conflict resolution.

Skills should hand coordination needs into StoryTiming and composition planning. They must not create a competing master timing map or timing authority.

## Edit Preference Doctrine

Edit preference is creative direction. It should guide:

- Visual density.
- Motion intensity.
- Caption style.
- Transition energy.
- B-roll style.
- 3D preference.
- Graphic design style.
- Sound style.
- Pacing style.
- Color mood.
- Wow factor target.
- Restraint level.
- Avoid rules.
- Preferred/blocked skills.

Priority order:

1. Direct project instruction.
2. Project edit preference.
3. Workspace/user default preference.
4. Reference DNA.
5. Workflow context.
6. Skill defaults.
7. AI creative judgment.

Direct instructions win. If the user says "no overlays," a skill default cannot force overlays. If the user asks for a premium wow moment, the system can propose richer ideas, but must still show cost, risk, approval needs, and simpler alternatives where appropriate.

## Approval And Credit Doctrine

Skills can be low, medium, high, or premium credit impact. Heavy visual skills should be optional where possible, and users should see what premium ideas cost before generation.

Credit doctrine:

- Credit estimates come before generation.
- Credits are reserved/spent only after approval according to future credit ledger rules.
- Heavy 3D, Real Motion, premium generation, provider video, advanced SFX, and final render work require clear credit impact.
- Users should be able to remove, downgrade, or simplify premium ideas.
- Lower-cost alternatives should preserve meaning and professional quality, not collapse into low-quality output.

Approval doctrine:

- A skill candidate is not approval.
- A selected creative concept is not approval.
- A planning contract is not approval.
- A credit estimate is not approval by itself.
- Execution begins only after the approved plan and approved credit estimate meet the existing approval gate.

## QA Doctrine

Future skill QA should check:

- Visual earned by story.
- Visual density balance.
- Skill repetition.
- Caption readability.
- Face-safe placement.
- Object-safe placement.
- Screen layout fit.
- Hard/soft edge correctness.
- No random effects.
- User preference compliance.
- Reference not copied.
- Credit compliance.
- Wow factor present where needed.
- Restraint used where needed.
- 3D role defined.
- 3D composite feasibility.
- Sound under speech safety.

QA should be able to reject both overuse and underuse. A bland edit can fail the wow factor target. A busy edit can fail restraint, readability, or story focus.

## Duplicate And Overlap Notes

Direct Creative Skill doctrine currently lives only in the `docs/creative-skills/` audit and architecture docs. Related concepts already exist elsewhere and must stay source truths:

- Adaptive strategy, generation restraint, visual density, caption simplification, and credit effects already exist in planning libraries and validation.
- StoryTiming has docs, types, mock backend services, API route definitions, and migrations. Skills must coordinate with it, not replace it.
- Tool registry and tool-calling docs already define tool candidates, capability cards, production profiles, and runtime policy.
- SoundSync, music, SFX, provider prompts, generation providers, worker runtime, approval gates, and credit ledger behavior all have existing owner docs and types.

Future prompts must reference these owners rather than creating parallel runtime, schema, prompt, tool, worker, or credit lanes.

## Future RP-SKILLS Sequence

Recommended next prompts:

- `RP-SKILLS-02`: Universal skill planning contracts.
- `RP-SKILLS-03`: Transition planning contract.
- `RP-SKILLS-04`: Overlay/compositing planning contract.
- `RP-SKILLS-05`: Graphic design planning contract.
- `RP-SKILLS-06`: Motion design planning contract.
- `RP-SKILLS-07`: 3D visual planning contract.
- `RP-SKILLS-08`: B-roll planning contract.
- `RP-SKILLS-09`: Caption planning contract.
- `RP-SKILLS-10`: Sound/music planning contract.
- `RP-SKILLS-11`: StoryTiming coordination contract.

`RP-SKILLS-02` should remain docs-only. It should define universal planning contract fields and acceptance criteria without adding TypeScript, migrations, runtime code, UI, providers, workers, package changes, or Supabase execution.
