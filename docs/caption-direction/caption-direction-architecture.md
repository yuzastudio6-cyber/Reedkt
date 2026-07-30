# Caption Direction Architecture

## Mission

Caption Direction converts approved speech evidence and edit intent into professional, frame-aware typography across creative, accessible, localized, and delivery projections. It is a composite creative skill, not a subtitle toggle and not an independent editor.

## End-to-end flow

```text
source media
  -> canonical transcript + timing provenance + speaker evidence
  -> compiled intent and caption restraint/strategy
  -> CaptionOpportunityMap
  -> CaptionIntegrationClassification
  -> CaptionReservationPlan + low-cost blocking preview
  -> main edit, visuals, masks, B-roll, Living Frame, transitions
  -> general PictureLockManifest
  -> CaptionFinishReadiness
  -> final-frame VisualOccupancyManifest
  -> semantic phrases + projections + CaptionSceneGraph
  -> StoryTiming final frames
  -> CaptionMotionLock
  -> caption sound cue plan -> SoundSync mix handoff
  -> approved snapshot and execution work graph
  -> Remotion creative render / libass stable render
  -> FFmpeg package
  -> semantic, visual, audio, accessibility, export QA
  -> delivery or local repair/revision
```

## Domain levels

| Level | Responsibility |
| --- | --- |
| Project | default caption mode, restraint, brand/language/accessibility policy |
| Output | aspect ratio, resolution, platform, reduced motion, accessible deliverables |
| Scene | integration class, visual role, occupancy, continuity, caption modes |
| Track | semantic purpose, projection, depth plane, renderer, priority |
| Phrase | semantic unit, display transformation, stable reading requirement |
| Token | canonical word lineage, emphasis, timing provenance, confidence |
| Spatial | region, anchor, depth, occlusion intent, collision constraints |
| Motion | typed primitive, easing, entrances/exits, mode transformation |
| Audio | eligible cues, restraint budget, dialogue protection, mix handoff |
| Delivery | open caption, SRT, WebVTT, ASS, translated track, metadata |

## Two-pass planning

Pass A — Strategy and reservation:

- decide whether captions help;
- select project/scene roles;
- classify opportunities;
- reserve space or shot duration where necessary;
- expose structural choices and estimate impact before approval;
- render only low-cost approximate blocking when useful.

Pass B — Late-bound finish:

- require picture lock and dependency readiness;
- inspect final or near-final frames;
- resolve semantic phrasing, line layout, precise placement, depth, motion, and track coexistence;
- register requirements with StoryTiming;
- lock caption motion, then hand eligible sound cues to SoundSync;
- render and QA against the actual composition.

## Core records

- `CaptionDirectionPlan`
- `CaptionStrategyPlan`
- `CaptionOpportunityMap`
- `CaptionIntegrationClassification`
- `CaptionReservationPlan`
- `CaptionApprovalEnvelope`
- `CaptionStyleProfile`
- `CaptionLifecycleStatus`
- `CaptionDependencyManifest`
- `CaptionFinishReadiness`
- `CanonicalTranscriptProjection`
- `CaptionSceneGraph`
- `VisualOccupancyManifest`
- `CaptionMotionLock`
- `CaptionSoundCuePlan`
- `CaptionRenderSpec`
- `CaptionQAReport`

Every record is typed, versioned, deterministic where executable, and linked to project, plan version, approved snapshot, frame, transcript, and applicable evidence.

## Head Intelligence and visual intelligence

Caption Direction uses a provider-neutral `HeadIntelligence` contract. A
configured provider such as Kimi K3 may be preferred later, but no domain
contract depends on a vendor-specific response shape.

Head Intelligence may propose narrative meaning, opportunities, integration
classes, semantic phrases, typography hierarchy, emphasis, mode switching,
sound intent, restraint, and fallbacks. Its output is schema-validated planning
data. It may not execute code or become the final timing, render, or QA
authority.

An approved visual model such as Qwen VLM may provide structured observations
about source/final frames, reference patterns, protected regions, clutter,
unreadability, preview quality, and intended occlusion. Deterministic
measurements, current plans, and independent rendered-output QA must corroborate
those observations.

## Chat-native experience

Normal users see intent and decision summaries, not package or worker names.
Target cards include:

- `InlineCaptionDirectionCard`
- `InlineCaptionOpportunityCard`
- `InlineCaptionReservationCard`
- `InlineCaptionStyleProfileCard`
- `InlineCaptionCalibrationPreviewCard`
- `InlineCaptionFinishReadinessCard`
- `InlineCaptionChoreographyCard`
- `InlineCaptionQAReviewCard`
- `InlineCaptionRevisionCard`

Summaries explain the caption role/mode, normal placement, integrated/depth
typography, hero count, sound policy, accessibility/localization outputs,
credits, fallbacks, and readiness. Natural-language changes such as removing
bounce, protecting a number, moving a list, keeping map captions still, or
changing one output size compile into structured revision intent and invalidate
only affected scopes.

## Credits and complexity

Caption Direction contributes estimate inputs to the existing credit system; it
never owns a caption ledger. Inputs may include transcription, alignment,
diarization, reference analysis, visual occupancy, custom fonts, output count,
languages, spatial/mask/hero scenes, cross-system handoffs, sound, render
complexity, rendered-frame QA, and revision depth.

Every edit level stays professional. Lower levels use accurate restrained
captions and professional QA; higher levels may add semantic direction, richer
spatial/motion work, occlusion, anchors, multiple languages, and deeper
visual/sound QA. Tier changes complexity and cost, not baseline quality.

Initial capability policy from the canonical goal:

- Basic: accurate phrase captions, curated font, stable placement, simple fade,
  SRT/WebVTT, simple Remotion or libass, and professional QA.
- Pro: semantic phrase direction, selective emphasis, adaptive legibility,
  spatial composition, alignment when required, reference-guided style, and
  richer Remotion motion.
- Premium: deeper typographic scenes, intentional subject occlusion, anchors,
  hero typography, Caption-to-Visual, multi-speaker direction, multiple
  languages, and deeper visual/sound QA.

This CAP-00 statement does not resolve the repository's separate future
Normal/Premium/Ultra Premium edit-level migration. CAP-02/CAP-16 must use the
approved compatibility contract rather than silently changing runtime tiers.

## Hard invariants

1. No expensive execution before exact plan and credit approval.
2. No final creative choreography before finish readiness.
3. No final word-locked animation from synthetic timing.
4. No final frame values outside StoryTiming.
5. No hidden text mutation without provenance.
6. No intentional occlusion without an accessible full-text projection.
7. No model-authored executable renderer code.
8. No asset outside the manifest.
9. No cross-system ownership duplication.
10. No final export with blocking caption QA.
