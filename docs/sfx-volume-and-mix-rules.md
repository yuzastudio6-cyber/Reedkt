# SFX Volume And Mix Rules

## Purpose

RP-SFX-07 adds mock-only volume, mix, and ducking planning for the SoundSync SFX Director. It makes sure planned SFX remain voice-first, subtle by default, ambience-aware, and ready for later QA.

This does not process audio, call Mirelo, call MMAudio, connect to Supabase, run migrations, deploy Google Cloud, upload files, render media, or build UI.

## Mix Hierarchy

Default hierarchy:

1. Spoken voice / important dialogue
2. Source ambience
3. Music
4. SFX
5. Decorative polish

SFX can briefly rise above music at a planned hit point, but it should not stay loud, fight speech, or make the edit feel cheap.

## Volume Profiles

| Profile | Planning use |
| --- | --- |
| `none` | No audible SFX. |
| `whisper` | Serious, faith, teaching, documentary, emotional, subtle caption/graphic emphasis. |
| `subtle_polish` | Default for most ReeditPro transitions, graphics, Stroke Motion, CTA polish. |
| `premium_soft` | Luxury, real estate, premium travel, elegant title cards, high-end brand polish. |
| `standard_social` | Lifestyle, vacation, product demo, montage, energetic social edits. |
| `impact` | Rare controlled hits for fitness, high-energy, transformation moments, usually without speech. |

Target gain hints are planning-only, not mastering values:

- `whisper`: about `-24dB` to `-18dB`
- `subtle_polish`: about `-18dB` to `-12dB`
- `premium_soft`: about `-16dB` to `-10dB`
- `standard_social`: about `-12dB` to `-8dB`
- `impact`: about `-8dB` to `-4dB`

## Ducking

If speech is present:

```text
duckUnderVoice = true
sidechainToVoice = true
mixPriority = voice_first
```

If music is present, short hits can briefly sit above the bed. Longer whooshes, ambient bridges, and movement cues should duck under music after the hit point.

Ambience-important scenes require restrained SFX, natural reverb, and room-match guidance.

## Fades

RP-SFX-07 reuses RP-SFX-06 trim fades when available. If no trim plan exists, it falls back to target-layer defaults:

- short hit: `10-20ms` in, `60-120ms` out
- transition whoosh: `20-60ms` in, `100-250ms` out
- ambient bridge: `300-800ms` in/out
- Stroke Motion draw: `20-50ms` in, `80-180ms` out
- Real Motion settle: `10-30ms` in, `120-250ms` out
- CTA reveal: `10-30ms` in, `100-200ms` out

## EQ, Stereo, Reverb, And Room Match

Dialogue present:

- soften harsh highs
- avoid midrange masking
- keep stereo narrow or moderate

Luxury/premium:

- smooth highs
- no cheap brightness
- no trailer boom

Faith/serious:

- warm and restrained
- no sharp hype-style hits

Real Motion:

- match room and object material
- keep impact realistic

Stroke Motion:

- light texture
- avoid scratchy line sounds

Fitness/social:

- controlled transient clarity
- avoid distortion and clipping

## Validation

Mock mix validation catches:

- too loud for dialogue
- too quiet to notice
- fights music
- fights ambience
- wrong volume profile
- missing ducking
- fade too short or too long
- harsh frequency risk
- too wide for dialogue
- reverb mismatch
- room mismatch
- manual review needed

Warnings prepare RP-SFX-08 QA. They do not render or process audio.

## RP-SFX-08 QA Handoff

RP-SFX-08 consumes mix plans and validation warnings to decide whether SFX can be used, adjusted, lowered, trimmed again, regenerated, replaced with a future approved library cue, removed, or escalated to the user. Voice-first failures such as impact SFX under dialogue, missing ducking, harsh tone, ambience conflict, or wrong room/reverb match can block preview/export.

RP-SFX-09 then uses QA and mix metadata for library growth. Voice-safe mix, clean fades, room/reverb match, and low dialogue risk improve candidate quality, but they do not override provenance or privacy review.

## RP-SFX-10 Chat UI Handoff

RP-SFX-10 displays mix plans in chat with a voice-first summary, volume profile, gain hint, ducking, sidechain intent, fades, EQ, stereo width, reverb, room match, and warnings. Detailed mix settings remain collapsed so SFX planning does not become an audio workstation UI.

## Examples

Dialogue transition whoosh:

```text
volume: subtle_polish
ducking: duck under voice, sidechain to voice
fade: short whoosh fade
tone: voice-safe, soft highs
```

Luxury title card:

```text
volume: premium_soft
tone: smooth highs, clean tail, no harsh impact
```

Stroke Motion draw:

```text
volume: subtle_polish or whisper
tone: soft pencil-like texture, no harsh scratch
```

Real Motion object settle:

```text
volume: premium_soft
room: room-matched, realistic, no cinematic boom
```

Faith teaching:

```text
volume: whisper or none
ducking: voice-first
tone: warm and respectful
```

Bad mix example:

```text
impact SFX under dialogue, no ducking
validation: too_loud_for_dialogue, ducking_missing, manual_review_needed
```

## Mock-Only Boundary

RP-SFX-07 creates mix planning metadata only. RP-SFX-08 adds mock QA decisions over that metadata, but real loudness analysis, EQ, sidechain ducking, room matching, rendering, export, provider generation, library promotion, and media QA remain future milestones.
