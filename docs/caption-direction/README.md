# Caption Direction — CAP-00 Architecture Checkpoint

Status: `owner_review_required`  
Checkpoint: `CAP-00`  
Runtime changes: none

Caption Direction is ReeditPro's proposed composite creative skill for speech-derived typography, motion, spatial composition, sound, accessibility, and delivery. Its stable target key is `caption_design`; the user-facing name is **Caption Direction**. `no_captions` remains the explicit restraint decision.

The governing workflow invariant is:

> Early-planned, mid-edit reserved, late-resolved, late-rendered.

This package reconciles that target with the current repository. It does not authorize provider calls, user-media processing, model downloads, package installation, migrations, billing, deployment, or runtime behavior changes.

## CAP-00 outcome

- The linked conversation was chronologically inspectable, but several long turns were truncated by the connected-task reader and the raw uploaded reference videos were unavailable.
- The complete pasted Caption Direction goal was available and is treated as the canonical specification for this checkpoint.
- The repository has useful caption, speech, StoryTiming, approval, worker, render, and QA foundations, but no composite `caption_design` owner or multi-track late-bound Caption Direction domain.
- Existing behavior must be adapted, not replaced in parallel. In particular, current flat `captions.*` professional skills, coarse caption plans, StoryTiming records, speech artifacts, caption workers, Remotion plans, and libass output remain compatibility inputs.
- A deliberate policy migration is required: current documents place captions above masks; the target allows approved creative typography behind, beside, and in front of subjects while keeping a complete accessible projection.
- Work stops at owner review before CAP-01.

## Document map

### Evidence and reconciliation

- [Context availability](context-availability-report.md)
- [Conversation decision ledger](conversation-decision-ledger.md)
- [Repository reconciliation](repository-reconciliation.md)
- [Current caption inventory](current-caption-inventory.md)
- [Source-of-truth map](source-of-truth-map.md)
- [Duplicate-owner risks](duplicate-owner-risk-report.md)

### Domain and creative architecture

- [Architecture](caption-direction-architecture.md)
- [Skill family](skill-family.md)
- [Lifecycle](caption-lifecycle.md)
- [Late binding and picture lock](late-binding-and-picture-lock.md)
- [Integration classes](caption-integration-classes.md)
- [Multi-track system](multi-track-caption-system.md)
- [Caption scene graph](caption-scene-graph.md)
- [Transcript and alignment](transcript-and-alignment.md)
- [Style profile](style-profile.md)
- [Semantic segmentation](semantic-segmentation.md)
- [Placement, depth, and occlusion](placement-depth-and-occlusion.md)
- [Motion grammar](motion-grammar.md)
- [Sound choreography](sound-choreography.md)
- [Living Frame coordination](living-frame-coordination.md)
- [B-roll and visual co-composition](broll-and-visual-co-composition.md)
- [Accessibility and localization](accessibility-and-localization.md)

### Runtime, safety, delivery, and rollout

- [Font runtime and security](font-runtime-and-security.md)
- [Backend and worker architecture](backend-worker-architecture.md)
- [Rendering, color, and export](rendering-color-and-export.md)
- [QA, repair, and fallbacks](qa-repair-and-fallbacks.md)
- [Tool qualification](tool-qualification.md)
- [Revision and invalidation](revision-and-invalidation.md)
- [Reference-video analysis](reference-video-analysis.md)
- [Implementation roadmap](implementation-roadmap.md)
- [Definition of done](definition-of-done.md)

## Approval requested

Before CAP-01, the owner should review the scoped decisions in the [decision ledger](conversation-decision-ledger.md), unresolved choices in the [roadmap](implementation-roadmap.md), and the explicit context limitations in the [availability report](context-availability-report.md). CAP-00 is not completion of the larger Caption Direction goal.

## Canonical specification coverage

This matrix identifies the CAP-00 evidence for every numbered section of the
canonical pasted goal. It is a documentation-coverage map, not a claim that the
post-CAP-00 runtime requirement is implemented.

