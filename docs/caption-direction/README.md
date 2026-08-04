# Captions Specialist — CAP-02 Composite Checkpoint

Status: `cap_02_complete`
Checkpoint: `CAP-02`
Media runtime changes: none
Canonical goal SHA-256: `dda9772b3a503f4dcb1932159e8ff6b8299f3a5af401fec008028614f12dc5db`

This package reconciles the historical Caption Direction architecture with the
current skills-first Captions Specialist goal and the committed video-editing
workflow foundation at
`bfd269fa3ff6aca397f53eb4519ca0ed22b0b251`.

The identity hierarchy is now:

```text
captions                         top-level specialist
  -> caption_design             internal composite professional skill
     -> scene-selected mini skills

caption_direction               compatibility alias for caption_design
no_captions                     explicit mutually exclusive restraint
```

The future HQ/Orchestra may assign bounded video, scene, and boundary jobs to
`captions`. This Goal does not implement the HQ reasoning loop, global
dispatcher, central scheduler, or direct peer execution.

The governing workflow invariant remains:

> Early-planned, mid-edit reserved, late-resolved, late-rendered.

## CAP-00R findings

- The published historical CAP-00 branch
  `agent/caption-direction-cap-00@9ebd5a61a` contains documentation only.
- The backup preservation checkout contains extensive later Caption proof work,
  but it is untracked inside a heavily divergent tree and is not a safe
  publication or merge base.
- The clean implementation branch is
  `codex/captions-specialist-cap-00r-v1`, created from the committed backend
  foundation `bfd269fa3`.
- The committed base already provides Visual Intelligence, StoryTiming,
  canonical SAM 3.1 runtime ownership, caption/speech workers, approved
  snapshots, private work graphs, asset-manifest owners, Remotion, libass, and
  FFmpeg foundations.
- The committed base does not yet publish the neutral shared
  `SkillCapabilityManifest` v2, `SkillQualificationSnapshot`,
  `SkillSupportRequest`, `OrchestraSkillCall`, or
  `OrchestraSkillJobResult` contracts required by CAP-01.
- The frozen CAP-11 Caption↔Living Frame DTO remains unchanged. It is a typed,
  byte-free support artifact, not a peer-dispatch contract.
- Visual Intelligence owns visual analysis and postrender visual observations.
  Captions consumes its structured evidence and may not recreate a direct Qwen
  provider owner.
- Track All owns tracking/mask/anchor support. SAM 3.1 is consumed only through
  Track All-compatible evidence; Captions never calls SAM 3.1 directly.
- StoryTiming remains the sole final frame authority, Sound remains the audio
  execution/mix owner, and Remotion remains the final canvas.
- Direct raster inspection is mandatory whenever a Caption milestone produces
  media. Deterministic technical QA cannot substitute for professional visual
  appearance review.

## Document map

### CAP-00R control documents

- [Captions Specialist amendment](caption-specialist-amendment.md)
- [Branch and publication ledger](cap-00r-branch-publication-ledger.md)
- [Owner and public-boundary map](cap-00r-owner-public-boundary-map.md)
- [Keep, adapt, retire matrix](cap-00r-keep-adapt-retire-matrix.md)
- [Migration and compatibility plan](cap-00r-migration-compatibility-plan.md)
- [CAP-00R evidence report](cap-00r-report.md)

### CAP-01 implementation evidence

- [CAP-01 manifest, qualification, and harness report](cap-01-specialist-manifest-harness-report.md)
- [CAP-02 composite and mini-skill report](cap-02-composite-mini-skill-report.md)

### Historical architecture retained and amended

- [Conversation decision ledger](conversation-decision-ledger.md)
- [Repository reconciliation](repository-reconciliation.md)
- [Current caption inventory](current-caption-inventory.md)
- [Source-of-truth map](source-of-truth-map.md)
- [Duplicate-owner risks](duplicate-owner-risk-report.md)
- [Architecture](caption-direction-architecture.md)
- [Skill family](skill-family.md)
- [Lifecycle](caption-lifecycle.md)
- [Late binding and picture lock](late-binding-and-picture-lock.md)
- [Integration classes](caption-integration-classes.md)
- [Multi-track system](multi-track-caption-system.md)
- [Scene graph](caption-scene-graph.md)
- [Transcript and alignment](transcript-and-alignment.md)
- [Style profile](style-profile.md)
- [Semantic segmentation](semantic-segmentation.md)
- [Placement, depth, and occlusion](placement-depth-and-occlusion.md)
- [Motion grammar](motion-grammar.md)
- [Sound choreography](sound-choreography.md)
- [Living Frame coordination](living-frame-coordination.md)
- [B-roll and visual co-composition](broll-and-visual-co-composition.md)
- [Accessibility and localization](accessibility-and-localization.md)
- [Font runtime and security](font-runtime-and-security.md)
- [Backend and worker architecture](backend-worker-architecture.md)
- [Rendering, color, and export](rendering-color-and-export.md)
- [QA, repair, and fallbacks](qa-repair-and-fallbacks.md)
- [Tool qualification](tool-qualification.md)
- [Revision and invalidation](revision-and-invalidation.md)
- [Implementation roadmap](implementation-roadmap.md)
- [Definition of done](definition-of-done.md)

## Progression

CAP-00R through CAP-02 are complete on the clean specialist branch. CAP-01 adds the
neutral shared v2 manifest extension, per-job qualification snapshot,
Orchestra-shaped call/support/result contracts, strict closed-data validation,
the Caption manifest, and a bounded internal-only harness. It does not add the
HQ reasoning loop, a global scheduler, or peer execution.

CAP-02 adds the `caption_design` internal composite, 55 reusable mini skills,
versioned inverse relationships, the explicit `no_captions` conflict, complete
legacy mappings, cycle validation, and deterministic scene-aware activation.
It intentionally leaves registry mutation to CAP-03.

Implementation continues automatically into CAP-03 core domain contracts and
professional-skill registry integration.

Provider spending, secrets, billing, public rollout, irreversible migrations,
and destructive compatibility removal remain outside this checkpoint.
