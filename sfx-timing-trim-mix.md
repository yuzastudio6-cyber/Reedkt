# SFX Timing, Trim, And Mix

## Purpose

This document defines how future ReeditPro SFX should be generated longer than needed, trimmed, hit-aligned, frame-accurately placed, mixed under voice/music/ambience, and QA-checked before preview or export.

This is architecture only. It does not run audio analysis, generate audio, call providers, process files, render media, create tables, or connect to Supabase.

## Generate Extra Duration

Generated SFX should usually be longer than the final cue.

| Needed final SFX | Generate |
| --- | --- |
| 0.3-0.7 sec | 2.0-3.0 sec |
| 1-2 sec | 3-5 sec |
| 3-5 sec ambient bridge | 6-8 sec |

RP-SFX-05 stores these duration targets in mock prompt plans. RP-SFX-06 adds mock duration plans, waveform/transient analysis, trim ranges, hit offsets, and frame-aware alignment.

Reasons:

- best part may be in the middle
- AI sounds may have weak starts
- AI sounds may have messy tails
- hit/transient may be late
- extra duration gives room for trimming
- fade-in/fade-out needs space
- timing alignment needs a clean hit point

## Trim Workflow

Future workflow:

1. Generate longer sound.
2. Store the full generated file.
3. Analyze waveform and loudness.
4. Find best transient/hit.
5. Find clean usable region.
6. Trim to final sound.
7. Align hit point to timing anchor.
8. Add pre-roll and tail.
9. Fade in/out.
10. Normalize.
11. Mix under voice/music/ambience.
12. QA timing, loudness, style, and artifacts.

Generated SFX must not be blindly placed in the edit.

## Timing Metadata

Every SFX needs:

- `anchor_type`
- `anchor_time`
- `start_time`
- `hit_time`
- `end_time`
- `pre_roll_ms`
- `tail_ms`
- `duration_needed_ms`
- `duration_generated_ms`
- `trim_start_seconds`
- `trim_end_seconds`
- `hit_offset_inside_trim_ms`
- `sync_priority`
- `mix_priority`

Example:

```text
Transition cut: 00:12.420
Generated sound: 2.5 sec
Best usable trim: 0.82s to 1.38s
Hit inside generated file: 1.02s
Final placement: start 8 frames before cut, hit on cut, tail 12 frames after cut
```

## RP-SFX-06 Mock Planner

The RP-SFX-06 mock service flow is:

```text
SFX Event Plan
-> SFX Prompt Plan
-> Mock Generated Asset
-> Duration Plan
-> Mock Waveform/Transient Analysis
-> Trim Plan
-> Hit Alignment
-> Frame-Aware Timeline Placement
-> Timing Validation
-> Next: Mix/Ducking Plan
```

This is still metadata-only. It does not process audio files, call providers, trim real media, render, upload, deploy, or connect to Supabase.

## Timing Anchors

Possible anchors:

- `cut`
- `music_beat`
- `music_downbeat`
- `title_reveal`
- `chapter_card_reveal`
- `graphic_reveal`
- `stroke_motion_start`
- `stroke_motion_completion`
- `stroke_motion_morph`
- `real_motion_object_enter`
- `real_motion_object_settle`
- `caption_keyword`
- `cta_reveal`
- `camera_movement`
- `gesture`
- `manual`

SFX timing should be frame-accurate. The hit point is more important than file start. Some SFX should start before the visual hit; some should tail after it. Timing must later connect to StoryTiming, Master Timing, Caption + Visual Cue Timing, and SoundSync + Transition Timing.

## Sync Priority

Use `high` sync priority for:

- cut impacts
- title/chapter card hits
- Stroke Motion completion
- Real Motion object settle
- CTA reveals
- montage hit accents

Use `medium` sync priority for:

- soft transition whooshes
- graphic reveals
- caption keyword emphasis
- music beat support

Use `low` sync priority for:

- ambient bridges
- subtle polish
- lifestyle texture
- soft UI feedback

## Mix Hierarchy

