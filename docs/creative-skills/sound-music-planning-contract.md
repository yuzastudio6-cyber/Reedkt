# Sound/Music Planning Contract

## Purpose

This document defines the SoundSync, music, SFX, ambience, room tone, ducking, and audio-support-specific planning contract for future ReeditPro sound skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, audio generation code, music generation code, SFX generation code, audio mixing code, Lyria integration, media analysis code, package changes, Supabase connections, SQL, credentials, runtime execution, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It references [transition-planning-contract.md](transition-planning-contract.md) where sound supports cuts, sound bridges, ambient bridges, beat-aligned cuts, silence, or transition SFX. It references [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) where sound supports visual overlays without increasing visual/audio density too far. It references [graphic-design-planning-contract.md](graphic-design-planning-contract.md) where sound supports graphic reveal moments, proof cards, title cards, or CTA cards. It references [motion-design-planning-contract.md](motion-design-planning-contract.md) where sound supports motion timing, rhythm, beat sync, or emphasis. It references [three-d-visual-planning-contract.md](three-d-visual-planning-contract.md) where sound supports 3D objects, hero reveals, object passes, or premium spatial moments. It references [b-roll-planning-contract.md](b-roll-planning-contract.md) where source audio, ambience, room tone, or voiceover continues under B-roll. It references [caption-planning-contract.md](caption-planning-contract.md) where speech clarity, important phrases, and caption readability must be protected.

This document defines sound/music-specific fields and rules that future docs, types, schema, workers, audio systems, provider plans, render plans, and QA systems must follow if SoundSync/music/SFX skills are eventually implemented.

## SoundSync And Music Doctrine

SoundSync/music/SFX are not random background audio.

Music, SFX, ambience, room tone, ducking, and silence must be planned. Sound should support story, mood, timing, clarity, emotion, visual rhythm, authenticity, or professional polish. Sound should not be a generic bed that fights speech, buries the speaker, copies a reference, makes the edit feel template-like, or adds loud whooshes and hits under important words.

Speech clarity wins over music and SFX. Lyrics under important speech are not allowed by default unless explicitly approved. Captions do not replace speech clarity; if viewers are reading important captions, the sound plan should not distract them from meaning.

Reference music DNA can guide mood, pacing, instrumentation family, cue structure, and energy, but it must not copy exact tracks, melodies, lyrics, stems, copyrighted audio, creator identity, or protected distinctive style. Generated music and generated SFX remain future-gated, credit-aware, approval-gated, provider/rights constrained, and outside this docs-only prompt.

A professional edit may need no music, ambience only, repaired room tone, silence, a subtle bed, or rich SoundSync. Premium sound is not the same as more sound. Every sound must have a role.

Core principle:

"Every sound must know whether it supports speech, emotion, rhythm, transition, visual action, ambience, or silence."

## Universal And Cross-skill Inheritance

Every `SoundMusicSkillPlan` inherits the universal skill planning envelope from RP-SKILLS-02:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Audio relationship envelope.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

Sound/music references RP-SKILLS-03 when audio supports transitions:

- Transition SFX.
- Ambient bridges.
- Sound bridges.
- Beat-aligned cuts.
- Silence or room tone around cuts.

Sound/music references RP-SKILLS-04 when audio supports visual overlays:

- Overlay entrance or exit sound support where useful.
- Visual density and sound density relationship.
- Avoiding audio clutter when the frame is already visually dense.

Sound/music references RP-SKILLS-05 when audio supports graphics:

- Graphic reveal SFX.
- Proof card, CTA card, and title card restraint.
- Avoiding sounds that make claim/CTA reading harder.

Sound/music references RP-SKILLS-06 when audio supports motion:

- Motion design timing.
- Beat sync.
- Emphasis SFX.
- Rhythm and repetition control.

Sound/music references RP-SKILLS-07 when audio supports 3D:

- 3D object entrance, exit, pass, land, or interaction sound.
- 3D hero reveal sound.
- Premium sound cost and approval behavior.

Sound/music references RP-SKILLS-08 when audio relates to B-roll:

- B-roll source audio.
- Ambience and room tone continuity.
- Voiceover under B-roll.
- Audio bridges between source and B-roll.

Sound/music references RP-SKILLS-09 when audio relates to captions:

- Speech clarity.
- Caption readability.
- Quote, claim, and CTA clarity.
- Avoiding audio distractions during caption-heavy segments.

This sound/music contract adds:

- Music role.
- SFX role.
- Ambience/room tone role.
- Cue planning.
- Energy curve.
- Beat map.
- Ducking strategy.
- Lyrics policy.
- Reference music DNA safety.
- Source audio behavior.
- Future generated/licensed music boundary.
- Sound-specific QA.

Do not duplicate the full universal, transition, overlay/compositing, graphic design, motion design, 3D visual, B-roll, caption, or StoryTiming contracts except when referencing inheritance.

## Sound Role Family

These roles are guidance, not hard-coded execution. A future planner should choose a role because it fits the exact moment, not because an edit needs constant sound.

