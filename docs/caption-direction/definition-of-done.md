# Definition of Done

CAP-00 is an architecture checkpoint. The larger Caption Direction goal is not complete.

## Status summary

| Area | CAP-00 status | Completion requirement |
| --- | --- | --- |
| Composite creative skill | designed | `caption_design` parent/component assembly, validation, and `no_captions` implemented |
| Canonical transcript | reconciled in architecture | immutable source, projections, lineage, sensitive review, timing provenance implemented |
| Late-bound workflow | designed | strategy/reservation, real picture lock, finish gate, staleness, motion/sound/render ordering operational |
| Semantic design | designed | language-aware semantic phrases and measured typography operational |
| Multi-track/depth | designed | simultaneous tracks, lists, hero, anchors, behind/in-front/occlusion and accessible projection operational |
| Cross-system coordination | designed | B-roll, Caption-to-Visual, Living Frame, camera, StoryTiming handoffs operational without duplicate owners |
| Timing/sound | designed | StoryTiming-only final frames, stable-read validation, motion lock, restrained SoundSync handoff operational |
| Rendering/export | designed | pinned deterministic Remotion, canvas-aware libass, FFmpeg package, color and export QA operational |
| Accessibility/localization | designed | creative/stable/SRT/WebVTT/ASS, translated and reduced-motion projections operational |
| Tools/fonts/security | qualification plan only | pinned approved tools/models/fonts, private runtime, live security and license evidence |
| QA/repair/revision | designed | independent rendered-output QA, local repair, fallback and dependency invalidation operational |
| Persistence/UI/credits | contract plan only | canonical secure persistence, chat-native review, approval/estimate lineage, observability operational |
| End-to-end readiness | not started | CAP-17 fixtures, regressions, performance, security/license, compatibility, production report pass |

## Non-negotiable acceptance

The goal may be marked complete only when:

- `caption_design` is the functioning composite skill and `no_captions` is a functioning restraint;
- one canonical transcript drives every projection with word and transformation lineage;
- low-confidence/claim-sensitive review and timestamp provenance are enforced;
- synthetic timing cannot drive final word motion;
- qualified alignment and, where needed, diarization exist;
- caption strategy/reservation occur early and exact choreography occurs after real picture lock;
- changes to timeline/frame/visual/mask/font/timing dependencies stale affected captions;
- multi-mode, multi-track, semantic, language-aware, multi-font typography works;
- optical size, semantic scale/color, and executable legibility values render correctly;
- captions work beside/behind/in front of subjects with intentional rendered-frame occlusion QA;
- anchors, lists, heroes, B-roll co-composition, visual/Living Frame handoffs, and camera coordination work;
- StoryTiming owns every final frame and effective stable reading duration passes;
- caption sound follows motion lock and final mix protects dialogue;
- pinned Remotion renders creative captions; canvas-aware libass renders stable captions; FFmpeg packages outputs;
- approved colors and deterministic specs survive final render;
- creative, accessible, localized, and reduced-motion outputs pass delivery QA;
- models never produce executable render code;
- approved snapshots, work graph, asset manifests, idempotency, tenancy, private storage, credits, and audit lineage are enforced;
- required fixtures, regressions, golden frames, performance, security, license, and legacy compatibility tests pass;
- production readiness is demonstrated with deployed evidence, not inferred from source.

## CAP-00 acceptance

CAP-00 passes self-review when:

- all files listed in the canonical goal exist;
- current-versus-target gaps, owner map, migration compatibility, dependency graph, risk register, blockers, unresolved decisions, tests, benchmarks, fixtures, and CAP-01–17 are documented;
- links and file inventory validate;
- only `docs/caption-direction/` changed for this checkpoint;
- no runtime, package, media, provider, migration, billing, secret, or deployment action occurred.

Passing CAP-00 self-review authorizes CAP-01 implementation and automatic
progression through later reviewable CAP milestones when their own evidence
passes. It does not authorize production, user edit execution, credit spend,
provider spend, secrets, deployments, migrations, or unreviewed dependencies.
