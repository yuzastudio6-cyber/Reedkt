# SoundSync Music Intelligence

## Purpose

SoundSync Music Intelligence is ReeditPro's professional music supervision layer. It decides what music belongs in an edit before any custom music is generated, reused, trimmed, looped, ducked, mixed, rendered, or stored.

This is architecture only. It does not create Supabase migrations, connect to Supabase, add API keys, call Google APIs, integrate Lyria Pro, integrate Stripe, deploy Google Cloud workers, upload files, render video, build mobile screens, or generate real music.

## Product Rule

ReeditPro must not pick random background music.

The music system must analyze the video, story, scene setting, user intent, transcript, language/culture context, platform, pacing, reference DNA, speech density, ambience, and signature-system timing before it creates a music plan.

Music generation remains approval-gated and credit-gated:

```text
video analysis
-> music context analysis
-> music need decision
-> single-track or multi-cue decision
-> language/culture/style decision
-> lyrics vs instrumental decision
-> cue sheet
-> Lyria Pro prompt plan
-> credit estimate
-> user approval
-> future generation job
-> music QA
-> mix/ducking plan
-> render
-> preview
-> store generated track as project asset
-> optional future library promotion
```

Sometimes the best music decision is no music. Sometimes natural ambience is stronger than background music.

## Core Modules

### 1. Video Music Context Analyzer

Reads the project goal, user request, transcript, source sequence map, recommended edit structure, edit plan segments, target platform, edit level, reference DNA, and existing audio observations.

Outputs:

- video topic
- story purpose
- speech density
- scene types
- pacing needs
- emotional arc
- signature-system timing needs
- music risk notes

### 2. Scene and Setting Detector

Identifies where and how each scene happens: city, beach, home, office, property tour, boat, restaurant, classroom, faith setting, product demo, podcast, travel montage, or dialogue moment.

Outputs:

- setting/location hints
- scene purpose
- ambience value
- motion energy
- natural sound moments to preserve
- chapter/title-card opportunities

### 3. Language/Culture Music Context Analyzer

Uses transcript language, visible setting, user intent, audience, reference DNA, and project context to decide whether a cultural or language-aware style is useful.

Rules:

- Do not force cultural music from location alone.
- Avoid lazy stereotypes.
- Use culture-aware direction only when the scene, audience, transcript, reference, or user request supports it.
- Never copy reference tracks, melodies, lyrics, or copyrighted music.

Examples:

- Paris or French lifestyle: French indie pop, French electro-lounge, modern chanson-inspired pop, soft house, cafe ambience, tasteful French vocals during no-speech montage only.
- Lake Como or luxury Italy vacation: elegant European cinematic pop, warm acoustic guitar, soft orchestral/piano, modern romantic travel bed, tasteful lounge, light vocals only when no speech.
- Japan city vlog: city-pop inspired, jazzy hip-hop, lo-fi, clean electronic, soft J-pop-inspired instrumental.
- Beach or tropical vacation: tropical house, Afrobeat, dancehall, reggaeton, Latin pop, acoustic summer pop when supported by scene and audience.

### 4. Music Need Decider

Chooses one of:

- no music
- preserve ambience only
- subtle bed
- dialogue bed
- montage driver
- intro/outro cue
- multi-cue soundtrack
- premium custom soundtrack

Inputs include user preference, speech density, ambience quality, story beats, edit level, platform, and credit preference.

### 5. Single Track vs Multi-Cue Decider

One track is suitable for short, simple, consistent edits. Multi-cue planning is important for lifestyle, travel, vacation, vlog, documentary, long-form, faith, education, and mixed-scene projects.

Common cue roles:

- coming-up teaser
- intro arrival
- dialogue bed
- montage
- chapter/title card transition
- food/social moment
- emotional bridge
- outro resolve

### 6. Music Cue Sheet Planner

Creates structured cue records before generation. Each cue should include:

- cue ID
- start time
- end time
- scene purpose
- cue role
- mood
- genre family
- energy
- tempo/BPM target
- vocal policy
- language policy
- culture/location influence
- instrumentation
- Lyria Pro prompt
- negative prompt
- mix strategy
- ducking strategy
- ambience relationship
- SFX relationship
- signature-system relationship
- loop/fade/crossfade notes
- QA status
- credit impact

### 7. Lyrics/Vocal Policy Decider