| Role | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `no_music` | Intentional absence of music. | Clean speech, serious testimony, user says no music. | Montage needs rhythm or user asks for music. | `none` | Valid professional decision. |
| `silence_as_design` | Silence used for emphasis. | Emotional pause, impact beat, faith/documentary restraint. | Social montage needing energy. | `none` | Silence can be the strongest sound choice. |
| `ambience_only` | Natural ambience without music bed. | Vlog, property, documentary, location authenticity. | Ambience is noisy or distracting. | `none` / `low` | Keeps edit grounded. |
| `room_tone_preservation` | Preserve or bridge natural room tone. | Interviews, podcasts, jump cuts, property walkthroughs. | Room tone is unusably noisy. | `none` / `low` | Prevents amateur audio jumps. |
| `voice_first_cleanup_support` | Sound plan protects voice clarity. | Talking-head, podcast, education, testimonial. | Music/SFX-led montage. | `low` | Does not implement cleanup runtime. |
| `subtle_music_bed` | Quiet instrumental support. | Business, education, clean social. | Dense speech or user says no music. | `low` |
| `premium_mood_bed` | Refined mood support. | Luxury, real estate, cinematic, testimonial. | Fast social or joke edit. | `medium` |
| `cinematic_score_bed` | Score-like emotional support. | Story arc, reveal, cinematic travel. | Dense teaching or claim-heavy pitch. | `medium` / `high` |
| `energetic_social_bed` | Rhythm-focused music bed. | Shorts, Reels, TikTok, high-retention clips. | Serious emotion or caption-heavy proof. | `low` / `medium` |
| `montage_music` | Music drives a B-roll/montage section. | Travel, lifestyle, launch, property montage. | Dialogue-heavy section. | `medium` |
| `chapter_or_title_cue` | Short cue for title/chapter. | Chapter cards, section changes, end slate. | Every transition. | `low` |
| `emotional_cue` | Music lift or settle for feeling. | Personal story, testimonial, transformation. | Manipulative tone or dense speech. | `medium` |
| `product_reveal_cue` | Sound supports product reveal. | Product demo, launch, hero reveal. | Product explanation needs quiet. | `medium` |
| `marketing_energy_cue` | Energy cue for offer/CTA. | Ads, promos, short campaign assets. | Unverified claims or sensitive CTA. | `medium` |
| `testimonial_trust_bed` | Quiet trust-oriented bed. | Case studies and testimonials. | Makes testimonial feel manipulated. | `low` / `medium` |
| `educational_low_distraction_bed` | Very low-distraction support. | Tutorials, courses, explainers. | Speech clarity is fragile. | `low` |
| `transition_sound` | Sound supporting a cut/transition. | Earned transition, scene bridge. | Automatic sound on every cut. | `low` / `medium` |
| `ambient_bridge` | Ambience bridges shots/scenes. | B-roll, location changes, room tone continuity. | Ambience source unknown or distracting. | `low` |
| `sound_bridge` | Audio carries across edit edge. | J-cut/L-cut, scene continuation. | Confusing source relationship. | `low` |
| `graphic_reveal_sfx` | Subtle SFX for graphic/card reveal. | Title, proof card, CTA, feature card. | Caption-heavy or speech-heavy moments. | `low` / `medium` |
| `motion_design_sfx` | SFX supports motion design. | Swipe, reveal, object move, emphasis. | Every animated element. | `low` / `medium` |
| `caption_emphasis_sfx` | Sound supports rare caption emphasis. | One major keyword or CTA. | Regular captions or quote captions. | `low` |
| `Stroke_Motion_draw_sfx` | Draw-on or line-trace SFX. | Stroke Motion reveal. | Repeated line sounds under speech. | `medium` |
| `Real_Motion_object_sfx` | Sound supports Real Motion object. | Approved realistic object movement. | Gimmicky realism or speech conflict. | `high` / `premium` |
| `three_d_object_sfx` | Sound supports 3D object. | Premium product breakout, 3D hero. | 3D visual does not need sound. | `high` / `premium` |
| `browser_app_ui_sfx` | Subtle UI interaction sound. | Safe screen/app demo. | Mock/unknown source implies false interaction. | `low` / `medium` |
| `riser` | Rising tension or build. | Reveal, transition, product launch. | Overused before every visual. | `low` / `medium` |
| `impact_hit` | Moment-defining hit. | Big reveal, final CTA, dramatic beat. | Under important speech. | `low` / `medium` |
| `soft_whoosh` | Soft movement/transition support. | Gentle transition or overlay. | Every transition. | `low` |
| `beat_sync_support` | Beat timing supports cuts/visuals. | Montage, social, product reveal. | Speech-led teaching. | `low` / `medium` |
| `generated_music_future` | Future generated music candidate. | Approved premium/custom cue later. | No approval, no credit estimate. | `high` / `premium` | Future-only. |
| `licensed_library_music_future` | Future licensed/library cue candidate. | Lower-cost future music selection. | Unknown rights. | `medium` | Future rights-aware lane only. |
| `reference_music_dna_influence_only` | Reference guides mood/energy only. | User shares reference music/video. | Copying exact music identity. | `low` / `medium` | Influence only. |

## Music Source And Rights Model

### Music Source Types

| Source type | Meaning | Rule |
| --- | --- | --- |
| `no_music_source` | No music source is used. | Valid for no-music, silence, room tone, and ambience-only plans. |
| `existing_project_audio` | Audio already in project media. | Preserve or adjust only under approved future audio rules. |
| `user_provided_audio` | User supplied music/audio asset. | Needs authorization and rights status. |
| `user_provided_reference_audio` | User supplied reference for inspiration. | Influence only unless rights are explicit. |
| `reference_music_dna_only` | Reference music guides mood/pacing. | Must not be copied. |
| `licensed_library_music_future` | Future licensed/library music candidate. | Future-only rights-aware lane. |
| `generated_music_future` | Future generated music candidate. | Requires credit, approval, provider terms, QA. |
| `Lyria_future` | Future Lyria candidate if later approved. | No integration in this prompt. |
| `internal_mock` | Mock/demo audio concept. | Not licensed proof or production asset. |
| `unknown_source` | Source is unknown. | Cannot be treated as safe. |
| `not_allowed` | Source is disallowed. | Do not use. |

### Rights And Provenance Status

| Status | Meaning | Rule |
| --- | --- | --- |
| `user_provided` | User supplied the audio. | Still needs authorization context. |
| `project_owned_or_authorized` | Project has rights/authorization. | Can be planned with QA and approval as needed. |
| `reference_only_do_not_copy` | Reference influence only. | Never copy track, melody, lyric, or protected identity. |
| `licensed_future_required` | Future license needed. | Do not execute now. |
| `generated_future_requires_provider_terms_review` | Future generated asset needs terms review. | Requires provider, credit, approval, QA, provenance. |
| `library_candidate_requires_review` | Potential reusable library asset. | Needs provenance and reuse review. |
| `unknown` | Rights/provenance unknown. | Cannot be safe or production-ready. |
| `not_allowed` | Not allowed. | Reject use. |

Rules:

- Do not copy reference music, melodies, exact tracks, lyrics, stems, or protected audio identity.
- Reference music DNA is guidance only.
- Generated music remains future-gated and approval-gated.
- Provider secrets must not be stored in docs, database rows, prompts, or code.
- Generated/project music assets should be project assets first.
- Library reuse requires QA, provenance, rights, and provider-terms review.
- Unknown source music cannot be treated as licensed or safe.
- This prompt does not integrate Lyria or any music provider.

## When To Use Music

Use music when:

- User requests music.
- A social/mobile edit benefits from rhythm or energy.
- A montage, travel, vlog, lifestyle, property, or B-roll sequence needs pacing.
- Product/marketing reveal needs emotional energy.
- Real estate/property tour needs premium mood.
- Testimonial or case study benefits from subtle trust bed.
- Education/explainer needs light support without distraction.
- Chapter, title, opening, or outro needs a cue.
- B-roll montage needs beat-driven rhythm.
- Transition rhythm needs a beat anchor.
- Emotional story beat benefits from controlled score.
- Visual hero moment needs a controlled music lift.
- Reference DNA suggests mood/energy without copying.

## When To Avoid Or Reduce Music

Avoid, silence, or reduce music when:

- User asks for no music.
- Speech-heavy section would become harder to follow.
- Serious emotional pause needs silence or room tone.
- Faith, documentary, testimonial, or trust-sensitive moment needs restraint.
- Dialogue clarity is poor.
- Captions require careful reading.
- Source ambience is more authentic.
- Lyrics would conflict with speech.
- Music feels generic, stocky, or template-like.
- Music energy conflicts with tone.
- Rights/source status is unclear.
- Credit budget does not support generated/custom music.
- Dense SFX, motion, overlays, graphics, 3D, or B-roll already create enough energy.
- Music would overpower product/process explanation.

## Music Role, Mood, And Energy Model

### Music Role Values

| Role | Meaning | Notes |
| --- | --- | --- |
| `none` | No music. | Valid professional choice. |
| `ambience_only` | Natural audio/ambience instead of music. | Useful for authenticity. |
| `bed` | Quiet music under speech or visuals. | Speech-safe and low-distraction. |
| `pulse` | Light rhythm support. | Avoid when it fights speech. |
| `montage_driver` | Music drives montage timing. | Best in low-speech sections. |
| `emotional_support` | Supports feeling without taking over. | Trust-sensitive. |
| `tension_builder` | Builds anticipation. | Use sparingly. |
| `release` | Resolves after reveal/tension. | Needs timing reason. |
| `chapter_marker` | Marks section/title. | Short cue. |
| `hero_reveal` | Supports major reveal. | Approval/credit aware. |
| `outro` | End-card or final resolve. | Avoid clashing with CTA speech. |
| `custom_multi_cue_arc_future` | Future multi-cue arc. | Future-only complex planning. |

### Mood Values

