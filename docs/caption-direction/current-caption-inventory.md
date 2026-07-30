# Current Caption Inventory

## Current capabilities

| Area | Current owner | Current capability | Status |
| --- | --- | --- | --- |
| User/planner caption choice | `src/types/reeditpro.ts`, planner and ontology modules | Coarse style, placement, line, keyword, animation, safe-zone notes | mock/planning |
| Professional skills | `src/lib/professional-skills/professional-skill-registry.ts` | Flat `captions.*` entries for readable, speech-aligned, social, keyword, lower-third, accessibility, multilingual placeholder, and no-caption behavior | mock/planning |
| Caption/visual timing | `src/lib/caption-visual-cue-timing-planner.ts`, `src/lib/caption-timing-policy.ts` | Phrase/word timing, visual cues, collision recommendations, tier presets | mock; synthetic timing possible |
| Final timing coordination | `src/backend/services/storytiming-*`, `src/types/storytiming.ts` | Caption events, anchors, conflicts, readability, QA, render manifest | canonical timing architecture; local/mock services |
| Speech evidence | `server/workers/speech/` | faster-whisper foundation, transcript and word timestamp artifacts, filler/retake analysis | gated local/private worker path |
| Speech-to-caption pipeline | `server/workers/speech-caption/` | Chains speech output into caption execution | gated local/private |
| Caption segmentation | `server/workers/captions/caption-segment-builder.ts` | Word-count, character-count, line-count, and duration segmentation | deterministic foundation |
| Caption QA | `server/workers/captions/caption-*policy.ts`, QA builder | Timing/readability/safe-zone checks and warnings | bounded foundation |
| Stable caption files | SRT, WebVTT, ASS builders | Delivery text generation | gated local/private |
| libass preview | `libass-caption-preview-adapter.ts` | Offline/private subtitle preview through FFmpeg/libass | qualified only for current bounded path |
| Approved execution | approved snapshots, jobs, asset manifests | Snapshot/idempotency/private-path gates | partial internal execution foundation |
| Render ownership | Remotion planning/runtime foundations, FFmpeg export, libass | Planned creative layout and stable subtitle/export lanes | production remains blocked |
| Persistence drafts | `caption_plans`, transcript tables, StoryTiming tables in raw migrations | Coarse caption plan and transcript/timing records | noncanonical migration history; must not be executed |

## Current structural limitations

- No composite `caption_design` parent or parent/mini-skill relationship graph.
- No CaptionDirectionPlan, OpportunityMap, ReservationPlan, Approval Envelope, DependencyManifest, FinishReadiness, or CaptionSceneGraph.
- No explicit creative/accessibility/translation projection model derived from one canonical transcript.
- No source-word transformation ledger for condensed or stylized text.
- Segmentation is primarily bounded by word/character counts, not semantic units and measured typography.
- ASS output uses a fixed 1080×1920 script canvas and static styling rather than the approved output frame.
- Current font selection falls back to system font names; there is no approved, immutable font registry with glyph/shaping evidence.
- Placement does not score real final-frame occupancy, OCR, faces, products, masks, or anchors.
- Caption timing is partly seconds-based and can synthesize word timing; final word-locked provenance is not enforced.
- No simultaneous creative caption tracks, depth planes, object anchors, intentional occlusion, or persistent typographic structures.
- No caption-specific motion lock followed by SoundSync cue choreography.
- No full creative Remotion caption scene renderer.
- Caption artifacts do not yet have precise canonical asset kinds for every generated representation.
- Existing QA can warn when CV/OCR evidence is absent but cannot prove collision or occlusion against rendered frames.

## Current IDs requiring compatibility

The present registry uses IDs such as:

- `captions.clean_readable_captions`
- `captions.speech_aligned_subtitles`
- `captions.small_premium_subtitles`
- `captions.bold_social_captions`
- `captions.keyword_emphasis`
- `captions.lower_third_labels`
- `captions.accessibility_review`
- `captions.multilingual_placeholder_policy`
- `captions.no_caption_policy`

CAP-01 must map these to the `caption_design` composite and `no_captions` restraint without invalidating old plans or snapshots.

## Production boundary

The repository contains real local/private foundations, but product-ready external execution remains blocked by canonical persistence, tenancy, worker identity, deployed storage, tool/model/license evidence, renderer pinning, full media QA, billing authority, and production readiness gates. CAP-00 does not change that status.