| # | Canonical area | CAP-00 evidence |
| --- | --- | --- |
| 1 | Chat context assimilation | [Context availability](context-availability-report.md), [decision ledger](conversation-decision-ledger.md) |
| 2 | Repository audit | [Current inventory](current-caption-inventory.md), [reconciliation](repository-reconciliation.md) |
| 3 | Source priority | [Decision ledger](conversation-decision-ledger.md), [source-of-truth map](source-of-truth-map.md) |
| 4 | CAP-00 checkpoint | This README, [roadmap](implementation-roadmap.md), [definition of done](definition-of-done.md) |
| 5 | Core caption concept | [Architecture](caption-direction-architecture.md) |
| 6 | Parent and mini skills | [Skill family](skill-family.md) |
| 7 | Late binding | [Late binding and picture lock](late-binding-and-picture-lock.md) |
| 8 | Integration classes | [Integration classes](caption-integration-classes.md) |
| 9 | Planning levels | [Architecture](caption-direction-architecture.md) |
| 10 | Multi-track system | [Multi-track system](multi-track-caption-system.md) |
| 11 | Canonical transcript | [Transcript and alignment](transcript-and-alignment.md) |
| 12 | Two-pass planning | [Architecture](caption-direction-architecture.md) |
| 13 | Opportunities and reservation | [Architecture](caption-direction-architecture.md), [integration classes](caption-integration-classes.md) |
| 14 | Blocking preview | [Late binding and picture lock](late-binding-and-picture-lock.md) |
| 15 | PictureLockManifest | [Late binding and picture lock](late-binding-and-picture-lock.md) |
| 16 | Lifecycle | [Lifecycle](caption-lifecycle.md) |
| 17 | Approval envelope | [Late binding and picture lock](late-binding-and-picture-lock.md) |
| 18 | Semantic phrases | [Semantic segmentation](semantic-segmentation.md) |
| 19 | Language-aware lines | [Semantic segmentation](semantic-segmentation.md), [accessibility/localization](accessibility-and-localization.md) |
| 20 | Style profile | [Style profile](style-profile.md) |
| 21 | Visual occupancy | [Placement, depth, and occlusion](placement-depth-and-occlusion.md) |
| 22 | Spatial scene graph | [Caption scene graph](caption-scene-graph.md) |
| 23 | Occlusion typography | [Placement, depth, and occlusion](placement-depth-and-occlusion.md) |
| 24 | Anchored/environmental type | [Placement, depth, and occlusion](placement-depth-and-occlusion.md) |
| 25 | Hero type and lists | [Multi-track system](multi-track-caption-system.md) |
| 26 | Mode switching | [Multi-track system](multi-track-caption-system.md) |
| 27 | Caption-to-Visual | [Living Frame coordination](living-frame-coordination.md), [B-roll/visual co-composition](broll-and-visual-co-composition.md) |
| 28 | Living Frame/B-roll | [Living Frame coordination](living-frame-coordination.md), [B-roll/visual co-composition](broll-and-visual-co-composition.md) |
| 29 | Camera coordination | [Placement, depth, and occlusion](placement-depth-and-occlusion.md) |
| 30 | Sound choreography | [Sound choreography](sound-choreography.md) |
| 31 | StoryTiming | [Motion grammar](motion-grammar.md), [source-of-truth map](source-of-truth-map.md) |
| 32 | Timestamp provenance | [Transcript and alignment](transcript-and-alignment.md) |
| 33 | Tool qualification | [Tool qualification](tool-qualification.md) |
| 34 | Head Intelligence/Qwen | [Architecture](caption-direction-architecture.md), [tool qualification](tool-qualification.md) |
| 35 | Font/Unicode runtime | [Font runtime and security](font-runtime-and-security.md) |
| 36 | Color management | [Rendering, color, and export](rendering-color-and-export.md) |
| 37 | Calibration preview | [Rendering, color, and export](rendering-color-and-export.md) |
| 38 | Approved snapshot | [Backend and worker architecture](backend-worker-architecture.md) |
| 39 | Backend services | [Backend and worker architecture](backend-worker-architecture.md) |
| 40 | Worker graph | [Backend and worker architecture](backend-worker-architecture.md) |
| 41 | Rendering | [Rendering, color, and export](rendering-color-and-export.md) |
| 42 | Render order | [Rendering, color, and export](rendering-color-and-export.md) |
| 43 | Accessibility projections | [Accessibility and localization](accessibility-and-localization.md) |
| 44 | Localization | [Accessibility and localization](accessibility-and-localization.md) |
| 45 | Revision/invalidation | [Revision and invalidation](revision-and-invalidation.md) |
| 46 | QA gates | [QA, repair, and fallbacks](qa-repair-and-fallbacks.md) |
| 47 | QA repair/fallback | [QA, repair, and fallbacks](qa-repair-and-fallbacks.md) |
| 48 | Chat-native UX | [Architecture](caption-direction-architecture.md) |
| 49 | Credits/cost | [Architecture](caption-direction-architecture.md), [roadmap](implementation-roadmap.md) |
| 50 | Security/privacy/licensing | [Font security](font-runtime-and-security.md), [backend security](backend-worker-architecture.md) |
| 51 | Persistence/backward compatibility | [Backend architecture](backend-worker-architecture.md), [reconciliation](repository-reconciliation.md) |
| 52 | Observability/provenance | [Backend and worker architecture](backend-worker-architecture.md) |
| 53 | Reference videos | [Reference-video analysis](reference-video-analysis.md) |
| 54 | Milestones | [Implementation roadmap](implementation-roadmap.md) |
| 55 | Fixtures | [Implementation roadmap](implementation-roadmap.md) |
| 56 | Tests | [Implementation roadmap](implementation-roadmap.md), [QA/fallback](qa-repair-and-fallbacks.md) |
| 57 | Milestone protocol | [Implementation roadmap](implementation-roadmap.md) |
| 58 | Blocker policy | [Implementation roadmap](implementation-roadmap.md), [context report](context-availability-report.md) |
| 59 | Final definition of done | [Definition of done](definition-of-done.md) |
| 60 | First action/owner gate | [Context report](context-availability-report.md), [roadmap](implementation-roadmap.md) |
