# SFX Provider Prompting

## Purpose

RP-SFX-05 adds mock-only provider-specific prompt adapters for the SoundSync SFX Director. It converts approved SFX event plans and provider routes into prompt plans for future Mirelo SFX V1.5, MMAudio V2, and ReeditPro internal library search.

This does not call providers, generate audio, connect to Supabase, read secrets, deploy Google Cloud, upload files, render media, or build UI.

## Why Provider-Specific Adapters

ReeditPro should not use one universal SFX prompt. Different future routes need different prompt shapes:

- MMAudio V2 uses short video-conditioned prompts.
- Mirelo SFX V1.5 uses more controlled production prompts.
- Internal library search uses tags and reuse metadata, not generation text.

## MMAudio V2 Strategy

MMAudio V2 is modeled as a cheap draft, Basic/Pro fallback, and video-synced helper. Its default style is `video_conditioned_short_prompt`.

Default format:

`target sound source + texture + intensity`

Examples:

- `soft transition whoosh`
- `gentle line drawing sound`
- `subtle graphic reveal sound`
- `quiet object movement`
- `soft ambient bridge`

Negative prompts stay concise:

`no loud impact, no cartoon, no harsh noise, no vocals`

When speech is present, prompt warnings must protect dialogue.

## Mirelo SFX V1.5 Strategy

Mirelo is modeled as the future production-quality SFX provider. Exact provider behavior is not confirmed here, so the adapter supports a prompt-style test matrix:

- `simple_keyword`
- `short_phrase`
- `tag_list`
- `structured_sentence`

Default production style is `structured_sentence`.

Structured format:

`[Sound type], [texture], [tone], [energy], [duration/tail], [mix context], [avoid rules].`

Examples:

- `Soft premium transition whoosh, clean airy movement, subtle luxury tone, medium-low energy, short smooth tail, designed to sit under music without overpowering dialogue, no harsh riser, no cartoon, no sci-fi.`
- `Gentle stroke drawing sound, soft pencil-like line trace, light texture, short clean tail, synchronized to a thin animated line, no loud scratch, no cartoon effect.`
- `Soft Real Motion object settle sound, realistic small object movement, room-matched, low volume, natural short impact, no cinematic boom, no exaggerated hit.`

## Internal Library Search

Internal library search creates tags instead of generation prompts.

Example:

`soft, transition, whoosh, premium, luxury, airy, subtle, short-tail`

At launch the library may be empty. The prompt plan should still record tags and fallback notes so future generation can happen only after approval and credits.

## Duration Planning

Prompt plans carry both needed duration and generation duration:

| Need | Generate |
| --- | --- |
| short hits/reveals/transitions | 2.5 seconds |
| longer object/title gestures | 4 seconds |
| ambient bridges/source repair | 7 seconds |

Internal library search does not generate new audio and records generation duration as `0`.

## Validation

Prompt validation returns warnings for:

- vague prompts
- MMAudio prompts that are too long
- Mirelo structured prompts that are too short
- missing or invalid duration
- fake source-action wording under edit-layer-only policy
- loud or impact wording with whisper/subtle volume profiles
- vocals, lyrics, music loops, or songs inside SFX prompts
- prompts that ignore voice-first mix rules
- missing avoid or negative prompt rules

Warnings do not execute anything. They prepare RP-SFX-06 timing/trim/hit alignment and later QA milestones.

## RP-SFX-06 Handoff

Prompt plans now hand off to mock timing services that create duration plans, mock generated asset metadata, waveform/transient analysis, trim plans, hit-aligned timing records, frame-aware timeline placement, and timing validation. This remains mock-only and does not generate or process audio.

RP-SFX-07 then uses those timing records to create voice-first mix/ducking metadata before SFX QA.

RP-SFX-08 consumes the prompt, timing, trim, and mix records during mock QA. If the output sounds wrong for the prompt, has artifacts, violates source-footage policy, or conflicts with user instructions, QA can recommend prompt adjustment and regeneration. No provider is called during this decision.

RP-SFX-10 displays prompt previews inside chat before any future generation. MMAudio prompts appear as short video-conditioned text, Mirelo prompts appear as controlled production sentences, and internal library prompts appear as search tags. The UI explicitly states that no Mirelo or MMAudio call has happened.

RP-SFX-11 uses prompt plans as worker inputs. The mock worker blocks if prompt status is not planned/approved/queued, if critical prompt warnings are present, or if generated duration is shorter than needed for provider generation. It still does not call providers.

## Examples

Lake Como lifestyle planning can produce:

- Mirelo structured prompt for a premium title or transition hit
- MMAudio short prompt for a draft transition whoosh
- internal library tags for a reusable soft whoosh
- no prompt for fake water or footsteps

Signature planning can produce:

- Mirelo Stroke Motion line draw prompt
- Mirelo Graphic Design card reveal prompt
- Mirelo Real Motion object settle prompt
- MMAudio draft prompt for timing experiments

## Mock-Only Boundary

RP-SFX-05 creates prompt plans and validation warnings only. RP-SFX-06 adds mock timing metadata after those prompt plans. RP-SFX-07 adds mock mix metadata, RP-SFX-08 adds mock QA/regeneration decisions, RP-SFX-10 displays those records in chat, and RP-SFX-11 models a gated mock worker skeleton. These milestones do not call APIs, generate sound, process audio, mix audio, spend credits, promote real library assets, or render media.
