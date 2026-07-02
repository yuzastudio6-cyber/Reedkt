# Source Cleanup + Trim Planning

## Purpose

Source cleanup is the professional planning layer that decides what uploaded footage should stay, be cut, be tightened, be preserved, or be repurposed before final approval. It covers dead space, silence, filler words, false starts, repeated takes, mistakes, off-topic tangents, weak explanations, low-quality moments, shaky or unusable sections, bad audio sections, duplicate points, setup/cleanup before or after useful content, retakes, strong hooks, emotional moments, clear explanations, proof or evidence moments, product/demo/tutorial steps, CTA endings, and natural behind-the-scenes moments.

This milestone is mock planning only. It does not inspect real transcripts, audio, pixels, waveforms, or frames.

## User Cleanup Preference

ReeditPro must ask how aggressive cleanup should be before final approval:

“How clean should I make the cut? I can keep it natural, clean up only dead space, tighten it for retention, or aggressively remove repeats/fillers/mistakes.”

Cleanup recommendation is not confirmation. The user must confirm cleanup direction before final trim decisions and approval.

Preferences:

- `preserve_natural`: Keep human pauses and authenticity for behind-the-scenes, lifestyle, founder updates, and raw creator style.
- `light_cleanup`: Remove only obvious dead space and mistakes.
- `balanced_cleanup`: Default professional recommendation after confirmation; remove filler/repeats while preserving meaning.
- `tight_retention_cleanup`: Faster social pacing; remove slow parts and tighten explanations.
- `aggressive_cleanup`: Maximum cutdown only when the user asks for fast, dense, high-retention editing.
- `documentary_faithful`: Preserve context, evidence, and source integrity; avoid cutting in a way that changes meaning.
- `tutorial_complete`: Preserve all necessary steps and context even when a section is slower.
- `custom`: Follow special user instructions within product, safety, tier, frame, and timing constraints.

## No Random Cuts

Every cut, keep, tighten, preserve, or repurpose decision needs:

- reason
- source clip
- source range
- final use
- risk
- QA checks

The planner must never cut footage blindly.

## Keep Reasons

- `strong_hook`
- `clear_explanation`
- `emotional_moment`
- `product_demo_required`
- `tutorial_step_required`
- `proof_or_evidence`
- `source_context_required`
- `user_marked_important`
- `good_visual_moment`
- `good_audio_moment`
- `key_story_beat`
- `cta`
- `behind_the_scenes_authenticity`
- `transition_context`
- `custom`

## Cut Reasons

- `dead_space`
- `long_silence`
- `filler_words`
- `false_start`
- `repeated_take`
- `duplicate_point`
- `mistake`
- `off_topic`
- `weak_explanation`
- `bad_audio`
- `bad_visual`
- `shaky_or_blurry`
- `setup_cleanup`
- `privacy_sensitive`
- `user_marked_optional`
- `pacing_drag`
- `unclear_context`
- `custom`

## Decision Types

- `keep`
- `cut`
- `tighten`
- `preserve`
- `move_to_broll`
- `use_as_voiceover`
- `use_as_proof`
- `use_as_alt_take`
- `needs_user_review`
- `cannot_decide_mock`

## Category Behavior

Storytelling cuts dead space and repeats while preserving reveal, reaction, emotion, and meaningful pauses.

Education removes filler and redundant explanation while keeping clear steps, examples, and required context.

Documentary and case study edits preserve claim context and evidence. Source/proof sections may need longer holds and uncertain cuts should be marked for review.

Business, SaaS, and product edits keep product feature steps, demo continuity, and important UI/action sequences while cutting rambling setup.

Lifestyle and behind-the-scenes edits can preserve natural moments when the user wants authenticity. Avoid over-polishing unless requested.

## Tier Behavior

Basic stays clean but conservative: remove obvious dead space, mistakes, and repeats while keeping structure simple.

Pro supports stronger story/retention cleanup, retake selection, and better b-roll or voiceover repurposing.

Premium supports deeper selects, refined pacing, alternate trim strategies, and more QA/user review notes.

## Relationship To Timing

Trim decisions feed source timing, final timeline timing, MasterTimingPlan, caption timing, visual timing, transitions, credit estimates, approved snapshots, and future worker runtime contracts.

## Non-Goals

This milestone does not implement real transcript analysis, real silence detection, real frame analysis, real trimming, FFmpeg, VapourSynth, audio analysis, Remotion rendering, backend, provider calls, or media processing.

## Trim Review Refinement

`TrimReviewPlan` validates `SourceCleanupPlan` before final timing and approval. It refines retake groups into selected candidates with reasons/confidence and runs meaning-preservation checks for important clips, proof/evidence, tutorial/product continuity, documentary context, privacy-sensitive cuts, and aggressive cleanup risk.

If Trim Review is blocking, downstream timing, provider prompts, credit finality, approved snapshots, and future worker contracts must stay draft/locked.
