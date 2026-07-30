# Repository Reconciliation

## Reuse before addition

Caption Direction must be an orchestration and domain layer over existing owners:

| Target responsibility | Reused owner | New adapter/domain needed |
| --- | --- | --- |
| Structured user intent | Intent Compiler, Edit Brief, preferences, professional directives | Caption strategy inputs and explicit restraint mapping |
| Skill selection | Professional skill registry/planner | Composite relationship support and legacy-ID aliases |
| Canonical speech evidence | Speech workers and transcript artifacts | Canonical transcript authority, lineage, confidence, transformation records |
| Frame timing | Master Timing and StoryTiming | Caption requirement/event registration; no parallel timeline |
| Visual evidence | Video understanding, layout, depth, OCR/CV tool plans | Final VisualOccupancyManifest and candidate scoring |
| Editing reservations | segment operations, visual/layout/render planning | CaptionOpportunityMap, ReservationPlan, blocking preview |
| Approval | plan version, credit estimate, approved snapshot | Caption Approval Envelope embedded in existing approval |
| Async execution | work graph, jobs, asset manifest, QA gates | caption-specific work items, dependencies, artifacts, checkbacks |
| Creative composition | Remotion/render stack | typed deterministic CaptionSceneGraph renderer |
| Stable delivery | current SRT/VTT/ASS/libass workers | canvas-aware ASS and projection-aware delivery |
| Packaging | FFmpeg/export foundations | caption track mux/package verification |
| Sound | SoundSync and Master Timing | motion-locked caption cue handoff and mix result dependency |
| Cross-system visuals | Living Frame, maps, diagrams, B-roll, transitions | typed handoffs; receiving system retains execution ownership |

## Current-versus-target gap matrix

| Concern | Current state | Target state | Migration |
| --- | --- | --- | --- |
| Skill identity | Flat `captions.*` skills | `caption_design` composite plus mini skills and `no_captions` | Alias/map legacy IDs, preserve snapshots |
| Planning phase | Coarse caption choice inside main plan | early strategy, opportunity map, reservation | Add versioned plan records |
| Finalization | mock timing before real final frames | late resolution after PictureLockManifest | FinishReadiness gate |
| Transcript | worker artifacts and several persistence concepts | one canonical immutable transcript with projections | authority adapter and lineage IDs |
| Segmentation | fixed word/character rules | semantic phrases plus deterministic/language validation | keep current builder as fallback |
| Timing | seconds and synthetic word distribution possible | StoryTiming frame authority; provenance-gated word motion | block synthetic final word locking |
| Styling | preset strings and coarse fields | typed CaptionStyleProfile with executable values | profile version adapter |
| Placement | safe-zone hints | final-frame occupancy scoring, depth, anchors, occlusion | VisualOccupancyManifest |
| Tracks | mostly one visible stream | simultaneous typed creative/accessibility/hero/list tracks | CaptionSceneGraph |
| Depth | captions above masks | per-track approved depth planes | safe default + intentional creative exception |
| Sound | caption-linked SFX concepts | motion-lock-first cue eligibility and SoundSync mix handoff | versioned cue/mix records |
| Rendering | no complete creative renderer; fixed ASS canvas | pinned Remotion creative renderer + canvas-aware libass | renderer specs and fallback ladder |
| QA | heuristic timing/readability and absent-evidence warnings | semantic, spatial, occlusion, motion, sound, accessibility, render QA | staged evidence gates and local repair |
| Persistence | raw divergent migrations | canonical versioned records with RLS and immutability | isolated schema design; no raw migration reuse |

## Migration and backward compatibility

1. Add adapters before changing existing producers.
2. Read old plans/snapshots through explicit version decoders.
3. Map current caption style IDs and `captions.*` skills to composite components.
4. Preserve old synthetic timing as `blocking_preview_only`; never upgrade its provenance silently.
5. Preserve top-layer captions as the safe legacy/accessibility rendering default.
6. Preserve current caption worker output kinds while introducing more precise artifact kinds through compatible unions.
7. Dual-write only inside an approved migration milestone and only when one owner remains authoritative.
8. Do not delete old fields until fixtures prove round-trip compatibility and an owner approves removal.
9. Raw Supabase migrations remain blocked; design new records against the future canonical chain.

## Contract reconciliation map

```text
CompiledEditingIntent / Edit Brief
  -> CaptionStrategyPlan
  -> CaptionOpportunityMap + CaptionReservationPlan
  -> existing segment/layout/render planning
  -> PictureLockManifest + VisualOccupancyManifest
  -> CaptionSceneGraph + CaptionStyleProfile
  -> StoryTiming caption requirements/events
  -> CaptionMotionLock
  -> SoundSync CaptionSoundCuePlan
  -> ApprovedPlanSnapshot / execution graph / asset manifest
  -> Remotion creative render + libass accessible render
  -> FFmpeg package
  -> QA + delivery artifacts
```

Every arrow is versioned and provenance-bearing. None may bypass approval, credits, dependency readiness, or QA.
