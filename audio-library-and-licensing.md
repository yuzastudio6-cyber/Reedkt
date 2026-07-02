# Audio Library And Licensing

## Purpose

This concise planning note supports RP-SFX-09 generated SFX library growth. It defines conservative mock rules for provenance, reuse, attribution, and terms review before any generated audio can become reusable.

This is documentation only. It does not confirm real provider terms, grant reuse rights, store secrets, call providers, connect to Supabase, or promote real assets.

## Default Rule

Generated audio is project-only until QA, privacy, provenance, and license review prove a broader reuse scope is safe.

Do not claim generated SFX can be reused across all users unless provider terms and provenance explicitly allow it.

## Provenance Fields

Future generated audio records should track:

- provider
- model
- prompt and negative prompt
- generation date
- project/workspace context
- license provenance ID
- commercial allowed
- ads allowed
- client work allowed
- cross-user reuse allowed
- attribution required
- terms review status
- proof/reference path when available

## Terms Review

Use `requires_terms_review` when:

- provider reuse terms are unclear
- provenance metadata is missing
- cross-user reuse is not confirmed
- attribution requirements are unknown
- commercial, ads, or client-work use is not confirmed

## Reuse Limits

Keep audio project-only, workspace-only, or blocked from reuse when it includes:

- private event context
- user voice or identity
- client-specific brand motion
- custom brand sound
- confidential business content
- restricted reference material
- source-action SFX added without explicit full sound design

## Library Approval

Internal library approval requires QA pass, general-purpose usefulness, complete tags, low privacy risk, low reference-copy risk, and approved provenance. RP-SFX-09 only models this as mock metadata.

This document defines how ReeditPro should treat generated music, future internal music library growth, SFX packs, user-uploaded audio, provenance, and export usage.

This is architecture only. It does not create storage buckets, connect to Supabase, add migrations, call providers, generate audio, or define legal terms.

## Generated Music Project Asset Strategy

At launch, ReeditPro may not have a large music library. The system should grow from project-specific generated music.

Flow:

```text
generate music per project
-> store as project asset
-> analyze and tag it
-> QA it
-> use it in that project
-> optionally mark as library candidate
-> promote only approved tracks later
```

Generated tracks are not automatically reusable across all users. Reuse requires provider terms review, ReeditPro policy, QA approval, and any required user or workspace permission.

## Project Asset Metadata

Generated music assets should track:

- provider
- model
- generated date
- project ID
- workspace ID
- edit plan ID
- music cue ID
- generation request ID
- generated asset ID
- prompt
- negative prompt
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
- used in preview
- used in export
- license/provenance notes
- approved for reuse
- approved for library
- storage path

No raw secrets, API keys, signed URLs, or service role keys should be stored.

## Future Internal ReeditPro Library

Promotion should be deliberate.

Recommended states:

- project_only
- qa_passed
- terms_review_needed
- reuse_review_needed
- library_candidate
- approved_for_internal_library
- rejected_for_reuse

Library candidates should be tagged by:

- genre
- mood
- energy
- cue role
- vocal policy
- language
- speech safety
- BPM
- loopability
- scene type
- platform fit
- signature-system fit

## SFX Bought Or Commissioned Strategy

SFX should be treated differently from generated music.

Recommended launch approach:

- buy or commission a ReeditPro-owned SFX pack
- store license/provenance
- classify SFX by use case
- use SFX only when it improves the edit
- avoid loud SFX under speech
- avoid random sound effects

Useful SFX categories:

- transition whooshes
- soft hits
- title-card accents
- Stroke Motion draw sounds
- Graphic Design reveal sounds
- Real Motion object movement
- comedic accents
- ambient bridges
- lifestyle montage accents

## User-Uploaded Music Warning

User-uploaded music should be treated as user-provided media, not ReeditPro-owned library content.

The system should warn that:

- users are responsible for rights to uploaded tracks
- uploaded music may not be safe for all platforms
- ReeditPro should not promote uploaded user music into the internal library
- export records should preserve source/provenance notes

## Export Usage Records

Every preview or export that uses music/SFX should be able to record:

- render ID
- export ID
- generated asset ID
- cue ID
- track source
- provider/model
- license/provenance note
- user/workspace approval
- platform/export target
- final mix usage

## Provider Metadata

Provider metadata should identify the generator or source without exposing secrets.

Allowed:

- provider name
- model name
- generation request ID
- prompt summary
- secret reference label
- provenance notes

Not allowed:

- API keys
- OAuth tokens
- service role keys
- raw credentials
- long-lived signed URLs

## Reuse Policy

Do not assume every generated track can be reused across users.

Future reuse requires:

- provider terms review
- ReeditPro legal/product policy
- QA approval
- provenance record
- user/workspace permissions if applicable
- internal library approval state