Default rule: if there is spoken dialogue, narration, teaching, podcast audio, or important voice, generate instrumental-only music unless the user explicitly asks for lyrics.

Speech-heavy sections require:

- no lyrics
- no lead vocal
- no distracting vocal chops
- no melodies that fight the voice
- voice-first ducking

Lyrics may be appropriate for:

- intro before talking starts
- montage with no speech
- travel/lifestyle B-roll
- outro
- cinematic chapter transition
- user-requested lyrical song
- scene where music is the focus

### 8. Genre/Mood/Energy Selector

Maps context to a professional music direction without overfitting or stereotyping.

The selector should consider:

- video category
- platform
- edit level
- user request
- emotional arc
- transcript topic
- scene setting
- language/culture context
- reference music DNA
- speech safety
- credit budget

### 9. Lyria Pro Prompt Builder

Builds detailed music briefs for future Lyria Pro generation. Prompts should describe duration, cue role, genre, mood, instrumentation, energy arc, speech-safety, vocal policy, language policy, transition behavior, and ending.

Example:

```text
Create a 60-second instrumental-only premium background bed for a calm real estate walkthrough. Soft piano, warm pads, subtle pulse, no vocals, no lyrics, no aggressive drums. Start minimal for the intro, slowly build during the property reveal, then resolve softly for the closing. Designed to sit under spoken voice with room for dialogue.
```

### 10. Negative Prompt Builder

Creates avoid rules for the music cue.

Common negative prompt elements:

- no vocals under speech
- no lyrics
- no aggressive drums
- no harsh synth leads
- no busy lead melody
- no cheap stock music feel
- no cultural stereotypes
- no copyrighted melody imitation
- no abrupt ending
- no artifacts
- no distorted low end

### 11. Music Generation Job Planner

Creates future job intent only. It should reference IDs, not raw prompts alone.

Future job inputs:

- project ID
- chat session ID
- edit plan ID
- credit estimate ID
- credit reservation ID
- music cue sheet ID
- reference music DNA ID
- Lyria Pro prompt plan ID
- output asset requirements

The job must not run until the edit plan, music plan, credit estimate, and credit reservation are approved.

### 12. Generated Track Analyzer

After future generation, analyzes the generated track before it can be used.

Outputs:

- duration
- BPM
- key
- loudness
- energy curve
- loopability
- speech-safety score
- vocal/lyrics detection
- artifact notes
- cultural fit notes
- cue alignment notes
- metadata tags

### 13. Music QA Engine

Validates whether music is suitable for the edit.

Checks:

- fits video context
- fits scene setting
- fits culture/language context
- no unwanted lyrics under voice
- not too loud under speech
- no harsh frequencies
- no distracting lead melody
- energy fits scene
- tempo fits edit pacing
- transition points work
- ending resolves cleanly
- loop points are clean
- not too generic
- not culturally mismatched
- no obvious artifacts
- safe for dialogue
- safe for platform/export
- matches user instructions
- matches reference DNA without copying

### 14. Music Mix/Ducking Planner

Creates the future mix strategy.

Fields:

- music volume range
- ducking strategy
- voice-first priority
- intro fade
- outro fade
- cue crossfade
- beat sync points
- ambient bridge
- SFX relationship
- silence moments
- no-music zones
- dialogue priority zones
- loudness target

### 15. Music Library Promotion System

Generated music becomes a project asset first. After QA and terms review, strong tracks can become internal library candidates.

Promotion states:

- project_only
- qa_passed
- reuse_review_needed
- library_candidate
- approved_for_internal_library
- rejected_for_reuse

Do not assume every generated track can be reused across users until provider terms, user permissions, and ReeditPro policy confirm it.

### 16. Reference Music DNA Analyzer

Studies reference videos without copying music.

Extracts:

- cue boundaries
- number of cues
- genre/mood per cue
- lyrics vs instrumental moments
- intro behavior
- montage behavior
- dialogue ducking behavior
- chapter/title-card audio behavior
- transition SFX
- ambience usage
- room tone usage
- music drop/rise/resolve moments
- pacing support
- why the music works
- adaptation rules
- what not to copy

## Universal Music Taxonomy

### Genre Families

- cinematic
- orchestral
- ambient
- pop
- indie pop
- French pop
- Italian-inspired pop
- hip-hop
- trap
- lo-fi hip-hop
- R&B
- soul
- gospel-inspired
- rock
- acoustic
- folk
- jazz
- electronic
- house
- tropical house
- Afrobeat
- Latin
- reggaeton
- dancehall
- reggae
- country
- corporate
- luxury lounge
- documentary
- faith / reflective
- travel vlog
- lifestyle vlog

