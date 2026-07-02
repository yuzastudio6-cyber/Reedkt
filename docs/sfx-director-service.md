# Mock SFX Director Service

## Purpose

RP-SFX-04 adds a mock-only SoundSync SFX Director service layer. It plans whether SFX should exist, what edit layer each sound supports, which timing anchor it should use, how subtle the volume should be, and which future provider route is recommended.

It does not generate sounds, build provider prompts, call Mirelo, call MMAudio, connect to Supabase, upload files, deploy Google Cloud, render media, or create UI.

## Planning Flow

The mock flow is:

`edit context -> SFX opportunities -> decision state -> target layer -> source-footage policy -> timing anchor -> volume profile -> provider route -> next step`

The RP-SFX-04 result stops at `create_sfx_prompt_plans`, which is the RP-SFX-05 handoff.

RP-SFX-05 adds mock provider-specific prompt plans for Mirelo, MMAudio, and internal library search, still without provider calls or generation.

RP-SFX-06 adds the mock timing handoff after prompt planning: duration targets, mock waveform/transient analysis, trim windows, hit alignment, frame-aware placement, and timing validation before the future mix planner.

RP-SFX-07 adds mock volume, mix, ducking, EQ, stereo, reverb, room-match, and mix-validation planning before the future SFX QA step.

## Decision States

- `needed`: key signature, reveal, montage, bridge, or Real Motion moment would feel incomplete without sound.
- `optional`: subtle polish may help but silence is still acceptable.
- `not_needed`: clean voice, ambience, music, or simple cuts already work.
- `avoid`: SFX would hurt tone, speech clarity, seriousness, or user intent.
- `needs_user_confirmation`: source-footage repair, full sound design, or cost/tone risk needs explicit approval.

## Edit-Layer First

The service plans SFX for ReeditPro-created edit layers by default:

- transitions
- title and chapter cards
- Graphic Design / VisualExplain reveals
- Stroke Motion draw, morph, and completion moments
- Real Motion object entry, movement, and settle moments
- CTA reveals
- selected montage hits
- soft ambient bridges

It does not add fake footsteps, doors, cars, water, plates, clothing, crowds, or random ambience by default.

## Source-Footage Boundary

Source-footage-style SFX is allowed only when the user asks for full sound design, original audio is missing, source footage is silent B-roll, ambience needs repair, Real Motion needs realistic support, or there is another explicit professional reason.

Otherwise, the service records `edit_layer_only_default` or `avoid_source_action_sfx`.

## Timing Anchors

RP-SFX-04 recommends anchors only. RP-SFX-06 turns those anchors into mock trim and hit-alignment metadata without processing real audio.

Examples:

- transition -> `cut`
- title card -> `title_reveal`
- chapter card -> `chapter_card_reveal`
- Graphic Design -> `graphic_reveal`
- Stroke Motion -> `stroke_motion_start`, `stroke_motion_completion`, or `stroke_motion_morph`
- Real Motion -> `real_motion_object_enter` or `real_motion_object_settle`
- montage hit -> `music_beat`
- CTA -> `cta_reveal`

## Volume Policy

SFX remains voice-first and subtle by default.

- speech present -> duck under voice
- serious/faith/teaching -> `whisper` or no SFX
- luxury/real estate -> `premium_soft`
- lifestyle/vacation -> `subtle_polish` or `standard_social`
- fitness/high-energy -> `standard_social` or rare `impact`
- Stroke Motion -> `subtle_polish`
- Real Motion -> `premium_soft` or `subtle_polish`

## Provider Routing

Provider routing is planning metadata only.

- Basic/Pro: internal library first, MMAudio V2 for cheap draft/fallback, Mirelo only for important approved moments.
- Signature/Premium: Mirelo SFX V1.5 for key production SFX, internal library for common cues, MMAudio V2 for draft or video-synced helper work.
- No SFX remains a valid provider route.

No route calls a provider or reads credentials.

## Mock Flows

`runMockLakeComoSFXPlanningFlow` demonstrates luxury lifestyle planning:

- coming-up teaser title hit
- soft transition whoosh
- chapter card soft hit
- boat or movement montage accent
- food/social ambience bridge
- outro resolve hit
- avoided fake water, footsteps, and dialogue-covering SFX

`runMockNoSFXPlanningFlow` demonstrates serious/faith restraint:

- most SFX are avoided or not needed
- no loud hits
- no transition whooshes under teaching
- voice clarity stays first

`runMockSignatureSFXPlanningFlow` demonstrates signature support:

- Stroke Motion draw sound
- optional/needed edit-layer SFX
- Mirelo as future production route
- MMAudio as draft/fallback route

## RP-SFX-08 QA Handoff

RP-SFX-08 adds mock QA scoring, issue generation, regeneration decisions, adjustment decisions, future library replacement recommendations, remove-SFX decisions, and chat-ready QA summaries. SFX must pass QA before preview/export, and no-SFX remains a valid professional result.

## RP-SFX-09 Library Growth Handoff

RP-SFX-09 adds mock generated SFX library growth: internal library search, project-only asset decisions, usage records, provenance review, reuse policy, candidate evaluation, usage learning, and chat-ready library summaries. Generated SFX remains project-only unless QA, privacy, provenance, license, and metadata checks support broader reuse.

## RP-SFX-10 Chat UI Handoff

RP-SFX-10 displays the mock SFX flow inside the chat-native editor: director plan, event cards, provider route, prompt preview, timing/trim, mix/ducking, QA, library candidate, credit estimate, progress placeholder, and revision options. The UI keeps technical details collapsed by default and does not create a separate sound dashboard.

## RP-SFX-11 Worker Handoff

RP-SFX-11 adds the mock worker skeleton after chat approval. It enforces edit-plan approval, credit approval, credit reservation, provider route, prompt plan, and generation request gates before simulating an internal-library match or mock Mirelo/MMAudio output, then runs timing, mix, QA, usage, and library-growth metadata.

## Mock-Only Limits

RP-SFX-04 creates service contracts, deterministic mock records, scenarios, and planning summaries only. RP-SFX-05 adds mock prompt adapters. RP-SFX-06 adds mock timing, trim, and hit-alignment metadata. RP-SFX-07 adds mock mix/ducking metadata. RP-SFX-08 adds mock QA and regeneration decisions. RP-SFX-09 adds mock library-growth metadata. RP-SFX-10 adds chat-native mock display only. RP-SFX-11 adds a mock worker skeleton only. Real provider integration, real audio processing, rendering, uploads, real library promotion, and database persistence are later milestones.
