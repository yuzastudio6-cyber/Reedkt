# Captions Specialist — Post-CAP-20 Integration Checkpoint

Status: `ready_for_shared_pipeline_integration`
Checkpoint: `POST-CAP-20-AUDIT`
Media runtime changes: none; this checkpoint is a source-only completion audit
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
- [CAP-15 accessibility, localization, and export report](cap-15-accessibility-localization-export-report.md)
- [CAP-16 complete QA, repair, and fallback report](cap-16-complete-qa-repair-fallback-report.md)
- [CAP-17 chat, persistence, and observability report](cap-17-chat-persistence-observability-report.md)
- [CAP-18 private qualification report](cap-18-private-qualification-report.md)
- [CAP-19 migration and retirement report](cap-19-migration-retirement-report.md)
- [CAP-20 private internal release report](cap-20-private-internal-release-report.md)
- [CAP-20 shared-owner integration handoff](cap-20-shared-owner-integration-handoff.md)
- [Post-CAP-20 goal completion audit](post-cap20-goal-completion-audit.md)
- [Post-CAP-20 shared-owner integration routing](post-cap20-integration-routing.md)
- [Post-CAP-20 B-roll owner-read adapter](post-cap20-broll-owner-read-adapter.md)
- [Post-CAP-20 canonical transcript authenticated read](post-cap20-canonical-transcript-authenticated-read.md)
- [Post-CAP-20 canonical sequential-resume read](post-cap20-canonical-resume-read.md)
- [Post-CAP-20 authenticated multi-owner resume](post-cap20-authenticated-multi-owner-resume-report.md)
- [Current Caption integration readiness](current-integration-readiness.md)
- [Terminal private-qualification gate](terminal-private-qualification-gate.md)
- [Backend workflow integration merge](backend-workflow-integration-merge.md)
- [Canonical postapproval planning execution](canonical-postapproval-planning-execution.md)
- [Post-CAP-20 Visual Intelligence spatial adapter](post-cap20-visual-intelligence-spatial-adapter.md)

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

CAP-00R through CAP-20 are source-complete on the clean specialist branch. CAP-08's
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

CAP-15 adds frame-derived SRT/WebVTT, a canvas-aware ASS v2 profile, exact
16:9/9:16 recomposition, speaker and meaningful-sound accessibility lineage,
and Unicode-preserving Japanese/Arabic/Hindi/emoji contract fixtures. The
existing private libass operation produced directly inspected wide and repaired
vertical ASCII overlays. A clipped vertical attempt was rejected, and a new
predispatch safe-width gate prevents its recurrence. Multilingual libass,
complete tracks, video burn-in, FFmpeg final packaging, asset persistence, and
final QA remain closed owner gates.

CAP-16 adds strict per-output semantic-through-export QA, admits nineteen exact
previously inspected raster items without reclassifying bounded evidence as
complete-time AI review, preserves the failed and repaired vertical outputs as
separate artifacts, and emits local repair plus declared fallback plans. The
11-layer reports remain blocked on exact authenticated alignment, qualified
font/track runtime, complete-time Visual Intelligence, final mix, export,
motion-playback where applicable, and independent final-QA evidence.

CAP-17 adds the presentation-only Caption card to the existing Plan Review and
private-review flow, exact composition-trace selection/restraint, immutable
snapshot extension and tenant reread, plain-language versioned revisions,
sanitized metrics, and the authenticated postrender reload client. It creates
no second approval, charge, provider dispatcher, persistence store, private
review, or final-QA owner. `not_found`, `pending`, and `completed` remain exact
canonical backend read states; the browser cannot promote completion.

CAP-18 freezes the controlled private real-media matrix and direct visual
inspection. CAP-19 retires duplicate legacy owners while preserving explicit
compatibility and rollback. CAP-20 publishes the 29-job admitted release
candidate and excludes twelve shared-owner-dependent jobs rather than claiming
false qualification. The post-CAP-20 handoff and sequential-resume proof give
the backend exact, HQ-mediated integration seams.

The completion audit now records nine exact terminal gaps: five authenticated
shared-owner integrations, canonical private-execution mounting, qualified
complete-time visual-AI review, independent final-QA reread, and the final
per-job qualification projection. Registry/workflow integration must consume
the frozen public artifacts without manufacturing a second planner, runtime,
provider, or false backend coverage claim.

The additive post-CAP-20 integration manifest now projects all twelve
conditional-job requirements into the top-level bounded call/resume lane.
SoundSync, B-roll, Track All, and Visual Intelligence evidence can no longer be
silently skipped, while a missing canonical transcript fails closed as an
authenticated initial-input gap. The CAP-01 compatibility manifest and
qualification remain unchanged.

The additive B-roll owner-read adapter now validates the frozen B-roll public
request/result and projects only exact opaque refs into Caption's existing
binding. It does not claim that an authenticated owner result has been
persisted, reread, or mounted. See
[`post-cap20-broll-owner-read-adapter.md`](./post-cap20-broll-owner-read-adapter.md).

The canonical transcript now has a separate byte-free authenticated-read
binding. Transcript-dependent planning requires both the immutable transcript
artifact and its exact approved-snapshot reread evidence; partial diarization
or browser-local completion fails closed. See
[`post-cap20-canonical-transcript-authenticated-read.md`](./post-cap20-canonical-transcript-authenticated-read.md).

Caption now also has a strict read consumer for the canonical backend's
create-only sequential support ledger. It proves exact current-owner injection
and prior-owner promotion without importing the backend service or claiming
that actual records have been mounted. See
[`post-cap20-canonical-resume-read.md`](./post-cap20-canonical-resume-read.md).

The standalone internal harness now exercises that strict path across two
owners: authenticated Visual Intelligence is admitted and promoted before
authenticated Track All completes subject-occluded typography. Bare-reference
injection still fails closed, and the source fixture is not relabeled as a live
provider, GPU, or persisted backend run. See
[`post-cap20-authenticated-multi-owner-resume-report.md`](./post-cap20-authenticated-multi-owner-resume-report.md).

The additive current-readiness record now separates Caption-owned source
completion from actual canonical mounts. All five Caption shared-owner
boundaries are source-complete, while actual authenticated integrations,
backend execution, complete-time visual review, independent final QA, and the
terminal per-job projection remain explicitly open. See
[`current-integration-readiness.md`](./current-integration-readiness.md).

The canonical job adapter now executes completed Caption planning assignments
through the approved package, lease, private artifact QA, and reconciliation
owners. Missing owner evidence remains an HQ-mediated wait and cannot become a
completed manifest asset. This closes the postapproval planning-artifact gate
without claiming rendered Caption media or final visual QA. See
[`canonical-postapproval-planning-execution.md`](./canonical-postapproval-planning-execution.md).

The provider-neutral Visual Intelligence spatial companion now has a strict
Caption consumer and a typed specialist-runtime admission path. The runtime
requires the exact authenticated packet rather than trusting its reference,
while semantic occupancy preserves null regional contrast, refuses
rendered-review substitution, and retains all provider and QA ownership
outside Caption. See
[`post-cap20-visual-intelligence-spatial-adapter.md`](./post-cap20-visual-intelligence-spatial-adapter.md).

Provider spending, secrets, billing, public rollout, irreversible migrations,
and destructive compatibility removal remain outside this checkpoint.
