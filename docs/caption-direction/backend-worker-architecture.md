# Backend and Worker Architecture

Caption Direction extends the approved-snapshot work graph; it does not run heavy work in the frontend.

## Proposed service boundaries

| Service | Responsibility |
| --- | --- |
| Caption strategy service | Compile approved intent, skill selection, transcript summary, preferences, and reference DNA into strategy/opportunities/reservations |
| Transcript authority service | Resolve immutable transcript/projection/lineage records |
| Caption finish-readiness service | Verify picture lock and dependency versions |
| Caption choreography service | Produce validated semantic/style/scene-graph proposals |
| Caption timing adapter | Register requirements and consume final StoryTiming frames |
| Caption sound handoff service | Build motion-locked cue intent for SoundSync |
| Caption render coordinator | Build deterministic render specs and worker dependencies |
| Caption QA/repair service | Aggregate evidence, propose scoped repair, and gate delivery |

These services use authenticated tenant scope, exact plan/snapshot IDs, idempotency keys, safe DTOs, and audited private records. Durable production writes require route-specific atomic boundaries; the generic idempotency path remains fail-closed.

The orchestration layer also reconciles existing owners for caption skill
assembly, glossary management, line layout, optical sizing, semantic
scale/color, adaptive legibility, visual occupancy, spatial/depth/anchor
resolution, hero/list/mode switching, B-roll/camera coordination,
accessibility/localization, revision impact, and user-facing summaries. These
are service capabilities, not permission to create duplicate timing, layout,
sound, visual, approval, or credit authorities.

## Work graph

```text
EARLY SPEECH AND STRATEGY
media_probe -> extract_caption_audio -> transcribe_speech
  -> forced_align_words_when_required
  -> diarize_speakers_when_required
  -> normalize_transcript_evidence -> verify_transcript_integrity
  -> build_caption_strategy -> map_caption_opportunities
  -> classify_caption_integration -> reserve_caption_space
  -> build_caption_blocking_metadata

MAIN EDIT
build_story_edit -> execute_cuts_and_pacing
  -> build_broll_and_visual_edit -> build_living_frame
  -> build_maps_charts_and_graphics -> reframe_and_stabilize
  -> build_transitions -> build_masks_and_tracking
  -> build_near_final_visual_proxy -> create_picture_lock_manifest

LATE CAPTION FINISH
check_caption_finish_readiness -> analyze_final_edit_frames
  -> resolve_semantic_caption_phrases -> resolve_caption_tracks
  -> resolve_line_layout -> resolve_typography_and_optical_size
  -> resolve_legibility -> resolve_spatial_caption_scene
  -> resolve_depth_and_occlusion -> resolve_object_anchors
  -> resolve_caption_motion -> resolve_caption_to_visual_handoffs
  -> register_storytiming_events -> compile_caption_sound_cues
  -> compile_caption_render_specs

FINAL FINISH
integrate_caption_sound_cues -> build_final_audio_mix
  -> prepare_remotion_caption_layers -> build_accessibility_tracks
  -> build_ass_fallback -> run_caption_preflight_qa
  -> render_caption_preview -> run_rendered_caption_qa
  -> local_repair_or_fallback -> final_render_and_mux
  -> final_caption_delivery_qa
```

Independent branches continue when safe. A missing required mask blocks only depth-dependent scenes; it does not stop stable subtitle generation. Final export waits for all required artifacts and QA.

Every item carries approved snapshot, plan, scene when relevant, projection,
style-profile, PictureLockManifest, StoryTiming, input/output artifact,
idempotency, QA, permitted-fallback, and dependency-version references.

## Worker assignment

- `gpu_ai_worker`: qualified speech alignment/diarization or approved visual-model inference.
- `cpu_analysis_worker`: OCR, frame/occupancy analysis, font parsing/subsetting, deterministic text layout support.
- `render_worker`: pinned Remotion/Chromium creative renders, libass stable renders, FFmpeg packaging.
- `qa_worker`: independent frame/audio/text/export checks.
- `tool_readiness_worker`: version/import/capability checks only.
- `api_service`: approval/credit gates, authorization, job dispatch, signed access, safe status.

## Artifacts

Every transcript, alignment, occupancy manifest, mask, font subset, scene graph, render spec, caption track, audio cue, render, QA report, and delivery file enters the asset manifest with project/snapshot/scene/timing/renderer lineage and immutable storage identity.

## Approved snapshot extension

The existing approved snapshot freezes exact versions/references for:

- strategy, opportunities, integration classifications, reservations, and approval envelope;
- style profile, transcript, word timestamps/provenance, alignment, speaker turns, and glossary;
- PictureLockManifest, FinishReadiness, resolved choreography, scene/phrase/line plans;
- placement, depth, occlusion, emphasis, motion, and StoryTiming events;
- caption sound cues/final-mix dependencies;
- font manifest, color plan, projection plans, render specs, and dependency manifests;
- QA/fallback rules and every required source/output artifact.

Workers consume only this snapshot and approved artifacts. They never resolve
mutable “latest” state or raw chat.

## Persistence and backward compatibility

Start with versioned plan-component snapshots such as
`caption_strategy_plan`, `caption_opportunity_map`,
`caption_reservation_plan`, `caption_approval_envelope`,
`caption_style_profile`, `caption_finish_readiness`,
`resolved_caption_choreography_plan`, `caption_scene_graph`,
`caption_projection_plan`, `caption_render_spec`,
`caption_dependency_manifest`, and `caption_qa_plan`.

Do not create dozens of phrase-level production tables before query, retention,
and scale evidence proves they are necessary. Existing CaptionPlanRecord,
CaptionVisualCueTimingPlan, caption segment and SRT/WebVTT/ASS artifacts, older
snapshots, caption workers, and render manifests stay readable through versioned
adapters until new and old fixtures, rollback, snapshot compatibility, and
documented deprecation all pass. The raw Supabase migration baseline remains
non-executable.

## Observability and provenance

Every rendered text element must trace through scene node, render track, phrase,
source word IDs, canonical transcript, Caption Direction decision, integration
class, StoryTiming event, style profile, font, mask/anchor, sound cue, worker,
QA result, and approved snapshot.

Metrics include transcript confidence/correction, alignment failure,
diarization uncertainty, effective read duration, collision frames, intentional
occlusion pass rate, mask instability, font fallback/missing glyph, motion
fallback, sound density, QA retries, render duration, cost per captioned minute
and integrated scene, revision turnaround, local-repair success, stale-plan
frequency, and final export caption failures. Logs and public DTOs use IDs and
bounded summaries, never transcript text or private artifacts.

## Security boundary

Workers receive IDs and canonical private object references, not secrets, raw chat, persistent signed URLs, or arbitrary executable code. Service-role/provider credentials remain backend-only. Production deployment remains blocked pending canonical tenancy, worker identity, storage/IAM, tool/model/license, and live security evidence.

Specifically prohibited are public transcript logs, signed URLs in logs,
provider secrets in plans/snapshots, arbitrary user CSS or ASS tags, arbitrary
model-generated React/JavaScript, caller-controlled FFmpeg arguments, direct
frontend transcription, unvalidated fonts, runtime model/browser downloads,
unapproved weights, and execution without approved artifacts. Weight manifests
must be versioned, hashed, private, and license/commercial-use reviewed.