| Mood | Meaning |
| --- | --- |
| `clean` | Neutral, clear, unobtrusive. |
| `premium` | Refined, spacious, polished. |
| `cinematic` | Filmic, emotionally shaped. |
| `emotional` | Human, moving, supportive. |
| `energetic` | High momentum and rhythm. |
| `luxury` | Sophisticated, restrained, high-end. |
| `educational` | Low-distraction and clear. |
| `corporate` | Trustworthy, professional. |
| `playful` | Light, friendly, not serious. |
| `documentary` | Natural, grounded, restrained. |
| `faith_respectful` | Reflective, respectful, voice-first. |
| `suspenseful` | Tension-building. |
| `triumphant` | Uplift or payoff. |
| `calm` | Gentle, low energy. |
| `custom` | User/project-specific. |

### Energy Levels

| Energy level | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No music energy. | Silence, voice-only, room tone. | Edit may feel flat if montage needs rhythm. | Quiet testimonial pause. |
| `very_low` | Barely present support. | Premium, education, faith, documentary. | May be inaudible or pointless. | Soft ambience bed. |
| `low` | Subtle bed under speech. | Talking-head, corporate, property. | Can still mask weak speech. | Light instrumental under intro. |
| `medium` | Clear rhythm or mood. | Social, product demo, montage. | Can feel generic or busy. | Beat under B-roll montage. |
| `high` | Strong energy driver. | Fast social, ad, launch reveal. | Overpowers speech and captions. | Product reveal build. |
| `hero` | One major sonic peak. | Major reveal or finale. | Exhausting if repeated. | 3D hero reveal lift. |

## Documentation-only Pseudo-record: MusicCuePlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, provider code, generated music code, audio mixing code, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `cue_id` | Required | Stable planning identifier for the cue. | `music_cue_hook_001` |
| `cue_role` | Required | Music role for this cue. | `bed` |
| `cue_start_seconds` | Required | Planned cue start. | `0.0` |
| `cue_end_seconds` | Required | Planned cue end. | `18.5` |
| `duration_seconds` | Required | Planned duration. | `18.5` |
| `mood` | Required | Mood target. | `premium` |
| `energy_start` | Required | Starting energy level. | `very_low` |
| `energy_end` | Required | Ending energy level. | `low` |
| `energy_curve_summary` | Required | Energy movement. | `soft lift into product reveal` |
| `intro_strategy` | Required | How cue enters. | `fade in under room tone` |
| `outro_strategy` | Required | How cue exits. | `duck and fade before CTA speech` |
| `loop_or_extend_needed` | Optional | Whether future loop/extension is needed. | `false` |
| `beat_density` | Required | Beat activity level. | `low` |
| `speech_density_context` | Required | Speech context during cue. | `medium speech density` |
| `visual_context` | Required | Visual context. | `talking head with product B-roll` |
| `story_beat_anchor_id` | Optional | Related story beat. | `beat_product_reveal` |
| `transition_relationship` | Required | Relationship to transitions. | `no hit under cut; soft bridge only` |
| `B_roll_relationship` | Required | Relationship to B-roll. | `supports montage under voiceover` |
| `caption_relationship` | Required | Relationship to captions/readability. | `low distraction under dense captions` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `credit_impact` | Required | Credit impact category. | `low` |

## Documentation-only Pseudo-record: SoundTimingPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, beat-detection runtime, audio analysis runtime, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `beat_map_required` | Required | Whether a beat map is needed. | `true` |
| `beat_map_summary` | Required | Planned beat timing summary. | `soft downbeats align with B-roll cuts` |
| `beat_anchor_seconds` | Optional | Primary beat anchor time. | `3.2` |
| `downbeat_anchors` | Optional | Downbeat times. | `[3.2, 5.0, 6.8]` |
| `transition_beat_anchors` | Optional | Transition-related beat anchors. | `cut at 6.8s on soft downbeat` |
| `visual_hit_anchors` | Optional | Visual hit anchor times. | `product reveal at 9.4s` |
| `SFX_hit_anchors` | Optional | SFX hit anchor times. | `soft hit at 9.45s after phrase` |
| `music_cue_points` | Required | Music cue entry/exit/lift points. | `fade in 0.0s, lift 9.0s, fade 17.5s` |
| `speech_protection_windows` | Required | Time windows where speech must win. | `2.1-6.0, 11.0-15.0` |
| `silence_windows` | Optional | Planned silence moments. | `15.2-16.1 emotional pause` |
| `room_tone_windows` | Optional | Room tone windows. | `0.0-1.0 preserve source room tone` |
| `sync_precision_needed` | Required | Needed timing precision. | `phrase_level` |
| `timing_confidence` | Required | Confidence level. | `medium` |

## Documentation-only Pseudo-record: DuckingSpeechSafetyPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, audio processing, mixing automation, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `speech_priority` | Required | Priority of speech clarity. | `high` |
| `music_ducking_needed` | Required | Whether music should duck. | `true` |
| `ducking_depth_intent` | Required | Planned ducking amount concept. | `medium duck under narration` |
| `ducking_attack_intent` | Required | How quickly ducking begins. | `fast enough to protect first word` |
| `ducking_release_intent` | Required | How ducking releases. | `slow release after sentence` |
| `SFX_ducking_needed` | Required | Whether SFX must duck or avoid speech. | `true` |
| `speech_protection_windows` | Required | Important speech windows. | `protect 4.2-7.8` |
| `important_phrase_protection` | Required | Exact phrases to protect. | `protect "we doubled retention"` |
| `captions_readability_support` | Required | Relationship to caption reading. | `lower SFX during dense captions` |
| `lyrics_allowed` | Required | Whether lyrics are allowed. | `false` |
| `lyrics_policy` | Required | Lyrics policy value. | `instrumental_only` |
| `avoid_under_speech` | Required | Sound categories to avoid under speech. | `impact hits and vocal hooks` |
| `voice_clarity_risk` | Required | Speech clarity risk. | `medium` |
| `review_required` | Required | Whether review is required. | `false` |

Rules:

- Speech priority defaults high for dialogue, narration, podcast, education, testimonial, claims, quotes, and CTA sections.
- Lyrics are not allowed under important speech by default.
- SFX should not hit under important words.
- Captions and speech clarity are linked: if viewers are reading important captions, sound should not distract.

## SFX Planning Model

SFX should support exact moments. They should not be automatic.