### Mood

- calm
- emotional
- hopeful
- luxury
- stylish
- romantic
- playful
- funny
- serious
- cinematic
- premium
- energetic
- clean
- educational
- mysterious
- dramatic
- relaxed
- warm
- inspirational

### Energy

- very low
- low
- medium-low
- medium
- medium-high
- high
- intense

### Cue Role

- no music
- subtle bed
- dialogue bed
- intro hook
- coming-up teaser
- montage driver
- travel movement
- chapter transition
- emotional support
- premium polish
- comedic accent
- food/social warmth
- sales momentum
- outro resolve

### Vocal Policy

- no vocals
- instrumental only
- vocal texture only
- vocal chops only
- soft hook vocals
- full lyrical song
- lyrics allowed only when no speech
- intro/outro vocals only

### Speech Safety

- safe under voice
- needs ducking
- not safe under voice
- montage only
- intro/outro only

## On-The-Fly Generation Strategy

ReeditPro can generate music on the fly because each project has different intent, footage, mood, setting, language/culture context, and reference DNA.

Recommended behavior by edit level:

- Basic Edit: generate simple instrumental music only if needed.
- Pro Edit: generate a custom cue if music improves the edit.
- Signature Edit: generate music that supports story beats and signature timing.
- Premium Signature: generate multiple options or more complex multi-cue soundtracks.

Generated music should become a project asset first. It should be tagged, QA'd, linked to provenance, used in the project only, and promoted to a future ReeditPro library only after review.

## SFX Strategy

SFX is separate from music.

Recommended launch approach:

- buy or commission a ReeditPro-owned SFX pack
- store license/provenance
- use SFX only when it improves the edit
- avoid loud SFX under speech
- avoid random sound effects

SFX can support:

- Stroke Motion draw sounds
- Graphic Design reveals
- Real Motion object movement
- transitions
- chapter/title cards
- comedic moments
- lifestyle montage
- ambient bridges

## Generated Music Storage And Provenance

Generated tracks should store:

- provider
- model
- prompt
- negative prompt
- generated date
- project ID
- edit plan ID
- cue ID
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
- speech safe
- QA status
- used in export
- license/provenance notes
- approved for reuse
- approved for library
- storage path
- generated asset ID

Do not store real provider keys, service role keys, signed URLs, or raw secrets.

## Credit And Approval Gate

Music generation must respect the ReeditPro credit system.

Rules:

- show the music estimate before generation
- music generation can be a credit line item
- multiple cues may cost more
- premium multiple-option generation may cost more
- generation must not start before approval
- failed ReeditPro generation can be refunded according to the credit system

Example estimate categories:

- single simple cue
- multi-cue lifestyle soundtrack
- premium custom soundtrack
- regeneration
- music QA
- mix/ducking
- render support

This document does not define real pricing logic.

## Chat-Native UI Behavior

Music planning appears inside chat. Inline cards can include:

- Music Context Analysis
- Music Cue Sheet
- Lyria Prompt Preview
- Music Credit Estimate
- Music Generation Progress
- Music QA Result
- Music Revision Options

Example AI message:

```text
I found this is a lifestyle/vacation edit with multiple scene moods. I recommend 3 music cues: an intro teaser, an instrumental dialogue bed, and a French-inspired montage cue. Lyrics will only appear in montage sections where there is no speech.
```

Useful chat actions:

- Approve music plan
- Instrumental only
- Allow lyrics in montage
- Lower music cost
- Generate one cue only
- Regenerate cue
- Use less cultural style
- Make it more cinematic
- Make it more lifestyle
- Keep ambience only

## Future Google Cloud Worker Connection

Future SoundSync workers should connect through IDs and trusted records:

- Cloud Run API receives authenticated orchestration requests.
- Pub/Sub or Cloud Tasks can enqueue music job IDs.
- Worker loads project, edit plan, cue sheet, reference DNA, credit reservation, and prompt plan from Supabase.
- Worker loads Lyria Pro credentials from Secret Manager or secure runtime only.
- Worker writes generated asset metadata, QA, mix plan, events, and preview readiness back to Supabase.

No frontend client should call Lyria Pro directly. No provider secret should be stored in the repo or database.
