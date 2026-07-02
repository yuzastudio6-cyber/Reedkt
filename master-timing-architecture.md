# Master Timing Architecture

ReeditPro treats timing as a professional editing foundation. A good visual with poor timing feels cheap; a simple visual with excellent timing can feel polished and intentional.

This milestone is documentation plus typed mock planning only. It does not implement real transcript alignment, beat detection, audio analysis, media processing, provider calls, Remotion rendering, backend work, or worker execution.

## Purpose

The Master Timing Plan coordinates exact timing for cuts, trims, captions, caption animation, visual reveals, maps, charts, browser captures, Stroke Motion clips, Real Motion clips, AI video assets, transitions, SFX, music ducking, Remotion layers, QA checks, credit estimates, approved snapshots, and future worker runtime.

Workers should eventually execute the approved Master Timing Plan from the approved snapshot, not raw chat.

## Frame-Accurate Rule

Every important timing event should store:

- `startSeconds`
- `endSeconds`
- `durationSeconds`
- `startFrame`
- `endFrame`
- `durationFrames`
- `fps`
- linked segment, clip, speech, beat, visual, renderer layer, or provider clip where relevant
- reason
- QA checks

Seconds are display values. Frames are the execution values.

## Timing Base

The Timing Base defines:

- fps
- total duration seconds
- total frames
- source duration
- final edit duration
- frame rounding rules

The timing base depends on the confirmed output frame/timing setup. If the output frame/aspect ratio is not confirmed, Master Timing remains draft and cannot be approved.

## Timing Priority Hierarchy

When timing goals conflict, ReeditPro should use this order:

1. speech clarity
2. story meaning / emotion
3. visual readability
4. music beat / rhythm
5. motion smoothness
6. platform retention
7. decorative effects

Do not cut on a music beat if that cut damages an important spoken word.

## Timing Layers

`source_timing` covers original clip ranges, uploaded order, source trims, pauses, dead space, and why a range is selected.

`final_timeline_timing` covers the edited order, segment start/end, hook/setup/explanation/CTA timing, emotional pauses, and final duration.

`speech_timing` covers line, phrase, word, pause, emphasis-word, and caption-chunk timing. This remains mock-only until real transcript alignment exists.

`caption_timing` covers caption enter, hold, exit, readable duration, emphasis animation, and safe gaps.

`beat_grid_timing` covers BPM, beat positions, downbeats, onsets, drops, and energy shifts. This remains mock-only until an AudioFlux worker exists.

`visual_timing` covers cards, map pin drops, route reveals, chart builds, browser zooms, Stroke Motion, AI-video panels, evidence boards, and visual read time.

`transition_timing` covers hard cuts, match cuts, beat cuts, crossfades, wipes, motion transitions, and whether the transition avoids speech damage.

`sfx_timing` covers card pops, map pins, count-up ticks, transition whooshes, impact hits, and documentary-restrained hits.

`music_ducking_timing` covers voice starts, duck start/end, attack/release, fade timing, emotional pause protection, and voice priority.

`remotion_layer_timing` covers exact Remotion sequence frames, layer start/end, overlap, z-index timing, and captions above visual layers.

`provider_clip_timing` covers AI video duration, start/end frame purpose, and where generated clips sit inside the final edit. Generated clips are assets, not final canvases.

## Timing By Category

Storytelling timing preserves emotional pauses while keeping story progression moving. Stroke Motion should land on story beats, not random motion.

Education timing is phrase-based. Visuals should reveal as concepts are spoken and labels should hold long enough to read.

Documentary / Case Study timing is measured. Evidence cards and source labels should hold long enough, with restrained SFX and safe wording.

Business / Brand timing should support problem, feature, benefit, proof, and CTA beats with clean premium pacing.

Lifestyle timing should feel natural, preserve human pauses, and avoid over-timing.

## Tier Behavior

Basic gets clean timing, readable captions, simple cuts, low SFX density, simple visual reveals, and a professional baseline.

Pro gets stronger cue timing, visual reveal timing, SoundSync planning, tool/card/map/chart timing, and no Veo.

Premium gets scene-by-scene timing, stronger beat/visual/SFX coordination, deeper QA, more complex motion timing, and Veo only as final fallback for AI video assets.

## Timing And Credits

Timing can affect credits through AI video duration, visual cue density, caption animation complexity, SoundSync complexity, transition/SFX density, map/chart/browser animation complexity, and timing QA.

## Caption + Visual Cue Refinement

The Caption + Visual Cue Timing layer refines the Master Timing Plan. Master Timing owns the broad frame-accurate timeline; the refinement layer adds caption chunking, animation policy, emphasis timing, visual cue triggers, visual read-time holds, and caption/visual collision recommendations.

The refinement layer must stay tied to Master Timing IDs and frame ranges. It is still mock-only until future transcript alignment, beat detection, and media workers exist.

## SoundSync + Transition Refinement

SoundSync + Transition Timing refines the broad `MasterTimingPlan` transition, SFX, and music ducking items after `CaptionVisualCueTimingPlan` exists. The refined plan adds a mock beat grid, music phrase sections, beat snap decisions, speech-safe transition timing, cue-linked SFX, and voice-first ducking ranges.

The `MasterTimingPlan` remains the frame-accurate foundation. The SoundSync refinement links back by ID and does not execute AudioFlux, FFmpeg, Signalsmith Stretch, Remotion, provider APIs, or media workers.

## Non-Goals

This milestone does not implement real transcript timing, real beat detection, real audio analysis, real Remotion rendering, real media processing, real provider calls, backend work, Supabase work, or billing.

## Timing Validation + Credit Impact

`TimingValidationPlan` is the approval gate for the timing foundation. It validates Master Timing, Caption + Visual Cue Timing, and SoundSync + Transition Timing before approval and connects timing complexity to the credit estimate.

Blocking or failed timing validation prevents approved snapshot creation. Warnings are reviewable in the mock UI. Timing validation remains structured-plan validation only and does not run transcript alignment, AudioFlux, FFmpeg, Signalsmith Stretch, Remotion, provider calls, or media inspection.

## Source Cleanup Input

`SourceCleanupPlan` feeds source timing before final approval. It determines which source ranges are kept, cut, tightened, preserved, moved to b-roll, used as proof, or left for user review.

Master Timing should reference `sourceCleanupPlanId` and link `SourceTimingItem.trimDecisionItemId` where possible. Cleanup preference must be confirmed before final trim timing, credits, approved snapshots, or worker execution.

This remains mock-only. No real transcript analysis, silence detection, FFmpeg, VapourSynth, audio/video analysis, or trim execution runs in the frontend.

## Trim Review Input

`TrimReviewPlan` validates retake selection and meaning preservation before final timing approval. If trim review blocks, Master Timing should remain draft/blocked and preserve risky source ranges instead of finalizing cuts that might change meaning.