| SFX family | What it is | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `none` | No SFX. | Voice-first, serious, subtle edits. | Earned visual hit needs support. | Valid professional choice. |
| `soft_whoosh` | Gentle movement sound. | Soft transitions, overlay entry. | Every transition. | Keep subtle. |
| `light_whoosh` | Slightly clearer movement sound. | Social transition, motion emphasis. | Premium restraint or dense speech. | Use sparingly. |
| `impact_hit` | Strong hit. | Major reveal or CTA. | Under important speech. | Save for strongest moments. |
| `gentle_hit` | Soft punctuation. | Title, chapter, low-energy reveal. | Emotional silence. | Avoid repetition. |
| `soft_draw` | Subtle drawn-line sound. | Stroke Motion. | Repeated under speech. | Keep low. |
| `click_or_tap` | Click/tap sound. | True UI interaction or product step. | Mock/unknown browser/app source. | Avoid false interaction. |
| `UI_chime` | Light UI feedback. | Approved app/demo moment. | Serious proof or unknown source. | Source status matters. |
| `riser` | Rising build. | Reveal, transition, launch. | Before every visual. | Needs payoff. |
| `downer` | Falling/settling sound. | Scene settle or end of reveal. | Fast social energy. | Use lightly. |
| `sub_boom` | Low impact. | Hero reveal. | Speech, small speakers, premium subtlety. | High fatigue risk. |
| `shimmer` | Light sparkle/shine. | Product beauty, premium reveal. | Serious testimony. | Can feel cheap if overused. |
| `sparkle` | Playful small shine. | Light creator/product moment. | Corporate, documentary, faith. | Tone-sensitive. |
| `paper_or_card` | Card/paper motion. | Graphic card reveal. | Dense caption/proof reading. | Must not distract. |
| `line_draw` | Line/arrow draw sound. | Stroke Motion, diagrams. | Every annotation. | Coordinate with motion. |
| `object_pass` | Object movement pass. | 3D or Real Motion pass. | Unapproved premium object sound. | Approval-aware. |
| `object_land` | Object settles/lands. | 3D/product object settle. | Speech or fragile trust moment. | Avoid heavy hits. |
| `mechanical` | Mechanism/machine sound. | Product/process support. | False product behavior. | Source/truth-sensitive. |
| `glass` | Glass/tinkling sound. | Luxury/product material. | Stereotyped luxury or distraction. | Material-aware. |
| `data_tick` | Data/UI tick. | Dashboard/data reveal. | Unverified dashboard/proof. | Avoid false precision. |
| `ambient_texture` | Background texture. | Mood/setting support. | Speech clarity risk. | Ambience-first. |
| `custom_future` | Future custom SFX. | Approved premium need later. | No credit/approval. | Future-only. |

## Documentation-only Pseudo-record: SFXPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, provider request, SFX generation, audio processing, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `sfx_role` | Required | SFX purpose. | `graphic_reveal_sfx` |
| `sfx_family` | Required | SFX family. | `soft_whoosh` |
| `sfx_start_seconds` | Required | Planned SFX start. | `6.2` |
| `sfx_end_seconds` | Required | Planned SFX end. | `6.7` |
| `timing_anchor_type` | Required | Timing anchor type. | `graphic_reveal` |
| `visual_skill_supported` | Required | Supported visual skill. | `graphic_design` |
| `transition_supported` | Optional | Supported transition. | `soft_push_transition` |
| `intensity` | Required | SFX intensity. | `low` |
| `volume_intent` | Required | Volume intent. | `quiet_under_music_bed` |
| `speech_safety` | Required | Speech safety behavior. | `avoid_key_phrase_window` |
| `ducking_needed` | Required | Whether ducking is needed. | `false` |
| `repetition_limit` | Required | Repetition limit. | `max_once_per_section` |
| `credit_impact` | Required | Credit impact category. | `low` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_notes` | Required | QA notes. | `check no hit under captioned CTA` |

## Documentation-only Pseudo-record: AmbienceRoomTonePlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, cleanup runtime, audio processing, mixing, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `ambience_role` | Required | Ambience purpose. | `room_tone_preservation` |
| `source_audio_used` | Required | Whether source audio is used. | `true` |
| `source_audio_muted` | Required | Whether source audio is muted. | `false` |
| `room_tone_preservation` | Required | Room tone preservation plan. | `preserve interview room tone under cuts` |
| `room_tone_bridge_needed` | Required | Whether a room tone bridge is needed. | `true` |
| `ambience_bridge_needed` | Required | Whether ambience bridge is needed. | `false` |
| `natural_sound_priority` | Required | Natural sound priority. | `high` |
| `noise_reduction_relationship` | Required | Relationship to cleanup/noise reduction. | `cleanup future-only; preserve naturalness` |
| `B_roll_source_audio_behavior` | Required | B-roll source audio behavior. | `mute cafe B-roll under narration` |
| `location_audio_context` | Optional | Location/audio context. | `quiet kitchen ambience` |
| `silence_preservation` | Required | Silence preservation behavior. | `preserve pause before testimonial payoff` |
| `authenticity_notes` | Required | Authenticity notes. | `natural room tone matters more than music` |
| `audio_discontinuity_risk` | Required | Discontinuity risk. | `medium` |
| `qa_notes` | Required | QA notes. | `check cuts for room tone jumps` |

Room tone often matters more than music in natural, documentary, faith, serious, testimonial, or property walkthrough content. B-roll source audio may be muted, preserved, or bridged depending on story and speech. Abrupt audio changes can feel amateur. This document does not implement cleanup or noise reduction runtime.

## Lyrics And Vocal Music Policy

| Lyrics policy | Meaning | Rule |
| --- | --- | --- |
| `instrumental_only` | Use no lyrics. | Default under dialogue, narration, teaching, podcast, testimonial. |
| `lyrics_not_allowed` | Lyrics are explicitly disallowed. | Reject lyric/vocal-hook concepts. |
| `lyrics_allowed_user_approved` | User explicitly approved lyrics. | Still protect speech and rights. |
| `lyrics_allowed_no_speech_section` | Lyrics only in no-speech section. | No overlap with important speech. |
| `lyrics_allowed_outro_only` | Lyrics only in outro. | Avoid CTA/speech conflict. |
| `lyrics_needs_review` | Lyrics might be possible but need review. | Do not execute. |
| `unknown_not_allowed` | Unknown vocal/lyric status. | Treat as not allowed. |

Rules:

- Default to instrumental-only under dialogue, narration, teaching, podcast, testimonial, claims, quotes, and CTAs.
- Lyrics under important speech require explicit user approval.
- Do not copy lyrics from reference music.
- Generated lyrics are not in scope and remain future-gated.
- Cultural/language-aware music can be planned when supported by user request, footage, transcript, audience, or reference DNA, but avoid stereotypes and do not copy reference music.

## Reference Music DNA Safety

Allowed reference music DNA fields:

- Mood.
- Energy.
- Intro feel.
- Pacing.
- Cue structure.
- Instrumentation family at a broad level.
- Transition timing.
- Emotional arc.
- Why it works.

Forbidden copying:

- Exact track.
- Exact melody.
- Exact lyrics.
- Exact beat sequence if protected or distinctive.
- Stems.
- Copyrighted audio.
- Creator identity or protected distinctive style.

Reference DNA guides style adaptation only. User instruction can limit reference influence. Reference music must not change provider/model eligibility, rights status, approval gates, or credit requirements.

## Documentation-only Pseudo-record: SoundMusicSkillPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, provider request, worker contract, audio generation, SFX generation, Lyria integration, audio mixing, mastering, media analysis, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable planning identifier. | `sound_music_skill_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `edit_plan_segment_id` | Required | Segment reference. | `segment_product_reveal` |
| `skill_key` | Required | Future skill key. | `soundsync.music_bed` |
| `sound_role` | Required | Overall sound role. | `subtle_music_bed` |
| `music_role` | Required | Music role. | `bed` |
| `SFX_role` | Required | SFX role. | `graphic_reveal_sfx` |
| `ambience_role` | Required | Ambience/room tone role. | `room_tone_preservation` |
| `planning_reason` | Required | Specific planning reason. | `A quiet bed supports product confidence without hiding speech.` |
| `restraint_decision` | Required | Use, reduce, reject, or defer. | `use_low_energy_bed_reduce_SFX` |
| `music_source_type` | Required | Music source type. | `licensed_library_music_future` |
| `rights_or_provenance_status` | Required | Rights/provenance status. | `licensed_future_required` |
| `mood` | Required | Mood value. | `corporate` |
| `energy_level` | Required | Energy value. | `low` |
| `energy_curve_summary` | Required | Energy curve summary. | `steady low bed with small lift at reveal` |
| `cue_start_seconds` | Required | Cue start. | `0.0` |
| `cue_end_seconds` | Required | Cue end. | `22.0` |
| `beat_map_summary` | Required | Beat map summary. | `soft downbeats line up with B-roll cuts` |
| `ducking_strategy` | Required | Ducking strategy. | `voice_first_ducking` |
| `speech_safety` | Required | Speech safety behavior. | `protect all narration and CTA phrases` |
| `lyrics_policy` | Required | Lyrics policy. | `instrumental_only` |
| `SFX_strategy` | Required | SFX strategy. | `single soft whoosh on feature card only` |
| `ambience_room_tone_strategy` | Required | Ambience/room tone plan. | `preserve source room tone under cuts` |
| `source_audio_behavior` | Required | Source audio behavior. | `mute B-roll source audio under voiceover` |
| `transition_relationship` | Required | Transition relationship. | `no hit under transition; ambient bridge only` |
| `graphic_motion_relationship` | Required | Graphic/motion relationship. | `subtle card reveal sound if speech-safe` |
| `three_d_relationship` | Required | 3D relationship. | `defer object SFX unless hero reveal approved` |
| `B_roll_relationship` | Required | B-roll relationship. | `music supports montage; B-roll ambience muted` |
| `caption_relationship` | Required | Caption relationship. | `lower distraction under dense feature captions` |
| `reference_music_dna_notes` | Optional | Reference DNA notes. | `use warm pace and mood only; do not copy melody` |
| `generated_music_future_required` | Required | Whether future generated music is required. | `false` |
| `credit_impact` | Required | Credit impact estimate category. | `low` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | QA checks. | `speech clarity, lyrics policy, room tone, rights status` |
| `revision_options` | Required | Revision options. | `remove music, ambience only, softer SFX, stronger ducking` |
| `lower_cost_alternative` | Required | Lower-cost alternative. | `ambience only and no SFX` |
| `worker_notes` | Optional | Future worker boundary notes. | `no audio worker unlocked by this doc` |
| `must_follow_rules` | Required | Must-follow rules. | `speech first; no copied reference; no lyrics under narration` |
| `avoid_rules` | Required | Avoid rules. | `no random whooshes; no provider calls; no unknown-source music` |
| `status` | Required | Planning status. | `planned_pending_approval` |
| `metadata_json` | Optional | Future metadata bucket if implemented later. | `{ "docs_only": true }` |

