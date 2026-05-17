# Reference Video DNA UX

## Purpose

Reference videos help ReeditPro understand the user's desired editing direction without turning the product into a copy machine. A reference can guide:

- pacing
- tone
- caption style
- transitions
- music and SoundSync
- beat timing
- visual density
- opening structure
- hook style
- use of b-roll
- use of graphic design
- use of Stroke Motion
- use of Real Motion-style overlays
- the overall reason the reference works

Reference Video DNA is planning input. It should help ReeditPro translate a user's taste into an approved edit plan that still fits the user's own footage, platform, edit level, tier rules, safety rules, and credit budget.

## Reference DNA, Not Copying

ReeditPro extracts Reference DNA. It does not copy the video.

Rules:

- Do not copy shot-for-shot.
- Do not copy exact timing one-to-one.
- Do not copy exact music.
- Do not copy copyrighted visuals or brand assets.
- Do not copy a creator's identity or distinctive protected style as an exact replica.
- Use the reference as guidance for editing language, pacing, structure, and mood.
- Adapt the reference into ReeditPro's own professional planning system.

The product should describe reference influence as style guidance, not imitation. If a user asks to "copy this exactly," ReeditPro should capture that as a request for a close style match while still adding explicit do-not-copy rules.

## User Instruction Hierarchy

Reference DNA is lower priority than:

- explicit user instructions
- confirmed category
- confirmed edit level
- source order confirmation
- platform and frame constraints
- tier and model constraints
- safety and QA rules

Example:

```text
Use this reference but make it calmer.
```

The compiler should capture:

- reference pacing style
- user override: calmer, less aggressive

Reference DNA guides style; it does not replace structured intent, source sequence planning, user overrides, credit approval, or model-routing policy.

## Reference DNA Fields

Reference DNA should support these fields:

- `referenceUrl`
- `referenceProvided`
- `topic`
- `openingStyle`
- `hookStyle`
- `pacing`
- `cutRhythm`
- `captionStyle`
- `captionDensity`
- `transitionStyle`
- `musicIntro`
- `soundSyncStyle`
- `visualEffectStyle`
- `brollStyle`
- `colorGradeMood`
- `signatureSystemUsage`
- `frameLayoutHints`
- `moodTone`
- `whatWorks`
- `adaptationRules`
- `doNotCopyRules`
- `userOverrides`
- `confidence`
- `sourceLimitations`

## Reference Analysis Modes

Supported modes:

- `no_reference`
- `user_pasted_link`
- `user_uploaded_reference`
- `mock_reference`
- `reference_skipped`

For the current frontend prototype:

- no real reference video analysis
- no download
- no external API
- use mock analysis based on link text, scenario, or user selection

## Chat UX

Reference video happens inside chat. It is optional and compact.

The reference video card should:

- let the user paste a link
- let the user skip
- show mock Reference DNA if attached
- explain "I'll study the editing style without copying it"
- let the user adjust focus:
  - copy pacing loosely
  - use only caption style
  - use only transition style
  - use only mood/tone
  - ignore reference
- show a Reference DNA summary before plan approval

The card must also make these rules visible:

- Reference DNA guides style. It does not override user instructions.
- ReeditPro will not copy the reference shot-for-shot.
- Reference video does not bypass credit approval.

## Approval And Snapshot

Reference video must not bypass the approval or credit gate.

Future approved plan snapshots should store:

- reference URL or attachment metadata
- Reference DNA
- adaptation rules
- do-not-copy rules
- user overrides
- confidence and source limitations

Future workers should execute approved plan snapshots, not raw reference links. A raw link may be stored as metadata, but the executable planning contract is the structured Reference DNA and approved adaptation policy.
