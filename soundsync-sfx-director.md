# SoundSync SFX Director

## Purpose

The SoundSync SFX Director is the future ReeditPro planning layer for professional sound effects. It decides whether SFX should exist, what edit layer it supports, which provider or library source should be used, how the prompt should be shaped, how much extra duration should be generated, how the final sound should be trimmed and aligned, how it should be mixed, how QA should approve or reject it, and how reusable sounds can become part of ReeditPro's internal library over time.

This document is architecture only. It does not create TypeScript contracts, database tables, migrations, backend services, UI, provider calls, Secret Manager reads, Cloud Run resources, uploads, rendering, Stripe, or mobile screens.

## Default SFX Philosophy

By default, ReeditPro generates or selects SFX for ReeditPro-created editing layers, not for every real-world action in the source video. SFX must be subtle, timed to exact anchors, mixed under voice/music/ambience, QA-checked, and only used when it improves the edit.

No SFX is always a valid professional decision. ReeditPro should prefer silence, source ambience, music, or clean voice when an added sound would distract from meaning.

## Edit-Layer Boundary

Default SFX should mostly support ReeditPro-created edit layers:

- transitions
- title cards
- chapter cards
- Graphic Design / VisualExplain reveals
- Stroke Motion draw, morph, crack, reconnect, or completion moments
- Real Motion object entry, movement, impact, or settle moments
- CTA reveals
- selected montage hits
- soft ambient bridges
- important edit accents

Default SFX should not automatically be added for ordinary source-footage actions:

- footsteps
- doors
- cars
- water
- plates
- clothing
- crowds
- random ambience
- every visible action in source footage

Source-footage-style SFX may be planned only when the user explicitly asks for full sound design, original audio is missing, source footage is silent B-roll, the sound supports Real Motion, ambience needs repair, or the AI has a clear professional reason.

## Decision States

SFX decisions use these states:

| State | Meaning |
| --- | --- |
| `needed` | The edit layer would feel incomplete or unclear without sound. |
| `optional` | The cue may improve polish but is not required. |
| `not_needed` | The scene works better without added SFX. |
| `avoid` | SFX would damage tone, speech clarity, or user intent. |
| `needs_user_confirmation` | The SFX could change tone, cost, privacy, or meaning and needs approval. |

Examples:

- `needed`: Stroke Motion line completion in a signature edit, important title card hit, Real Motion object movement that would feel empty without sound, montage beat accent, or a transition that visually needs an audio bridge.
- `optional`: soft lifestyle transition, light Graphic Design reveal, CTA button reveal, or small chapter card accent.
- `not_needed`: normal talking-head clean cut, subtle caption change, natural scene change where ambience already works, or simple edit where music supports the moment.
- `avoid`: serious/faith teaching where SFX would feel cheap, emotional pause, dialogue-heavy moment, user requested simple/no SFX, SFX would fight speech, or SFX would distract from meaning.

## Target Layers

Every SFX cue should target a specific edit layer and timing anchor:

- `transition`
- `title_card`
- `chapter_card`
- `graphic_design`
- `stroke_motion`
- `real_motion`
- `caption_emphasis`
- `montage_hit`
- `cta_reveal`
- `ambient_bridge`
- `ui_feedback`
- `none`

The SFX plan must explain why the layer needs sound, which visual or story cue it supports, and why silence is not better.

## SFX Taxonomy

### Transition SFX

- soft whoosh
- camera swipe
- air pass
- light riser
- ambient bridge
- subtle cut accent
- dip-to-black swell

### Stroke Motion SFX

- stroke draw
- line trace
- soft pencil draw
- sketch texture
- symbol pop
- circle complete
- line crack
- line reconnect
- light shimmer

### Graphic Design / VisualExplain SFX

- card reveal
- label pop
- diagram trace
- line draw
- list item tick
- data point reveal
- subtle click

### Real Motion SFX

- object enter
- object settle
- soft impact
- paper movement
- glass movement
- wood movement
- cloth movement
- small room-matched hit

### Lifestyle / Vacation SFX

- travel whoosh
- camera shutter
- water/boat ambience only when needed
- restaurant ambience bridge
- footsteps only if explicitly needed
- luggage movement only if explicitly needed
- glass clink only if part of a designed moment

### CTA / UI / Ending SFX

- soft success chime
- light tap
- clean resolve hit
- subtle shimmer

## Provider Roles

Mirelo SFX V1.5 is the future production SFX provider. Use it for production-quality final SFX, important transitions, Stroke Motion final draw/morph sounds, Graphic Design reveal sounds, Real Motion object sounds, title/chapter hits, premium signature edits, and high-quality final polish.

MMAudio V is the future cheap draft, Basic/Pro fallback, and video-synced helper. Use it for draft timing ideas, inexpensive generation, movement prototypes, ambience/movement concepts, and SFX experiments where video context matters.

The internal ReeditPro library is a future first-choice source after enough safe sounds exist. At launch, the library may be empty. That is acceptable.

Do not integrate Mirelo or MMAudio in RP-SFX-01. Do not claim exact API behavior until provider docs exist.

## Provider-Specific Prompting

The SFX Director should not use one universal prompt format.

MMAudio is video-conditioned, so prompts should usually be short and focused:

`target sound source + texture + intensity`

Examples:

- `soft transition whoosh`
- `subtle graphic reveal sound`
- `gentle line drawing sound`
- `light title card hit`
- `quiet object movement`
- `soft ambient bridge`
- `boat ambience and soft water movement`