## Sound/Music Scoring Model

Sound/music scoring is planning guidance only. It is not runtime logic, TypeScript, SQL, JSON schema, prompt code, provider logic, or a weighted model.

Positive signals:

- Music supports mood/story.
- Beat map improves pacing.
- Transition needs sound bridge.
- B-roll montage needs rhythm.
- Visual hero moment needs controlled lift.
- User requested music/SFX.
- Edit preference supports sound polish.
- Workflow context benefits from music.
- Speech density allows music.
- Ambience needs smoothing.
- SFX supports a visual action without distraction.
- Reference DNA suggests mood/energy without copying.

Negative signals:

- User requested no music/SFX.
- Speech is dense or important.
- Lyrics conflict with speech.
- Music would feel generic.
- SFX would be random.
- SFX would hit under key speech.
- Ambience/room tone is more authentic.
- Rights/source is unknown.
- Reference copying risk exists.
- Credit budget is too low for generated/custom music.
- Tone mismatch.
- Too many visual skills already create density.
- Captions need focus/readability.

Documentation-only pseudo logic:

```text
sound_music_score =
  mood_support
+ rhythm_support
+ story_emotion_fit
+ transition_support
+ visual_skill_support
+ user_preference_fit
+ workflow_fit
+ reference_dna_fit
+ ambience_continuity_gain
- speech_clarity_risk
- lyrics_conflict_risk
- SFX_distraction_risk
- rights_source_risk
- generic_music_risk
- credit_penalty
- tone_mismatch
- density_conflict
```

## Edit Preference Influence

User direct instruction overrides defaults. When user preference is unclear:

- `no extra visuals`: audio cleanup, ambience, or subtle music may be allowed if requested; avoid flashy SFX.
- `keep visuals minimal`: sound can provide polish without visual clutter, but speech stays first.
- `balanced visual mix`: music/SFX can support key moments.
- `more graphic design`: graphic reveals may get subtle SFX if speech-safe.
- `more Stroke Motion`: line/draw SFX can support animation, but avoid loud sounds under speech.
- `Real Motion if useful`: object SFX may support realistic overlays where approved.
- `premium/luxury`: use subtle, spacious, high-end music/ambience and restrained SFX.
- `energetic/social`: use stronger beat timing and SFX where readable and speech-safe.
- `educational`: use low-distraction instrumental, ambience only, or no music.
- `corporate`: keep music clean, trustworthy, and not gimmicky.
- `documentary/testimonial/faith`: prioritize restraint, room tone, silence, and ambience-first decisions.

## Workflow Context Guidance

| Workflow context | Likely sound/music behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | No music, room tone, or subtle bed. | Loud transition SFX. | Voice-first. |
| Social Short / Viral Clip | Beat-aware bed and limited SFX. | Lyrics under speech or SFX on every cut. | Captions still need focus. |
| Talking Head / Personal Brand | Low music bed, voice-first ducking. | Generic high-energy bed. | Speech carries trust. |
| Podcast Clip | Voice-first, no distracting SFX. | Music under dense conversation. | Speaker labels/captions may need clarity. |
| Vlog / Lifestyle | Ambience, light music, natural texture. | Overproduced impacts. | Preserve authenticity. |
| Product Demo | Clean bed, subtle UI/graphic SFX, ducking. | Blocking product/process explanation. | No false UI sounds. |
| Real Estate / Property Tour | Premium mood bed, ambient bridges. | Busy SFX or fake luxury sparkle. | Room tone can matter. |
| Education / Explainer | Low-distraction instrumental or ambience only. | Lyrics, hits, or high rhythm under teaching. | Comprehension first. |
| Marketing Ad | Controlled lift, CTA-safe music. | Lyrics or hit over offer speech. | Claim/CTA clarity. |
| Testimonial / Case Study | Trust-first subtle bed or ambience only. | Manipulative music or loud impacts. | Quote clarity. |
| Custom / Let AI Decide | Choose minimum sound that supports the story. | Filling every moment. | Must document reason. |

## Relationships To Other Skills

Sound/music planning must coordinate with:

- Transitions: sound bridges, ambient bridges, and transition SFX must not hit under key speech.
- Overlays/compositing: visual overlays may get audio support only when density stays professional.
- Graphic design: graphic reveal SFX should not make captions, proof cards, or CTA cards harder to read.
- Motion design: beat/rhythm support should follow motion timing without repetitive SFX.
- 3D visuals: hero/object sounds must not overpower the speaker and may require premium approval.
- B-roll: source audio, ambience, room tone, and music bed must not clash.
- Captions: dense captions, quote captions, claim captions, and CTA captions need lower distraction.
- Stroke Motion: draw SFX should be rare, low, and timed to meaningful drawing.
- Real Motion: object SFX should feel realistic and not gimmicky.
- Browser/app visuals: UI clicks and chimes must not imply false interaction when source is mock/unknown.
- StoryTiming: sound/music must hand off timing windows, density conflicts, dependencies, and QA blocks.

Conflict examples:

