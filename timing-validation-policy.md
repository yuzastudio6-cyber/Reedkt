# Timing Validation Policy

## Purpose

Timing validation checks whether ReeditPro's timing plan is professional enough to approve. It validates output frame confirmation, timing base, frame ranges, source timing, final timeline timing, caption readability, visual read time, transition timing, SFX timing, music ducking, beat alignment, AI clip duration, Remotion layer timing, tier complexity, timing credit impact, lower-cost timing alternatives, and worker readiness.

Timing validation is a structured mock-planning gate. It does not inspect pixels, waveforms, transcripts, rendered frames, or real media.

## Validation Categories

- `frame_confirmation`: output aspect ratio/frame has been explicitly confirmed.
- `timing_base`: fps, total frames, source duration, and final duration exist.
- `source_timing`: source ranges and selected trim ranges are valid.
- `final_timeline`: final edit segments have frame ranges.
- `transcript_timing`: speech timing is represented honestly as mock or needs alignment.
- `caption_readability`: captions have readable duration, safe chunking, and reasonable density.
- `visual_readability`: cards, maps, charts, browser visuals, and labels have enough hold/read time.
- `caption_visual_collision`: captions do not conflict with faces, products, labels, browser focus, map pins, chart data, source labels, or foreground masks.
- `transition_safety`: transitions are phrase-aware and do not cut important words.
- `beat_alignment`: beat sync supports speech and meaning instead of overriding them.
- `sfx_justification`: SFX are tied to planned visual/transition cues and reasons.
- `music_ducking`: music protects voice clarity.
- `provider_clip_duration`: AI video/provider clips have expected duration and Remotion placement.
- `remotion_layer_timing`: Remotion layers have valid frame ranges and no obvious gap/overlap risk.
- `tier_complexity`: timing complexity fits Basic, Pro, or Premium.
- `credit_impact`: timing complexity is reflected in Reedit Credits and tradeoffs.
- `approval_gate`: approval is locked when timing is invalid.
- `worker_readiness`: future workers use approved snapshots and do not reinterpret raw chat.

## Validation Statuses

- `passed`: timing is safe enough for approval.
- `warning`: timing is acceptable in mock planning but should be reviewed or improved.
- `failed`: timing should be revised before approval and locks approval in this milestone.
- `blocking`: timing violates a hard product rule and locks approval.

## Hard Blocking Rules

Block approval if:

- aspect ratio/output frame is not confirmed
- source cleanup preference is not confirmed
- `MasterTimingPlan` is missing
- `timingBase` is missing
- fps is missing or invalid
- total frames are missing or invalid
- final timeline has no segments
- frame ranges are negative or invalid
- provider prompts are executable while timing is blocked
- renderer plan claims render-ready while timing is blocked
- approved snapshot would freeze blocked or failed timing
- future worker runtime claims runnable with blocked timing

## Warning Rules

Warn if:

- transcript timing is mock or needs alignment
- beat grid is mock or needs future AudioFlux analysis
- captions are near minimum readability
- visual read time is tight
- transition is not phrase-boundary aligned
- SFX density is high
- music ducking exists but confidence is low
- Basic has too many visual/SFX cues
- documentary timing is too aggressive
- lower-panel label density is high

## No Real Analysis Rule

Timing validation checks structured plans only. It does not run AudioFlux, FFmpeg, Signalsmith Stretch, transcript alignment, Remotion, tool workers, provider calls, backend jobs, or media processing.

## Source Cleanup Validation

Timing validation also checks that `SourceCleanupPlan` exists, cleanup preference is confirmed, source timing references trim decisions, and prompt/credit approval stays blocked while cleanup is unconfirmed.

This validation only reads structured cleanup metadata. It does not detect silence, filler words, retakes, audio quality, visual quality, or transcript meaning from real media.

## Trim Review Validation

Timing validation also checks that `TrimReviewPlan` exists and is not blocking. Retake selection and meaning-preservation issues must be resolved before final timing approval. This validation reads structured mock plan metadata only and does not run semantic, transcript, or media comparison.
