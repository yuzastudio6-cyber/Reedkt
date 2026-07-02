# SFX QA And Regeneration Decision

## Purpose

RP-SFX-08 adds mock-only QA and regeneration decisions for SoundSync SFX Director. The QA layer answers one product question:

```text
Does this SFX make the edit better?
```

If not, it recommends use with adjustment, trim again, lower volume, regenerate, replace with a future approved library cue, remove SFX, or ask the user.

This does not process audio, call Mirelo, call MMAudio, connect to Supabase, run migrations, promote library assets, upload files, render media, or build UI.

## Scoring

Mock QA uses 0-100 scores:

- timing
- volume
- style fit
- voice safety
- music fit
- artifact quality
- overall weighted score

Suggested interpretation:

- `90-100`: excellent, use
- `80-89`: usable, maybe minor adjustment
- `70-79`: warning, use only when context supports it
- `50-69`: adjust or regenerate
- under `50`: reject, remove, or regenerate

## Issue Creation

QA issues are created from timing, trim, mix, style, source-policy, voice, music, ambience, and mock output metadata.

Examples:

- `late_hit` when the hit misses the anchor.
- `bad_trim` when the usable region is unsafe or cuts off the hit.
- `too_loud` when impact SFX appears under dialogue.
- `fights_voice` when voice ducking is missing or speech is covered.
- `wrong_style` when a sound does not match the edit tone.
- `cartoonish_when_should_be_premium` for childish/cartoony premium moments.
- `does_not_match_edit_layer` when fake source-action SFX violates the edit-layer default.
- `audio_artifact` for distorted, glitchy, or low-quality mock output.

Critical issues block use. Lower severity issues can still allow adjustment.

## Recommended Actions

The QA report chooses one of:

- `use`
- `use_with_mix_adjustment`
- `trim_again`
- `lower_volume`
- `regenerate`
- `replace_with_library`
- `remove_sfx`
- `ask_user`

`avoid` and `not_needed` SFX states are not approvable. They route to removal/no-SFX rather than generation.

## Regeneration Decisions

Regeneration is recommended when the concept cannot be fixed with trim or mix:

- wrong style or wrong energy
- cartoonish premium/luxury sound
- bad AI artifact
- source-footage policy conflict
- user-instruction conflict
- output is too low-quality to salvage

Prompt adjustments stay local and mock-only, for example:

- make it softer and shorter
- remove cartoon tone
- make it more premium and subtle
- remove harsh riser
- make it room-matched
- make it safer under speech

Provider switch suggestions are metadata only. They do not call providers.

## Adjustment Decisions

Adjustment is preferred over regeneration when the sound concept is usable:

- hit is slightly late or early
- tail is too long
- volume is too loud or quiet
- ducking is missing
- fade is too abrupt
- EQ or room match needs a correction

These decisions prepare future trim/mix workers but do not process audio in RP-SFX-08.

## Replacement Decisions

Internal library replacement is modeled as a future option. The mock service can recommend replacement for common reusable cues such as a soft whoosh when a safe approved library match is explicitly present in the scenario.

At launch, ReeditPro does not assume an approved reusable SFX library exists. RP-SFX-09 models library candidate growth, provenance, privacy, licensing, and promotion review.

## Remove-SFX Decisions

No SFX is a professional decision. QA removes SFX when:

- the event was planned as `avoid`
- the event was planned as `not_needed`
- source-action SFX was added without explicit full sound design
- serious/faith/teaching content would be weakened by the sound
- the SFX distracts from an emotional pause or important speech

## Chat Summaries

The chat-ready summaries explain the decision in user-facing language:

```text
The transition SFX is timed correctly, but it is too loud under dialogue. I recommend lowering it and adding voice ducking instead of regenerating.
```

```text
This Stroke Motion draw sound passed QA. It is subtle, synced to the line movement, and safe under the speaker's voice.
```

```text
This title-card hit sounds too harsh for a luxury edit. I recommend regenerating it with a softer premium prompt.
```

## Mock Flows

`runMockLakeComoSFXQAFlow` includes premium travel pass, adjust, regenerate, ambience, and future library replacement examples.

`runMockStrokeMotionSFXQAFlow` includes a passed line draw and a scratchy/harsh regenerate case.

`runMockRealMotionSFXQAFlow` includes a passed room-matched object settle and a cartoon/boom regenerate case.

`runMockFaithTeachingSFXQAFlow` shows no-SFX removal for serious teaching and simple talking-head restraint.

`runMockBadSFXQAFlow` catches loud dialogue conflicts, late hit, bad trim, long tail over speech, provider artifacts, and fake source-action SFX policy violations.

## Mock-Only Boundary

RP-SFX-08 writes local mock records and deterministic summaries only. It does not listen to audio, inspect waveforms, generate new sounds, adjust files, render media, promote library assets, or connect to external systems.

## RP-SFX-09 Library Growth Handoff

RP-SFX-09 consumes QA reports and issues to decide project-only use, reuse risk, provenance review, future library replacement/candidate status, and usage learning. QA pass alone is not enough for global reuse; privacy, license, provider terms, and metadata completeness still matter.

## RP-SFX-10 Chat UI Handoff

RP-SFX-10 surfaces QA results and revision options in chat: scores, issues, recommended action, project approval, library candidate state, regeneration flags, trim-adjustment flags, and mix-adjustment flags. Buttons update local mock chat copy only; they do not regenerate or process audio.

## RP-SFX-11 Worker Handoff

RP-SFX-11 calls the mock QA service from an approval/credit-gated worker skeleton after simulated provider or internal-library output, trim, timing, and mix planning. Failed QA returns worker status `failed` and does not approve SFX for preview/export.

The worker still does not regenerate, call providers, process audio, or spend/refund credits. It only models the future handoff points.