- Transition SFX under speech.
- Graphic reveal SFX makes captions harder to read.
- 3D hero sound overpowers speaker.
- B-roll source audio clashes with music bed.
- Music energy fights emotional pause.
- Lyrics conflict with narration.
- Real Motion object SFX feels too loud or gimmicky.
- Stroke Motion draw SFX repeats too much.
- Browser/app UI clicks imply false interaction if source is mock/unknown.
- Too much SFX reduces premium feel.

Full StoryTiming coordination belongs to `RP-SKILLS-11`.

## Sound/Music And Captions

Captions do not replace speech clarity. Music/SFX should not make speech harder to follow. Caption-heavy sections may require lower audio distraction, slower releases, fewer hits, and instrumental-only policy.

Quote, claim, and CTA captions need especially careful speech protection. If captions are translation/multilingual future notes, audio planning should avoid distracting voice/music conflicts and should not assume translation runtime exists. Caption timing can guide important phrase protection windows for ducking, SFX avoidance, and cue restraint. SoundSync should use caption timing as a planning signal.

## Sound/Music And B-roll Source Audio

B-roll may play under voiceover. B-roll source audio may be muted, preserved, or bridged depending on story, speech, and source status. Room tone bridges can hide cuts and prevent amateur jumps. Montage B-roll may need beat-driven music. Property, vlog, travel, and documentary B-roll may need natural ambience. Testimonial/case-study B-roll should preserve trust.

Screen/app B-roll may use subtle UI SFX only if source status supports it. Mock/unknown source should not get UI clicks that imply real interaction. Source audio discontinuity can make B-roll feel amateur, so B-roll audio should be explicitly planned rather than ignored.

## Generated Music Future Boundary

`generated_music_future` is planning-only here. `Lyria_future` is a future candidate label only; this document does not integrate Lyria. Prompt plans, negative prompts, cue sheets, generated tracks, QA, mix plans, provider costs, storage, worker routing, and refunds belong to future milestones.

Rules:

- No API keys or provider secrets in database/docs/code.
- Generated music requires credit estimate and approval.
- Generated music is project asset first.
- Library promotion requires QA, provenance, rights, and provider-terms review.
- Failed generation and refund handling belong to future credit/job flows.
- No provider call, generated music, generated SFX, audio processing, mixing, mastering, or render/export occurs in this prompt.

## Accessibility, Comfort, And Trust

Sound/music planning should:

- Preserve speech intelligibility.
- Avoid harsh high-frequency SFX.
- Avoid excessive bass hits under speech.
- Avoid loudness jumps.
- Avoid repetitive whooshes.
- Preserve emotional silence.
- Avoid music that stereotypes culture or language.
- Avoid using music to manipulate testimonial trust too aggressively.
- Avoid distracting from captions/reading.
- Avoid audio fatigue in long-form edits.
- Use voice-first defaults for education, podcast, testimonial, faith, documentary, claims, and CTAs.

## Repetition And Novelty

Rules:

- Do not use the same whoosh on every transition.
- Do not use the same riser before every visual.
- Do not use generic background music mechanically.
- Do not make every visual have SFX.
- Repeated motifs can be intentional if planned.
- Save strongest sound hits for strongest moments.
- Vary music/SFX density by story importance.
- Sometimes silence creates more impact than more sound.

Repetition states:

| State | Meaning | Action |
| --- | --- | --- |
| `first_use` | First use of sound idea. | Allowed if purposeful. |
| `repeated_intentionally` | Repeat is a planned motif. | QA for fatigue. |
| `repeated_unintentionally` | Repeat happened by habit. | Revise. |
| `overused` | Sound pattern is too frequent. | Reduce/remove. |
| `avoid_this_pattern_next` | Pattern should not repeat again. | Choose silence or alternative. |

## Credit And Approval Behavior

Credit and approval guidance:

| Sound/music work | Typical credit impact | Approval behavior |
| --- | --- | --- |
| `no_music` / silence | `none` | No approval unless user asked otherwise. |
| Room tone/ambience planning | `none` / `low` | Usually no approval. |
| Basic voice-first music bed planning | `low` | Approval if new asset/license is needed. |
| Existing-library SFX future | `low` / `medium` | Approval if generated/licensed/premium. |
| Multi-cue music plan | `medium` | Review/approval likely. |
| Custom SFX design future | `medium` / `high` | Approval required. |
| Generated music future | `high` / `premium` | Credit estimate and approval required. |
| `Lyria_future` generated cue | `premium` | Future provider approval required. |
| Complex mix/ducking automation future | `medium` / `high` | Approval if runtime/worker cost applies. |
| Real Motion/3D object sound design | `high` / `premium` | Approval required. |
| Music reference DNA analysis | `low` / `medium` | Depends on future implementation. |

Rules:

- Premium/generated music/SFX must be itemized.
- Generated/custom music requires estimate and approval.
- Optional heavy SoundSync should have lower-cost alternatives.
- Lower-cost alternatives can include ambience only, simple licensed/library future cue, no SFX, simpler music bed, or no music.
- No music/SFX generation, mixing, provider execution, or worker execution before approval and future runtime gates.
- Rights/provenance/reuse review can affect credit and approval behavior.

## Sound/Music QA

Sound/music QA must verify:

- Sound has purpose.
- Music role is clear.
- SFX role is clear.
- Speech clarity is protected.
- Lyrics policy is honored.
- Important phrases are protected.
- Captions/readability are supported.
- Ducking strategy is appropriate.
- Room tone/ambience continuity is planned.
- Transition sounds are aligned and not distracting.
- Visual skill SFX are not random.
- SFX are not repeated mechanically.
- Music mood fits edit preference.
- Music energy fits story.
- Reference copying does not occur.
- Rights/provenance status is known.
- Source audio behavior is planned.
- Loudness/volume jumps are avoided.
- Sensitive/trust content is treated with restraint.
- Credit/approval behavior is compliant.

Blocking examples:

- Lyrics under important speech without approval.
- Premium/generated music without approval.
- Music copied from reference.
- Unlicensed/unknown source treated as safe.
- Loud SFX under key speech.
- Sound contradicts user "no music/no SFX" instruction.
- Audio makes caption-heavy section hard to follow.
- Provider/generation execution attempted.

Warning examples:

- Music may be too generic.
- SFX repeated too often.
- Ducking may need stronger speech protection.
- Ambience bridge may need smoothing.
- Cue energy may be too high for tone.
- Silence may be better for emotional pause.

## Revision Behavior

Safe revision options:

- Remove music.
- Use ambience only.
- Make music quieter.
- Make music more premium.
- Make music less emotional.
- Make music more energetic.
- Change music mood.
- Remove lyrics.
- Use instrumental only.
- Reduce SFX.
- Remove transition SFX.
- Soften SFX.
- Lower whoosh/impact intensity.
- Improve ducking.
- Preserve room tone.
- Mute B-roll source audio.
- Preserve B-roll ambience.
- Align music to beat.
- Protect important phrase.
- Lower credit cost.
- Regenerate cue concept options later.
- Request user approval for lyrics/generated/custom music later.

Revision requires new credit estimate or approval when it adds generated/custom music, licensed/library music, premium SFX, provider work, complex mix automation, new asset generation, rights/provenance review, or worker/runtime execution.

## Examples

These examples are planning examples only. They are not fixtures, prompts, runtime data, TypeScript, JSON schema, SQL, provider instructions, worker jobs, generated audio requests, or renderer instructions.

