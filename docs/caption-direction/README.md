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
