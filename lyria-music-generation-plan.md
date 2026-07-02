# Lyria Music Generation Plan

## Purpose

This document defines how ReeditPro should plan future custom music generation with Lyria Pro.

This is architecture only. It does not integrate Lyria Pro, add Google API keys, call Google APIs, deploy Google Cloud, create migrations, connect to Supabase, generate music, or implement real pricing.

## Primary Future Generator

Lyria Pro is the future primary custom music generation model for ReeditPro project-specific music cues and soundtracks.

ReeditPro should generate music on the fly when a project needs custom music because each edit can have different:

- user intent
- footage
- mood
- scene setting
- language/culture context
- platform
- speech density
- reference music DNA
- signature-system timing

Generation must still be planned professionally. No random music generation is allowed.

## Prompt Planning Flow

```text
music context analysis
-> cue sheet
-> vocal policy
-> language/culture policy
-> Lyria Pro prompt plan
-> negative prompt
-> credit estimate
-> approval
-> future Lyria Pro generation job
-> generated track analysis
-> music QA
-> mix/ducking plan
-> project asset storage
```

RP-AUDIO-05 implements the local/mock prompt planning step only. It creates Lyria Pro prompt plans, timestamped structure, negative prompts, and validation warnings from SoundSync music cues without calling Lyria Pro or creating generation jobs.

## Cue-By-Cue Generation

Each cue should have its own Lyria Pro prompt plan. A long lifestyle, travel, documentary, or vacation edit may need multiple cues rather than one full-track prompt.

Cue prompt fields:

- cue ID
- duration
- cue role
- scene purpose
- genre family
- mood
- energy arc
- instrumentation
- vocal policy
- lyric language policy
- culture/location influence
- speech-safety requirement
- intro/build/drop/resolve notes
- loop or ending requirement
- negative prompt
- generated asset requirements

## Example Prompt Shapes

### Calm Real Estate Walkthrough

```text
Create a 60-second instrumental-only premium background bed for a calm real estate walkthrough. Soft piano, warm pads, subtle pulse, no vocals, no lyrics, no aggressive drums. Start minimal for the intro, slowly build during the property reveal, then resolve softly for the closing. Designed to sit under spoken voice with room for dialogue.
```

Negative prompt:

```text
No vocals, no lyrics, no loud drums, no harsh synth lead, no busy melody, no stock corporate feel, no abrupt ending, no audio artifacts.
```

### Lake Como-Style Travel Montage

```text
Create a 35-second premium European lifestyle montage cue for a luxury lake vacation scene. Elegant modern cinematic pop with warm piano, soft percussion, tasteful lounge texture, gentle movement, and a relaxed but stylish feel. Allow only soft non-dominant vocal texture if there is no speech in this cue. Build during boat and scenic shots, then resolve into a soft transition.
```

Negative prompt:

```text
No copied melody, no stereotypical accordion, no overpowering vocals, no aggressive club drums, no comedic travel music, no harsh transitions, no copyrighted reference imitation.
```

### Dialogue Bed

```text
Create a 45-second instrumental dialogue bed for a lifestyle vlog conversation. Warm, low-energy, minimal, soft pads and light acoustic texture. No vocals, no lyrics, no vocal chops. Leave space for speech and natural ambience. Maintain a steady bed that can duck cleanly under dialogue.
```

Negative prompt:

```text
No lead melody, no vocals, no lyrics, no loud percussion, no frequency masking in the voice range, no distracting rhythm changes.
```

## Lyrics And Instrumental Policy

Default: instrumental-only for speech-heavy sections.

Lyrics are allowed only when:

- the user explicitly asks for lyrics
- the cue has no important speech
- the cue is an intro before dialogue starts
- the cue is a montage
- the cue is an outro
- the cue is a cinematic chapter transition
- music is intentionally the focus

For important speech:

- no lyrics
- no lead vocals
- no distracting vocal chops
- voice-first mix
- ducking-ready arrangement

## Language And Culture-Aware Prompts

Lyria Pro prompts may include language/culture-aware style only when supported by project context.

Inputs:

- transcript language
- user request
- setting/location
- audience
- reference music DNA
- platform
- scene purpose

Rules:

- avoid stereotypes
- do not force cultural music from location alone
- do not copy reference tracks or artist identity
- use modern, tasteful, context-aware descriptions
- lyrics in a local language should be limited to speech-free cues unless explicitly approved

## Generated Music As Project Assets

Future generated tracks become project assets first. Store:

- provider: Lyria Pro
- model
- prompt
- negative prompt
- generation date
- project ID
- edit plan ID
- cue ID
- generated asset ID
- storage path
- duration
- genre
- mood
- energy
- language
- vocal policy
- instruments
- BPM
- key
- loudness
- loopable
- speech-safe
- QA status
- license/provenance notes
- export usage records
- reuse approval status

Do not store real provider keys.

## QA Before Use

Generated music must pass QA before it can be used in a preview or export.

Minimum QA:

- no unwanted lyrics under voice
- speech-safe arrangement
- correct duration or loopability
- clean ending
- no obvious artifacts
- context fit
- culture/language fit
- reference DNA match without copying
- user instruction compliance

## Future Worker Integration

Future Lyria Pro generation should run in a secure backend or worker environment.

Worker boundary:

- load cue sheet, prompt plan, edit plan, and credit reservation by ID
- load Lyria Pro credentials from Secret Manager or secure runtime
- call Lyria Pro only after approval and reservation
- write generated asset metadata back to Supabase
- run generated track analysis and QA
- emit job events

The Vite frontend must never call Lyria Pro directly.

## Explicit Non-Goals

This architecture does not:

- call Lyria Pro
- add API keys
- add Google Cloud calls
- define real prices
- create migrations
- render video
- integrate Stripe
- build real uploads
- build mobile screens