### 1. Simple Clean Talking-head Edit

- `skill_key`: `soundsync.voice_first`
- `sound_role`: `room_tone_preservation`
- `music_role`: `none`
- `SFX_role`: `none`
- `ambience_role`: `room_tone_preservation`
- `planning_reason`: Speech carries the edit; natural room tone is enough.
- `restraint_decision`: Use no music and no SFX.
- `mood`: `clean`
- `energy_level`: `none`
- `timing_summary`: Preserve room tone across cuts.
- `ducking_strategy`: `none`
- `speech_safety`: `speech_first`
- `lyrics_policy`: `lyrics_not_allowed`
- `relationship_to_other_skills`: Captions and cuts stay voice-led.
- `credit_impact`: `none`
- `approval_required`: `false`
- `lower_cost_alternative`: Already the lowest-cost option.
- `QA checks`: Speech clarity, room tone continuity, no accidental music/SFX.

### 2. Podcast Clip

- `skill_key`: `soundsync.podcast_voice_first`
- `sound_role`: `voice_first_cleanup_support`
- `music_role`: `none`
- `SFX_role`: `none`
- `ambience_role`: `room_tone_preservation`
- `planning_reason`: Conversation and speaker trust matter more than polish.
- `restraint_decision`: Avoid distracting SFX.
- `mood`: `documentary`
- `energy_level`: `none`
- `timing_summary`: Protect speaker turns and pauses.
- `ducking_strategy`: `none`
- `speech_safety`: `speech_first`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: Speaker captions and lower thirds get priority.
- `credit_impact`: `none` / `low`
- `approval_required`: `false`
- `lower_cost_alternative`: Room tone only.
- `QA checks`: Speaker clarity, no SFX under phrases, caption readability.

### 3. Premium Property Tour

- `skill_key`: `soundsync.premium_property_bed`
- `sound_role`: `premium_mood_bed`
- `music_role`: `bed`
- `SFX_role`: `ambient_bridge`
- `ambience_role`: `room_tone_preservation`
- `planning_reason`: A subtle luxury bed supports pacing without crowding visuals.
- `restraint_decision`: Use very low energy and ambient bridges.
- `mood`: `luxury`
- `energy_level`: `very_low`
- `timing_summary`: Music breathes through room reveals; ambience bridges cuts.
- `ducking_strategy`: `voice_first_ducking`
- `speech_safety`: `duck_under_voice`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: B-roll, room labels, and transitions stay calm.
- `credit_impact`: `low` / `medium`
- `approval_required`: `true` if licensed/generated asset is needed.
- `lower_cost_alternative`: Ambience only with no music.
- `QA checks`: Room tone, premium restraint, rights status, no generic luxury SFX.

### 4. Social Short

- `skill_key`: `soundsync.social_beat_support`
- `sound_role`: `energetic_social_bed`
- `music_role`: `pulse`
- `SFX_role`: `transition_sound`
- `ambience_role`: `none`
- `planning_reason`: Beat-aware pacing supports short-form retention.
- `restraint_decision`: Use rhythm but limit SFX to key transitions.
- `mood`: `energetic`
- `energy_level`: `medium`
- `timing_summary`: Downbeats support cuts; no hits under key phrases.
- `ducking_strategy`: `voice_first_ducking`
- `speech_safety`: `duck_under_voice`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: Captions, transitions, and motion design share beat anchors.
- `credit_impact`: `low` / `medium`
- `approval_required`: `true` for new licensed/generated music.
- `lower_cost_alternative`: Use existing project audio or no SFX.
- `QA checks`: Caption focus, speech clarity, SFX repetition, rights status.

### 5. Product Demo

- `skill_key`: `soundsync.product_demo_clean`
- `sound_role`: `subtle_music_bed`
- `music_role`: `bed`
- `SFX_role`: `graphic_reveal_sfx`
- `ambience_role`: `room_tone_preservation`
- `planning_reason`: Clean bed and subtle reveal SFX support product steps.
- `restraint_decision`: Keep speech-safe ducking and limited UI/graphic sounds.
- `mood`: `corporate`
- `energy_level`: `low`
- `timing_summary`: Feature card SFX after important phrase, not over it.
- `ducking_strategy`: `voice_first_ducking`
- `speech_safety`: `no_music_under_key_dialogue`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: Graphic Design, captions, B-roll, and browser/app visuals stay primary.
- `credit_impact`: `low`
- `approval_required`: `false` unless new assets are generated/licensed.
- `lower_cost_alternative`: No SFX, quieter bed.
- `QA checks`: UI truth, product action clarity, captions, speech, rights.

### 6. Education Explainer

- `skill_key`: `soundsync.educational_low_distraction`
- `sound_role`: `educational_low_distraction_bed`
- `music_role`: `ambience_only`
- `SFX_role`: `none`
- `ambience_role`: `ambience_only`
- `planning_reason`: Learning needs clarity and low distraction.
- `restraint_decision`: Prefer ambience only or very low instrumental.
- `mood`: `educational`
- `energy_level`: `very_low`
- `timing_summary`: No hits during definitions or diagrams.
- `ducking_strategy`: `mute_under_speech`
- `speech_safety`: `speech_first`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: Captions and VisualExplain diagrams get priority.
- `credit_impact`: `none` / `low`
- `approval_required`: `false`
- `lower_cost_alternative`: Voice-only with room tone.
- `QA checks`: Comprehension, caption readability, no distracting cues.

### 7. Marketing Ad

- `skill_key`: `soundsync.marketing_lift`
- `sound_role`: `marketing_energy_cue`
- `music_role`: `hero_reveal`
- `SFX_role`: `impact_hit`
- `ambience_role`: `none`
- `planning_reason`: Offer/CTA needs controlled energy without covering claims.
- `restraint_decision`: Use lift but protect offer speech.
- `mood`: `triumphant`
- `energy_level`: `high`
- `timing_summary`: Hit after CTA phrase, not under it.
- `ducking_strategy`: `manual_keyframe_ducking`
- `speech_safety`: `no_music_under_key_dialogue`
- `lyrics_policy`: `lyrics_allowed_no_speech_section`
- `relationship_to_other_skills`: CTA card, captions, transitions, and proof text stay readable.
- `credit_impact`: `medium`
- `approval_required`: `true`
- `lower_cost_alternative`: Instrumental bed with no hit.
- `QA checks`: Offer clarity, no lyrics under claims, loudness, rights.

### 8. Testimonial Or Case Study

- `skill_key`: `soundsync.trust_bed`
- `sound_role`: `testimonial_trust_bed`
- `music_role`: `emotional_support`
- `SFX_role`: `none`
- `ambience_role`: `room_tone_preservation`
- `planning_reason`: A subtle bed can support trust if it does not manipulate the quote.
- `restraint_decision`: Keep music very low or ambience-only.
- `mood`: `documentary`
- `energy_level`: `very_low`
- `timing_summary`: Preserve quote clarity and pauses.
- `ducking_strategy`: `voice_first_ducking`
- `speech_safety`: `speech_first`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: Quote captions and B-roll proof moments stay clear.
- `credit_impact`: `low`
- `approval_required`: `true` for licensed/generated music.
- `lower_cost_alternative`: Ambience only.
- `QA checks`: Trust, quote clarity, no manipulative swell, rights status.

### 9. 3D Hero Visual

