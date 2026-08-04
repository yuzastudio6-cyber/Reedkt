# Captions Specialist — CAP-14 Remotion Creative Renderer Checkpoint

Status: `cap_14_private_runtime_and_direct_golden_raster_qualified_external_owners_closed`
Checkpoint: `CAP-14`
Media runtime changes: additive private Remotion creative scene-group profile
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
- [CAP-03 core domain contract report](cap-03-core-domain-contract-report.md)
- [CAP-04 transcript, lineage, and alignment report](cap-04-transcript-lineage-alignment-report.md)
- [CAP-05 font and Unicode runtime report](cap-05-font-unicode-runtime-report.md)
- [CAP-06 early strategy and reservation report](cap-06-early-strategy-reservation-report.md)
- [CAP-07 picture lock and finish readiness report](cap-07-picture-lock-finish-readiness-report.md)
- [CAP-08 Visual Intelligence support report](cap-08-visual-intelligence-support-report.md)
- [CAP-09 Track All and SAM 3.1 report](cap-09-track-all-sam31-report.md)
- [CAP-10 semantic and style system report](cap-10-semantic-style-system-report.md)
- [CAP-11 multi-track scene graph report](cap-11-multi-track-scene-graph-report.md)
- [CAP-12 StoryTiming, motion, camera, and handoffs report](cap-12-storytiming-motion-handoffs-report.md)
- [CAP-13 Sound support report](cap-13-sound-support-report.md)
- [CAP-14 Remotion creative renderer report](cap-14-remotion-creative-renderer-report.md)

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

CAP-00R through CAP-07 are complete on the clean specialist branch. CAP-08's
support/occupancy/hierarchy contracts are complete with actual private visual
runtime evidence explicitly gated. CAP-09's Track All boundary, temporal QA,
cache, and fallback contracts are complete with actual Track All/SAM 3.1 media
execution explicitly gated. CAP-05's
contracts and fail-closed resolver are complete, with its actual private font
runtime qualification gates carried explicitly. CAP-01 adds the
neutral shared v2 manifest extension, per-job qualification snapshot,
Orchestra-shaped call/support/result contracts, strict closed-data validation,
the Caption manifest, and a bounded internal-only harness. It does not add the
HQ reasoning loop, a global scheduler, or peer execution.

CAP-02 adds the `caption_design` internal composite, 55 reusable mini skills,
versioned inverse relationships, the explicit `no_captions` conflict, complete
legacy mappings, cycle validation, and deterministic scene-aware activation.
It intentionally leaves registry mutation to CAP-03.

CAP-03 publishes 14 strict, versioned, digest-bound Caption domain artifacts
covering strategy through repair. These artifacts retain exact composite,
confirmed-frame, transcript, timing, approval, snapshot, and staleness lineage
while all canonical execution authorities remain closed.

CAP-04 adds one immutable private canonical transcript, exact source-word and
phrase lineage, transformation and review provenance, explicit Faster-Whisper,
WhisperX, and pyannote qualification records, and fail-closed word-motion
gates. WhisperX and pyannote remain honestly blocked until separately qualified.

CAP-05 adds strict font-runtime, asset-intake, registry, fallback-resolution,
and multilingual fixture contracts. Its canonical approved registry remains
empty because FontTools/OTS operations, actual multilingual shaping, and exact
preview/final parity have not yet been privately qualified. Contract fixtures
cannot open rendering.

CAP-06 adds the early strategy bundle with the correct four integration
classes, exact Visual Intelligence reservation evidence, non-renderable
blocking metadata, approval/estimate inputs, and owner-bound `no_captions`.
All ten historical treatment labels remain readable through an explicit v2
classification adapter.

CAP-07 adds the neutral canonical PictureLockManifest, 32-class dependency
manifest, scene-level finish readiness, exact approved fallback/exception
handling, local/global staleness, and append-only lifecycle progression.
Caption consumes picture lock and never becomes its owner or final-render
authority.

CAP-08 adds the HQ-mediated Visual Intelligence support payload, strict inbound
evidence packet, deterministic occupancy projection, protected-region
collision checks, final visual hierarchy, and rendered-inspection request
contract. Contract fixtures cannot claim visual inference or final rendered
inspection; those private runtime gates remain explicit.

CAP-09 adds the Track All support compiler, opaque SAM 3.1 lineage, exact
mask/track/anchor artifacts, OpenCV/Kornia refinement evidence, temporal QA,
cache identity/reuse, and a fixed safe fallback ladder. Contract fixtures
cannot admit text-behind-subject or anchor execution.

CAP-10 adds semantic phrase/style plans with exact word lineage, protected
token groups, Unicode-aware measured line selection, RTL/multi-font resolution,
role-based optical size, semantic color with non-color counterparts, adaptive
legibility, four output profiles, six calibration scenarios, and explicit
adapters for all ten historical style presets. Contract fixtures cannot claim
qualified shaping, authenticated visual evidence, rendered calibration media,
or direct raster inspection.

CAP-11 adds a new multi-track scene graph while preserving the old v1 decoder.
It supports accessible, semantic, hero, and persistent-list tracks; explicit
mode phases and active nodes; full-screen, subject-occlusion, object/environment,
and B-roll composition roles; separate safe concurrent regions; exact hero
limits; and complete accessibility counterparts. Unqualified Track All, anchor,
or B-roll evidence resolves to declared safe fallbacks without claiming real
depth or media execution.

CAP-12 registers every Caption node and semantic mode with StoryTiming, consumes
StoryTiming-owned frame/event resolutions, validates effective stable-read time,
and emits allowlisted motion primitives with deterministic reduced-motion
counterparts. Visual, Living Frame, Transition, and camera coordination remain
typed owner requests through neutral mediated support. The exact frozen
Caption↔Living Frame request/response payload is present without importing LF
server code; one request may validly return multiple selected scenes.

CAP-13 derives one explicit Sound request or silence decision for every frozen
Caption node after motion lock. Only two graph-eligible hero cues are requested;
ten nodes remain silent under a two-cue density ceiling and one-cue concurrency
limit. SoundSync keeps asset, generation, trim, mix, loudness, and audio-QA
ownership. Contract-only injected evidence cannot claim runtime or assets, and
missing Sound support selects the safe silent fallback.

CAP-14 adds the deterministic twelve-layer Caption Scene Group to the existing
canonical Remotion operation, keeps the legacy transparent overlay fallback,
binds exact StoryTiming and confirmed-frame lineage, renders full/reduced
private proxy variants, and preserves whole-word, safe-margin, hierarchy, and
settled-frame parity through direct inspection of sixteen golden rasters. The
first visually defective word-wrap attempt was rejected and repaired before
qualification. The proxy does not claim the final customer canvas, real Track
All evidence, final QA approval, or delivery authority.

Implementation continues automatically into CAP-15 stable/accessibility,
localization, libass, and FFmpeg export support.
Registry/workflow integration will consume
these frozen public artifacts at its dependency-safe milestone; no Caption
milestone manufactures a second planner or a false backend coverage claim.

Provider spending, secrets, billing, public rollout, irreversible migrations,
and destructive compatibility removal remain outside this checkpoint.
