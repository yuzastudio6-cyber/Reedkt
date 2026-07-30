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