- `skill_key`: `soundsync.three_d_hero`
- `sound_role`: `three_d_object_sfx`
- `music_role`: `hero_reveal`
- `SFX_role`: `object_pass`
- `ambience_role`: `none`
- `planning_reason`: Premium 3D reveal may benefit from controlled object sound.
- `restraint_decision`: Defer until premium approval and credit estimate.
- `mood`: `cinematic`
- `energy_level`: `hero`
- `timing_summary`: Object pass sound aligns after speech phrase.
- `ducking_strategy`: `voice_first_ducking`
- `speech_safety`: `avoid_key_phrase_window`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: 3D, motion, captions, and StoryTiming must coordinate.
- `credit_impact`: `high` / `premium`
- `approval_required`: `true`
- `lower_cost_alternative`: No object SFX; use subtle music lift only.
- `QA checks`: Speech, 3D timing, volume, premium restraint, approval.

### 10. Reference Music DNA

- `skill_key`: `soundsync.reference_dna`
- `sound_role`: `reference_music_dna_influence_only`
- `music_role`: `bed`
- `SFX_role`: `none`
- `ambience_role`: `ambience_only`
- `planning_reason`: Reference guides mood and energy but must not be copied.
- `restraint_decision`: Use influence only; no exact track, melody, beat sequence, or lyrics.
- `mood`: `custom`
- `energy_level`: `low`
- `timing_summary`: Adapt broad cue structure only.
- `ducking_strategy`: `voice_first_ducking`
- `speech_safety`: `speech_first`
- `lyrics_policy`: `instrumental_only`
- `relationship_to_other_skills`: Reference influence should support captions, B-roll, and transitions safely.
- `credit_impact`: `low` / `medium`
- `approval_required`: `true` for future generated/licensed music.
- `lower_cost_alternative`: Describe mood only; use no music until approved.
- `QA checks`: No copying, rights status, source/provenance, speech safety.

## Anti-patterns

Fail future sound/music planning when it includes:

- Music name only.
- Sound/music can execute from only a music/SFX name.
- sound/music can execute from only a music/SFX name.
- Random background music everywhere.
- Loud whoosh on every transition.
- Same SFX repeated mechanically.
- Lyrics under speech without approval.
- Music copied from reference.
- Exact melody, track, or lyrics copied.
- SFX under important words.
- Music too loud for captions or speech.
- Generic music that hurts premium feel.
- Music energy contradicts emotional pause.
- Source audio jumps between B-roll clips.
- Room tone ignored.
- Ambience discarded when it should be preserved.
- Browser/app UI SFX implies false interaction.
- Generated music without credit estimate.
- Premium/custom sound without approval.
- Unknown music source treated as licensed.
- Worker execution from raw prompt only.
- Provider integration attempted in planning docs.
- Runtime code, TypeScript, migrations, installs, package mutations, providers, workers, audio generation, music generation, SFX generation, audio processing, mixing, mastering, render/export, Supabase work, ASR, transcript processing, translation, caption rendering, browser/capture/media/WebGL/canvas/3D runtime, or app behavior changes.

## Future Implementation Notes

If SoundSync/music/SFX skills are eventually approved, future implementation may need records or typed contracts similar to these names, but none are created now:

- `soundsync_plans`
- `music_context_analysis_records`
- `music_cue_plans`
- `sound_timing_plans`
- `ducking_speech_safety_plans`
- `SFX_plans`
- `ambience_room_tone_plans`
- `reference_music_dna_records`
- `generated_music_future_plans`
- `mix_plans`
- `sound_music_qa_requirements`
- `edit_plan_skill_routes` with SoundSync/music/SFX skill keys
- `transition_plans` references
- `B_roll_plans` references
- `caption_plans` references
- `motion_design_plans` references
- `three_d_visual_plans` references
- `storytiming_coordination_records`

Future schema/types must avoid duplicating this doc's source truth and must reconcile existing audio/music/SFX owners first. Future StoryTiming coordination should reference this sound/music contract when audio behavior is needed. Runtime audio generation, SFX generation, provider integrations, music selection, licensing, mixing, mastering, and render/export remain future gated work.

## Duplicate And Overlap Notes

Direct Creative Skill sound/music doctrine lives in `docs/creative-skills/` only.

Existing owners already cover SoundSync/audio/SFX behavior:

- `src/types/audio-music.ts` owns current audio/music/SoundSync workstream, music cue, music QA, mix plan, provider policy, sound cue, tool, runtime, approval, credit, artifact, timing, and handoff type shapes.
- `src/types/sfx-director.ts` and backend SFX director contracts/services own SFX planning, provider route, prompt, generated asset, trim/alignment, mix, QA, library growth, and worker mock shapes.
- `docs/production-audio-sound-foundation.md`, `docs/production-loudness-music-ducking-policy.md`, `docs/production-soundsync-foundation-policy.md`, `docs/production-audio-artifact-policy.md`, `docs/production-audio-qa-policy.md`, and `docs/production-audio-sound-runbook.md` cover production audio foundations and policies.
- `docs/production-real-audio-execution.md`, `docs/production-music-ducking-execution-policy.md`, and related real-audio execution docs cover later execution boundaries.
- `docs/music-sfx-timing-integration.md`, StoryTiming services, and backend event services cover music/SFX timing, cue events, beat grids, ducking timing, SFX events, conflicts, and QA summaries.
- `docs/sfx-director-service.md`, `docs/sfx-provider-prompting.md`, `docs/sfx-provider-adapter-layer.md`, `docs/sfx-worker-plan.md`, `docs/google-cloud-sfx-worker-plan.md`, `docs/edit-project-sfx-integration.md`, `docs/sfx-volume-and-mix-rules.md`, `docs/sfx-timing-trim-alignment.md`, and `docs/sfx-qa-regeneration.md` cover SFX runtime-adjacent mock/future boundaries.
- `docs/music-qa-and-mix-planning.md`, `docs/chat-native-music-ui.md`, `docs/chat-native-sfx-ui.md`, `docs/lyria-integration-adapter.md`, and `docs/lyria-worker-plan.md` cover music QA/mix/UI/provider-adjacent planning lanes.
- `docs/tool-calling/*sound*` reconciliation docs cover sound tool-candidate, runtime gate, and worker owner reviews.
- `audio-library-and-licensing.md` exists and should remain the owner for library/licensing policy context.

Future sound/music skill work must reference these owners rather than creating parallel audio/music types, SFX worker contracts, provider routes, music QA records, mix plans, render/export audio lanes, credit/approval flows, or UI behavior.

Requested root reading files missing in this repo snapshot:

- `soundsync-music-intelligence.md`
- `music-reference-dna.md`
- `lyria-music-generation-plan.md`

Related docs with different names exist, including `docs/lyria-integration-adapter.md` and `docs/lyria-worker-plan.md`, but they are not the requested root files and should not be treated as replacements without explicit reconciliation.

## RP-SKILLS-11 Handoff

Recommended next prompt:

`RP-SKILLS-11 - StoryTiming Coordination Contract`

Allowed scope for `RP-SKILLS-11`:

- Docs-only StoryTiming coordination contract under `docs/creative-skills/`.
- Inherit all RP-SKILLS planning contracts.
- Define how active skills coordinate in time: primary visual focus, secondary support, caption zones, overlay zones, speaker safe zones, B-roll windows, 3D/Real Motion windows, motion timing, transition permission, music ducking, SFX permission, visual/audio density, conflict resolution, QA blocking, and revision impact.

Forbidden scope for `RP-SKILLS-11` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Audio generation, music generation, SFX generation, mixing/mastering runtime, render/export runtime, ASR, transcript processing, translation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