Mirelo is the future production SFX provider. Because exact Mirelo prompting behavior is not confirmed here, future tests should compare:

- `simple_keyword`
- `short_phrase`
- `tag_list`
- `structured_sentence`

Example Mirelo prompt:

`Soft premium transition whoosh, clean airy movement, subtle luxury tone, short smooth tail, no harsh riser, no cartoon, no sci-fi.`

## Generate-Extra-Duration Rule

Generated SFX should usually be longer than the final sound needed.

| Final need | Generate |
| --- | --- |
| 0.3-0.7 sec | 2.0-3.0 sec |
| 1-2 sec | 3-5 sec |
| 3-5 sec ambient bridge | 6-8 sec |

Extra duration gives room to find the best transient or texture, skip weak starts, avoid messy tails, trim cleanly, fade in/out, and align the hit point precisely.

## Trim And Hit Alignment

Generated SFX should not be blindly placed in the edit.

Final workflow:

1. Generate a longer sound.
2. Analyze the waveform.
3. Find the best transient or hit.
4. Find the clean usable region.
5. Trim to final length.
6. Align the hit point to the timing anchor.
7. Fade in/out.
8. Normalize.
9. Mix.
10. QA.

Every SFX cue needs timing metadata:

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

Example: a transition cut at `00:12.420` generates 2.5 seconds of audio, selects a usable trim from `0.82s` to `1.38s`, finds the hit at `1.02s`, starts 8 frames before the cut, hits exactly on the cut, and tails 12 frames after the cut.

## Timing Anchors

Possible timing anchors:

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

SFX timing must be frame-accurate. The hit point matters more than file start. Some SFX start before the visual hit and tail after it. The timing layer must connect to StoryTiming, Master Timing, and SoundSync + Transition Timing.

## Volume And Mix

Default mix hierarchy:

1. Spoken voice / important dialogue
2. Source ambience
3. Music
4. SFX
5. Decorative polish

Volume profiles:

- `none`
- `whisper`
- `subtle_polish`
- `standard_social`
- `impact`
- `premium_soft`

`whisper` is for serious, faith, emotional, and documentary moments. It should be almost felt more than heard.

`subtle_polish` is the default for most ReeditPro SFX.

`standard_social` works for lifestyle, vacation, social videos, and montage hits.

`impact` is rare and reserved for fitness, high-energy social, big title reveals, or strong transformation moments.

`premium_soft` supports luxury real estate, travel/lifestyle premium, smooth titles, transitions, and clean brand polish.

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
- Music present: SFX can sit above music only briefly at the hit point.
- No-speech montage: SFX can be more noticeable.
- Serious/faith/teaching: SFX whisper/subtle or none.
- Luxury/real estate: SFX soft, premium, clean.
- Fitness/high-energy: SFX stronger and beat-aligned.
- Stroke Motion: SFX subtle and synchronized to drawing.
- Real Motion: SFX room-matched and realistic.

## SFX QA

QA checks:

- too loud
- too quiet
- late hit
- early hit
- wrong style
- sounds cheap
- sounds cartoonish when it should be premium
- fights the voice
- fights the music
- tail too long
- weird artifact
- bad trim
- bad hit alignment
- repeats too often
- not needed
- does not match edit layer
- does not match user instruction
- does not match video tone

Possible QA actions:

- `use`
- `use_with_mix_adjustment`
- `trim_again`
- `lower_volume`
- `regenerate`
- `replace_with_library`
- `remove_sfx`
- `ask_user`

## Library Growth

ReeditPro may launch with no internal SFX library.

Starting workflow:

`no approved library sound exists -> generate sound for project -> store full generated file -> store final trimmed version -> store context, prompt, provider, timing, mix, QA -> use in project only -> mark as library candidate if reusable`

Over time:

`more users -> more generated SFX -> more QA data -> bigger internal library -> fewer repeated generations -> lower cost -> faster edits`

Default lifecycle state is `project_generated`. Promote only when QA passed, the sound is general-purpose, no private or user-specific content exists, provider/license terms allow reuse, reference-copy risk is low, and metadata/tags are complete.

## Credits And Approval

SFX generation follows the same approval system:

- show SFX generation cost in the credit estimate
- generated production SFX may cost credits
- multiple SFX events may increase cost
- no expensive SFX generation before user approval
- Basic/Pro use cheaper/default options when possible
- failed ReeditPro generation can be refunded according to credit policy

RP-SFX-01 documents these rules only. It does not implement pricing logic.

## Future Worker Integration

Future workers should execute approved snapshots, not raw chat. They should load SFX plan records, provider routes, prompts, trim metadata, mix metadata, QA requirements, and credit reservation IDs from trusted backend records.

Provider workers may later generate or select SFX. Audio workers may later analyze waveform, trim, align, normalize, and mix. QA workers may later inspect timing, loudness, artifacts, style, density, and speech safety.

No real worker, provider, storage, rendering, Supabase, Google Cloud, or Secret Manager integration is added by RP-SFX-01.

## StoryTiming Handoff

SFX event anchors, generated duration, trim windows, hit offsets, final start/hit/end placement, tails, fades, music beat flags, speech-safe placement, mix ducking, and SFX QA timing issues should later feed StoryTiming. The Master Timing Map should represent SFX as timing anchors and events such as `sfx_start`, `sfx_hit`, and `sfx_end`, then validate conflicts with speech, captions, music, ambience, signatures, and render layers.