Default hierarchy:

1. Spoken voice / important dialogue
2. Source ambience
3. Music
4. SFX
5. Decorative polish

SFX must not be too loud by default. Voice clarity always wins.

RP-SFX-07 implements this as mock mix planning metadata: volume profile, target gain hint, ducking, sidechain intent, fade plan, EQ notes, stereo width, reverb match, room match, and validation before the SFX QA milestone.

## Volume Profiles

| Profile | Use |
| --- | --- |
| `none` | No SFX. |
| `whisper` | Serious, faith, emotional, documentary. Almost felt more than heard. |
| `subtle_polish` | Default for most ReeditPro SFX. |
| `standard_social` | Lifestyle, vacation, social videos, montage hits. |
| `impact` | Rare, for fitness, high-energy social, big title reveal, transformation moment. |
| `premium_soft` | Luxury real estate, travel/lifestyle premium, smooth title/transition, brand polish. |

## Mix Plan Fields

Every SFX mix plan should include:

- `volume_profile`
- `target_gain_db`
- `duck_under_voice`
- `duck_under_music`
- `fade_in_ms`
- `fade_out_ms`
- `eq_notes`
- `stereo_width`
- `reverb_match`
- `room_match`
- `sidechain_to_voice`
- `sidechain_to_music`

## Default Mix Rules

- Dialogue present: SFX very low or ducked.
- Music present: SFX can sit above music only briefly at hit point.
- No-speech montage: SFX can be more noticeable.
- Serious/faith/teaching: SFX whisper/subtle or none.
- Luxury/real estate: SFX soft, premium, clean.
- Fitness/high-energy: SFX stronger and beat-aligned.
- Stroke Motion: SFX subtle and synchronized to drawing.
- Real Motion: SFX room-matched and realistic.

The RP-SFX-07 handoff is `run_sfx_qa`; it does not run QA, render audio, process files, or call providers.

## Fade, EQ, Reverb, And Room Match

Fade rules:

- Short hit: tiny fade-in, tail fade-out.
- Whoosh: pre-roll fade-in before visual hit, tail fade after.
- Ambient bridge: smooth crossfade, no abrupt cut.
- Serious content: avoid sharp transient unless user asked.

EQ rules:

- Protect dialogue frequencies.
- Reduce harsh highs if SFX feels cheap.
- Reduce low-end hits under voice.
- Avoid boomy impacts in documentary/teaching.

Reverb and room match:

- Real Motion object sounds should feel plausible in the room.
- Source-footage repair sounds should match ambience.
- Graphic/Stroke sounds can be cleaner and less room-matched.
- Premium/luxury sounds should be soft and spatially controlled.

## Timing And Volume QA

QA checks:

- hit is late
- hit is early
- start is too abrupt
- tail is too long
- trim contains messy artifacts
- transient is weak
- volume is too loud
- volume is too quiet
- masks speech
- fights music
- wrong room feel
- wrong style
- repeats too often
- not needed

QA actions:

- `use`
- `use_with_mix_adjustment`
- `trim_again`
- `lower_volume`
- `regenerate`
- `replace_with_library`
- `remove_sfx`
- `ask_user`

## RP-SFX-08 Mock QA

RP-SFX-08 implements the mock QA layer for these timing and mix rules. It scores timing, volume, style fit, voice safety, music fit, and artifact quality; creates structured QA issues; writes mock QA reports; and decides whether to adjust, regenerate, replace with a future approved library cue, remove, use, or ask the user.

QA remains local metadata only. It does not process audio, render media, call providers, promote assets to the library, or connect to Supabase.

## StoryTiming Handoff

SFX timing remains owned by the SFX Director for event planning, trim, hit alignment, mix, and QA. Future StoryTiming should coordinate those records inside the Master Timing Map so SFX anchors and placement become shared timing events. `SFXEventPlanRecord`, `SFXTrimPlanRecord`, and `SFXTimingAlignmentRecord` should map to future anchors/events without removing the existing SFX-specific records.
