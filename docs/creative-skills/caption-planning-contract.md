# Caption Planning Contract

## Purpose

This document defines the caption-specific planning contract for future ReeditPro caption skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, caption rendering, ASR, transcript processing, translation, media analysis, browser capture, package changes, Supabase connections, SQL, credentials, render/export behavior, AI calls, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It references [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) when captions share screen space with overlays, lower thirds, PIP, browser visuals, or layered compositions. It references [graphic-design-planning-contract.md](graphic-design-planning-contract.md) when captions coordinate with cards, labels, diagrams, proof panels, or hierarchy. It references [motion-design-planning-contract.md](motion-design-planning-contract.md) when captions animate, emphasize words, or follow beat/rhythm. It references [transition-planning-contract.md](transition-planning-contract.md) when caption entry/exit timing crosses cuts, bridges, J-cuts, L-cuts, or transition edges. It references [three-d-visual-planning-contract.md](three-d-visual-planning-contract.md) when captions must yield to hero 3D, screen interaction, depth, occlusion, or spatial visual moments. It references [b-roll-planning-contract.md](b-roll-planning-contract.md) when captions continue over B-roll, move around insets, or coordinate with voiceover.

This document defines caption-specific fields and rules that future docs, types, schema, workers, transcript systems, render/export systems, provider plans, and QA systems must follow if caption skills are eventually implemented.

## Caption Doctrine

Captions are not random text decoration.

Every caption must preserve meaning first, readability second, and style third. Caption planning must respect the user's edit preference, transcript/source accuracy, audience context, platform readability, visual hierarchy, and collision risk. A professional edit can use no captions, minimal captions, accessible captions, social captions, quote captions, keyword emphasis, translated captions in the future, or dense educational captions, but no caption mode is automatic.

This is the no-random-text doctrine for caption skills: text is only planned when it preserves, clarifies, or safely emphasizes meaning.

Caption planning must never execute from a skill name alone. A request like "add captions" is not enough to choose transcript source, accuracy status, line breaks, timing, placement, style, animation, approval, or QA. A future caption planner must produce a planning contract before execution.

Core principle:

"Every caption must preserve meaning first, readability second, and style third."

## Universal And Cross-skill Inheritance

Every `CaptionSkillPlan` inherits the universal skill planning envelope from RP-SKILLS-02:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

Captions reference RP-SKILLS-03 when caption timing is near transitions:

- Caption entry before or after cut.
- Caption hold across J-cut or L-cut.
- Caption exit before an impact transition.
- Cut-edge readability and speech safety.

Captions reference RP-SKILLS-04 when captions share space with overlays:

- Placement zone.
- Safe area.
- Face, mouth, eyes, product, and object avoidance.
- Collision with lower thirds, cards, graphics, PIP, browser/app frames, or proof panels.
- Layer order and aspect ratio behavior.

Captions reference RP-SKILLS-05 when captions share hierarchy with graphics:

- Text hierarchy between caption and card.
- Duplicate-text avoidance.
- Proof and claim wording safety.
- Typography and readability coordination.

Captions reference RP-SKILLS-06 when captions move:

- Entry, hold, exit behavior.
- Word-by-word, phrase, highlight, or beat-locked emphasis.
- Motion comfort, repetition, and accessibility.

Captions reference RP-SKILLS-07 when 3D visuals compete with caption attention:

- Hero 3D caption reduction.
- Spatial object and depth collision checks.
- Screen interaction and product breakout readability.

Captions reference RP-SKILLS-08 when B-roll changes what viewers see:

- Captions continuing over voiceover.
- Caption repositioning around inset/PIP/split-screen B-roll.
- B-roll proof/source text and caption text hierarchy.

Do not duplicate the full universal, transition, overlay/compositing, graphic design, motion design, 3D visual, or B-roll contracts except when referencing inheritance.

## Caption Roles

These roles are guidance, not hard-coded execution. A future planner should choose a role because it supports the edit, not because captions are a default visual effect.

| Role | What it is | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `no_captions` | Intentional absence of captions. | User says no captions, clean cinematic edit, captions would distract. | Accessibility is required or user asks for captions. | Valid restraint. |
| `accessibility_captions` | Meaning-preserving captions for accessibility. | Training, education, public distribution, noisy viewing contexts. | User explicitly declines captions and accessibility is not required. | Style stays secondary. |
| `basic_readable_captions` | Simple readable captions. | General talking-head, explainers, clear social posts. | Dense graphics or strong hero visuals need restraint. | Default-safe only with source confidence. |
| `social_captions` | Larger platform-friendly captions. | Shorts, Reels, TikTok, creator edits. | Serious proof moments or premium restraint. | Must not cover faces/products. |
| `keyword_emphasis_captions` | Caption text with selected emphasized words. | Retention, education, sales points. | Every word highlighted or emphasis changes meaning. | Emphasize meaning only. |
| `quote_captions` | Captions that preserve exact quoted language. | Testimonials, interviews, proof moments. | Paraphrase without approval. | Quote accuracy is mandatory. |
| `speaker_identification_captions` | Caption includes speaker context. | Multi-speaker clips, podcasts, interviews. | Single speaker with no ambiguity. | Keep labels brief. |
| `educational_captions` | Clear grouped captions for learning. | Tutorials, lectures, explainers. | Fast social pacing that needs minimal text. | Prioritize comprehension. |
| `product_feature_captions` | Captions tied to a product feature/action. | Demos, SaaS, ecommerce. | Product action would be hidden. | Coordinate with graphics and B-roll. |
| `marketing_offer_captions` | Captions for offers, CTAs, or promo copy. | Ads, landing clips, launch videos. | Unverified price/discount/claim. | Needs claim safety. |
| `proof_or_claim_captions` | Captions that restate proof or claims. | Case studies, evidence sections. | Source unknown or low confidence. | Must avoid overclaiming. |
| `karaoke_word_by_word_captions` | Word-level reveal captions. | High-energy social, music-aligned clips. | Long education or accessibility-first videos. | High QA for timing/readability. |
| `phrase_by_phrase_captions` | Phrase chunks revealed in sequence. | Social, explainers, clean speech. | Dense terminology or slow reading needs. | Good middle ground. |
| `minimal_phrase_captions` | Sparse phrase support. | Premium, cinematic, real estate, emotional edits. | Noisy viewing or education needs more text. | Useful with hero visuals. |
| `full_transcript_captions` | Complete transcript-style captions. | Training, education, accessibility deliverables. | Short-form retention edit where density harms readability. | Requires accurate transcript. |
| `lower_third_adjacent_captions` | Captions planned around lower thirds. | Interviews, podcasts, expert clips. | Lower third and captions duplicate each other. | Needs layout hierarchy. |
| `translated_captions_future` | Future translated caption candidate. | User requests language translation later. | Treating translation as implemented now. | Requires review and future tooling. |
| `multilingual_captions_future` | Future multi-language caption layout candidate. | Multilingual deliverables later. | Current docs-only planning. | Future-only placeholder. |
| `captions_reduced_for_hero_visual` | Captions intentionally reduced for a key visual. | 3D hero, product reveal, proof screen, emotional close-up. | Speech comprehension would fail. | Supports visual priority. |
| `captions_repositioned_for_overlay` | Captions moved to avoid overlay/graphic/B-roll. | PIP, proof card, browser frame, label-heavy moment. | Repositioning harms readability. | Inherits overlay safety. |
| `captions_disabled_by_user` | Captions disabled because user said no. | Explicit user preference. | Accessibility/legal requirement overrides. | Preserve user preference. |

## Source And Accuracy Model

Caption plans must know where caption text came from and how reliable it is. Transcript, ASR, translation, and caption rendering are not implemented by this contract.

### Source Types

| Source type | Meaning | Rule |
| --- | --- | --- |
| `transcript_segment` | Existing transcript segment or project transcript source. | Use only within known source confidence. |
| `ASR_transcript_future` | Future ASR-generated transcript candidate. | Future-only; not implemented here. |
| `user_provided_script` | User supplied script/caption copy. | Preserve meaning and verify requested edits. |
| `corrected_transcript_future` | Future corrected transcript after review. | Future-only review lane. |
| `edited_transcript_summary` | Condensed text derived from transcript. | Must not change meaning without approval. |
| `translated_text_future` | Future translated caption text. | Requires translation review later. |
| `manual_caption_text_future` | Future manual caption entry. | Requires user/source confirmation. |
| `mock_only` | Placeholder planning text. | Must not be treated as true transcript. |
| `unknown_source` | Source is unknown. | Cannot execute or make claims. |

### Accuracy Status Values

| Accuracy status | Meaning | Rule |
| --- | --- | --- |
| `exact_transcript` | Caption matches source speech. | Best for quotes, accessibility, and proof. |
| `cleaned_for_readability` | Light cleanup without meaning change. | Filler/punctuation may be adjusted. |
| `condensed_without_meaning_change` | Shortened caption preserves meaning. | Needs reason and QA. |
| `paraphrase_needs_approval` | Text changes wording meaningfully. | Requires approval. |
| `translated_needs_review` | Translated text needs review. | Future-only; no execution. |
| `low_confidence_needs_review` | Transcript/source confidence is low. | Requires review before execution. |
| `user_approved_text` | User approved exact text. | Preserve approved text. |
| `unknown` | Accuracy is unknown. | Do not execute. |

Rules:

- Exact quote, testimonial, pricing, metric, legal, health, finance, or evidence-like captions require source confidence and QA.
- Condensing must preserve meaning. If meaning changes, approval is required.
- Captions must not invent names, prices, metrics, dates, product claims, company claims, locations, UI labels, or evidence details.
- Translated captions are future-only in this contract and must not be described as implemented.
- Low-confidence transcript text must not be treated as ready caption text.

## Use And Avoid Rules

Use captions when:

- The user asks for captions.
- Accessibility or no-audio viewing matters.
- Speech contains important meaning, product steps, proof, instruction, quote, or CTA.
- Platform context favors captions.
- Captions help bridge B-roll, graphics, or visual cutaways under voiceover.
- Captions clarify speakers in a multi-speaker clip.

Avoid or reduce captions when:

- The user explicitly says no captions and no accessibility requirement overrides it.
- Caption density would hide faces, mouth movement, product action, 3D hero visuals, proof screens, or important objects.
- Captions duplicate an on-screen graphic without adding value.
- Transcript/source accuracy is unknown.
- Captions would change the meaning or overstate a claim.
- Motion or word-by-word reveals would reduce readability or comfort.
- A lower-cost or lower-density alternative better fits the edit.

## Caption Density Model

| Density | Meaning | Best use cases | Avoid cases |
| --- | --- | --- | --- |
| `none` | No captions. | User declined captions, purely visual section. | Accessibility or speech comprehension required. |
| `minimal` | Sparse key phrases only. | Premium, cinematic, product/property tours. | Dense education or noisy viewing. |
| `restrained` | Important phrases with breathing room. | Professional social, interviews, business clips. | Full transcript deliverables. |
| `balanced` | Most spoken meaning represented. | General talking-head, product demos. | Heavy graphics or hero visuals. |
| `dense` | Detailed captions with frequent updates. | Education, training, technical content. | Mobile clutter or fast visuals. |
| `full_transcript` | Complete speech represented. | Accessibility, transcript deliverables. | Style-first social edit. |
| `hero_reduced` | Temporarily reduced around a hero visual. | 3D/product reveal, proof page, emotional close-up. | Speech contains critical details. |

Density is not the same as quality. A restrained caption plan can be more professional than a dense plan when the visual or emotional moment carries the edit.

## Style And Readability Model

Caption style exists to support readability and tone. It must not override meaning or source accuracy.

| Style intent | Meaning | Best use cases | Avoid cases |
| --- | --- | --- | --- |
| `basic_readable` | Clear high-contrast caption style. | General edits. | Premium minimal style requested. |
| `premium_subtle` | Small restrained caption style. | Luxury, property, cinematic, testimonial. | Noisy viewing or dense education. |
| `bold_social` | Large platform-friendly captions. | Short-form retention. | Serious proof or premium restraint. |
| `educational_clear` | Structured clear text for learning. | Training and explainers. | Visual-first montage. |
| `corporate_clean` | Neutral professional captions. | Business, SaaS, internal comms. | Playful creator edits. |
| `cinematic_minimal` | Minimal text with restrained styling. | Story, film, property, documentary. | Accessibility-first need. |
| `playful_emphasis` | Lighter energetic emphasis. | Creator/social. | Serious claims or sensitive topics. |
| `product_feature` | Feature/action aligned captions. | Product demos. | Product action would be covered. |
| `proof_quote` | Trust-first quote style. | Testimonials and proof moments. | Paraphrased or unverified quote. |
| `accessibility_first` | Highest readability and stability. | Public/training/accessibility contexts. | Pure style-first requests. |
| `brand_aligned_custom` | Future brand-specific caption style. | Brand kit aware edits later. | No brand source or approval. |

Future style planning should document:

- `typography_intent`
- `size_intent`
- `weight_intent`
- `contrast_strategy`
- `background_plate_needed`
- `background_plate_style`
- `text_shadow_or_stroke_needed`
- `highlight_style`
- `keyword_color_or_weight_intent`
- `readability_priority`
- `accessibility_notes`
- `platform_readability_notes`

Readability rules:

- Captions must be readable at the target aspect ratio and likely platform size.
- Captions must not rely on tiny text, low contrast, or fast motion.
- Captions must avoid face, mouth, eyes, product, object, UI, proof page, and CTA collisions.
- Line breaks should preserve phrases and meaning.
- Long words, names, numbers, and quoted language require extra QA.

## Animation And Emphasis Model

Caption animation must serve comprehension, rhythm, or emphasis. It must not be random motion.

| Animation intent | Meaning | Best use cases | Avoid cases |
| --- | --- | --- | --- |
| `no_animation` | Static captions. | Accessibility, training, serious proof. | High-energy social needing rhythm. |
| `subtle_fade` | Gentle entry/exit. | Premium, corporate, documentary. | Fast word emphasis. |
| `subtle_slide` | Small directional movement. | Social/business with restraint. | Motion-sensitive or dense text. |
| `word_by_word_reveal` | Words reveal individually. | High-energy social. | Dense education or quote accuracy. |
| `phrase_reveal` | Phrases reveal as chunks. | Explainable social, product demos. | Very fast speech. |
| `keyword_pop` | Selected word emphasis. | Retention or sales point. | Every word emphasized. |
| `underline_emphasis` | Underline or marker for important word. | Education, proof, features. | Decorative emphasis. |
| `highlight_sweep` | Highlight pass over phrase. | Product/tutorial moments. | Serious captions needing stability. |
| `karaoke_follow` | Follow speech with karaoke effect. | Music/social rhythm. | Accessibility-first edits. |
| `bounce_or_elastic` | Playful energetic motion. | Light creator content. | Premium, proof, legal, finance, health. |
| `beat_locked_emphasis` | Emphasis synchronized with beat. | Music-led short form. | Speech clarity is threatened. |
| `motion_graphic_caption` | Caption integrated into motion design. | Campaign/launch graphics. | Dense transcript sections. |
| `captions_static_during_hero_visual` | Captions pause or stay stable around hero visual. | 3D/product reveal/proof page. | Speech requires active reading. |

Motion rules:

- Keyword emphasis must be selective and meaning-based.
- Motion must stop; no caption should keep moving indefinitely without purpose.
- Repetition should be controlled so the same reveal does not feel mechanical.
- Captions near transitions should respect cut edges and avoid unreadable flashes.
- Animation must respect accessibility and motion comfort.

## Accessibility And Multilingual Future Notes

Accessibility and multilingual planning are first-class planning concerns, but this contract does not implement ASR, transcript processing, caption rendering, translation, or localization.

| Planning concern | Meaning | Rule |
| --- | --- | --- |
| `accessibility_required` | Captions are needed for accessibility. | Meaning and readability outrank style. |
| `speaker_identification_needed` | Speaker identity must be clear. | Keep labels concise and accurate. |
| `non_speech_audio_cues_future` | Future captions for sound cues. | Future-only planning; not implemented. |
| `captions_for_noisy_environment` | Captions support no-audio or noisy viewing. | Favor readable, stable captions. |
| `translation_requested` | User asked for translation. | Mark future-only unless a real translation workflow exists. |
| `target_language_future` | Future target language value. | Requires localization review later. |
| `multilingual_layout_future` | Future multi-language layout. | Plan space but do not implement. |
| `translation_review_required` | Translation must be reviewed. | Required for future translated captions. |
| `cultural_context_review_needed` | Cultural/context review may be needed. | Required for sensitive localization. |
| `reading_speed_localization_future` | Reading speed may vary by language. | Future planning only. |
| `right_to_left_language_future` | RTL support may be needed. | Future planning only. |
| `line_break_language_rules_future` | Language-specific line rules may apply. | Future planning only. |

## Source, Proof, And Claim Safety

Captions can easily make unsupported claims feel official. Caption planning must be conservative.

Safety rules:

- Do not invent claims, names, prices, dates, metrics, UI labels, dashboards, websites, legal terms, medical claims, financial outcomes, customer quotes, or evidence pages.
- Do not rewrite a quote or testimonial into a stronger claim.
- Do not present a mock, placeholder, or generated future asset as proof.
- Do not use low-confidence transcript text without review.
- Do not treat a translated caption as approved unless review is documented.
- Do not convert a user request for vibe into an unverified caption claim.
- Marketing offer captions require exact user/source copy or explicit approval.
- Claim-sensitive captions may need legal, compliance, or user review before execution.

## Timing Around B-roll, Graphics, And Hero Visuals

Captions must coordinate with StoryTiming, B-roll, graphics, overlays, 3D, transitions, and audio.

Timing guidance:

- Captions under voiceover may continue while B-roll appears, but placement may need to move around full-frame, inset, PIP, split-screen, or browser/app visuals.
- Captions should not compete with a graphic card that carries the same information. Choose hierarchy or reduce one layer.
- Captions may be reduced, delayed, or repositioned for a 3D hero reveal, product breakout, proof screen, emotional close-up, or dense diagram.
- Captions should not flash across cut edges or transition impacts.
- Caption timing should respect minimum read time and maximum on-screen time.
- Caption entry/hold/exit should support speech rhythm, not just visual rhythm.
- StoryTiming handoff is required when caption timing conflicts with cuts, reveal events, overlay events, B-roll events, SFX, or music cues.

## Documentation-only Pseudo-record: CaptionTimingPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, or a caption rendering contract.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `caption_start_seconds` | Required | Planned caption start time. | `12.4` |
| `caption_end_seconds` | Required | Planned caption end time. | `15.1` |
| `duration_seconds` | Required | Planned on-screen duration. | `2.7` |
| `transcript_segment_id` | Optional | Source transcript segment reference if available. | `transcript_seg_014` |
| `word_index_start` | Optional | First source word index if word timing exists. | `42` |
| `word_index_end` | Optional | Last source word index if word timing exists. | `49` |
| `timing_anchor_type` | Required | Anchor basis for timing. | `speech_phrase` |
| `speech_anchor_text` | Optional | Phrase used as timing anchor. | `the fastest way to set this up` |
| `story_beat_anchor_id` | Optional | Related StoryTiming beat. | `beat_setup_payoff` |
| `transition_relationship` | Required | Relationship to transition/cut edges. | `hold_through_J_cut_then_exit_before_flash` |
| `B_roll_relationship` | Required | Relationship to B-roll timing. | `continues_over_inset_b_roll` |
| `graphic_relationship` | Required | Relationship to graphics/cards. | `delays_until_feature_card_exits` |
| `three_d_relationship` | Required | Relationship to 3D/hero visuals. | `reduced_during_hero_reveal` |
| `entry_timing` | Required | Entry timing behavior. | `enter_4_frames_after_phrase_start` |
| `hold_timing` | Required | Hold timing behavior. | `hold_until_sentence_break` |
| `exit_timing` | Required | Exit timing behavior. | `exit_before_next_cut` |
| `minimum_read_time_seconds` | Required | Minimum planned read time. | `1.4` |
| `maximum_on_screen_time_seconds` | Required | Maximum caption duration. | `4.0` |
| `sync_precision_needed` | Required | Precision need for sync. | `phrase_level` |

## Documentation-only Pseudo-record: CaptionTextPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, transcript processing, ASR, translation, or caption rendering.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `caption_text` | Required | Planned visible caption text. | `Set up your workspace first.` |
| `source_text` | Required | Source text before caption planning. | `The first thing is to set up your workspace.` |
| `source_type` | Required | Source type from the source model. | `transcript_segment` |
| `accuracy_status` | Required | Accuracy status from the accuracy model. | `cleaned_for_readability` |
| `language` | Required | Caption language. | `en-US` |
| `speaker_label` | Optional | Speaker label if needed. | `Host` |
| `line_break_strategy` | Required | Planned line break strategy. | `phrase_safe_two_line_max` |
| `max_lines` | Required | Maximum lines. | `2` |
| `words_per_line_target` | Required | Target words per line. | `5` |
| `characters_per_line_target` | Required | Target characters per line. | `32` |
| `punctuation_policy` | Required | Punctuation handling. | `light_punctuation_for_readability` |
| `filler_word_policy` | Required | Filler handling. | `remove_nonmeaning_fillers` |
| `profanity_or_sensitive_word_policy` | Required | Sensitive word handling. | `preserve_quote_or_request_review` |
| `quote_accuracy_required` | Required | Whether exact quote accuracy is required. | `true` |
| `claim_accuracy_required` | Required | Whether claim QA is required. | `true` |
| `translated_caption_future` | Optional | Future translated text placeholder. | `es-MX translation pending review` |
| `needs_user_review` | Required | Whether user review is needed before execution. | `false` |

## Documentation-only Pseudo-record: CaptionPlacementPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, layout engine, renderer, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `placement_zone` | Required | Named caption placement zone. | `lower_center_safe` |
| `screen_zone` | Required | Broader screen zone. | `lower_third` |
| `safe_area_strategy` | Required | Safe-area handling. | `platform_safe_margin_10_percent` |
| `platform_ui_margin_strategy` | Required | Platform UI avoidance strategy. | `avoid_reels_bottom_controls` |
| `face_avoidance_required` | Required | Whether face avoidance is required. | `true` |
| `mouth_region_protection` | Required | Mouth-region protection. | `protect_speaker_mouth_when_visible` |
| `eye_line_protection` | Required | Eye-line protection. | `avoid_eye_line_center_band` |
| `important_object_avoidance` | Required | Object avoidance rule. | `avoid_product_in_lower_right` |
| `product_action_avoidance` | Required | Product/action avoidance rule. | `do_not_cover_demo_click_path` |
| `caption_collision_strategy` | Required | Caption-to-caption collision strategy. | `merge_or_sequence_overlapping_caption` |
| `graphic_collision_strategy` | Required | Graphic collision strategy. | `move_above_feature_card_or_reduce_text` |
| `three_d_collision_strategy` | Required | 3D collision strategy. | `reduce_caption_during_object_pass` |
| `B_roll_collision_strategy` | Required | B-roll collision strategy. | `move_to_upper_safe_zone_during_PIP` |
| `lower_third_conflict_strategy` | Required | Lower-third conflict strategy. | `caption_delays_until_nameplate_exits` |
| `layer_order` | Required | Planned layer order. | `caption_above_video_below_proof_card` |
| `aspect_ratio_behavior` | Required | Aspect-ratio behavior. | `recalculate_zone_for_9_16_and_16_9` |
| `fallback_zone` | Required | Fallback placement if primary zone fails. | `upper_center_safe` |

## Documentation-only Pseudo-record: CaptionSkillPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, ASR, transcript processing, translation, caption rendering, worker execution, or app behavior.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable planning identifier. | `caption_skill_001` |
| `project_id` | Required | Project reference. | `project_demo_clip` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `edit_plan_segment_id` | Required | Segment reference. | `segment_hook` |
| `skill_key` | Required | Future skill key. | `caption.basic_readable` |
| `caption_role` | Required | Selected caption role. | `basic_readable_captions` |
| `caption_purpose` | Required | What captions accomplish. | `preserve speech meaning for no-audio viewers` |
| `planning_reason` | Required | Specific planning reason. | `The speaker gives setup steps that need readable support.` |
| `restraint_decision` | Required | Use, reduce, reject, or defer. | `use_restrained_caption_density` |
| `source_type` | Required | Caption source type. | `transcript_segment` |
| `accuracy_status` | Required | Caption accuracy status. | `exact_transcript` |
| `language` | Required | Caption language. | `en-US` |
| `caption_density` | Required | Density level. | `balanced` |
| `caption_start_seconds` | Required | Start time. | `12.4` |
| `caption_end_seconds` | Required | End time. | `15.1` |
| `transcript_segment_id` | Optional | Transcript segment reference. | `transcript_seg_014` |
| `caption_text` | Required | Planned caption text. | `Set up your workspace first.` |
| `line_break_strategy` | Required | Line break plan. | `phrase_safe_two_line_max` |
| `placement_zone` | Required | Placement zone. | `lower_center_safe` |
| `safe_area_strategy` | Required | Safe-area plan. | `avoid_face_and_platform_ui` |
| `caption_style_intent` | Required | Caption style intent. | `basic_readable` |
| `readability_strategy` | Required | Readability approach. | `high_contrast_two_line_maximum` |
| `animation_level` | Required | Animation/emphasis level. | `subtle_fade` |
| `keyword_emphasis_policy` | Required | Keyword emphasis rule. | `highlight_only_key_product_term` |
| `speaker_label_policy` | Required | Speaker label rule. | `omit_single_speaker_label` |
| `accessibility_notes` | Required | Accessibility notes. | `stable captions for no-audio viewing` |
| `translation_future_notes` | Optional | Future translation notes. | `Spanish translation would require review` |
| `graphic_relationship` | Required | Relationship to graphics. | `caption yields to product feature card` |
| `B_roll_relationship` | Required | Relationship to B-roll. | `caption continues over cutaway and moves above PIP` |
| `three_d_relationship` | Required | Relationship to 3D. | `caption reduced during 3D hero reveal` |
| `transition_relationship` | Required | Relationship to transitions. | `caption exits two frames before flash cut` |
| `audio_relationship_summary` | Required | Relationship to speech/music/SFX. | `speech-led timing; no beat override` |
| `credit_impact` | Required | Credit impact estimate category. | `none` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | QA checks to run later. | `readability, timing, source accuracy, collision` |
| `revision_options` | Required | User-facing revision options. | `make smaller, move higher, reduce density` |
| `lower_cost_alternative` | Required | Lower-cost or lower-complexity option. | `static captions instead of word-by-word animation` |
| `worker_notes` | Optional | Future worker boundary notes. | `caption rendering worker not unlocked by this doc` |
| `must_follow_rules` | Required | Must-follow rules. | `preserve meaning; avoid face/product; no invented claims` |
| `avoid_rules` | Required | Avoid rules. | `no random kinetic captions; no unsafe placement` |
| `status` | Required | Planning status. | `planned_pending_approval` |
| `metadata_json` | Optional | Future metadata bucket if implemented later. | `{ "docs_only": true }` |

## Scoring Model

Caption scoring is planning guidance only. It is not runtime logic, TypeScript, SQL, JSON schema, prompt code, or a weighted model.

Positive signals:

- Accessibility gain.
- Comprehension gain.
- Speech importance.
- Platform fit.
- User preference fit.
- Transcript confidence.
- Retention gain.

Risk signals:

- Collision risk.
- Readability risk.
- Density risk.
- Duplication risk.
- Quote/claim accuracy risk.
- User avoid penalty.
- Style/tone mismatch.

Documentation-only pseudo logic:

```text
caption_score =
  accessibility_gain
+ comprehension_gain
+ speech_importance
+ platform_fit
+ user_preference_fit
+ transcript_confidence
+ retention_gain
- collision_risk
- readability_risk
- density_risk
- duplication_risk
- quote_claim_accuracy_risk
- user_avoid_penalty
- style_tone_mismatch
```

Score interpretation:

- High positive score: captions likely improve the segment if source accuracy and placement pass QA.
- Mixed score: use restrained density, safer placement, or static style.
- Low score: use `no_captions`, reduce captions, defer for user approval, or choose another skill.

## Edit Preference And Workflow Context

Caption planning should respond to user preference and workflow context:

- If the user asks for clean, premium, cinematic, luxury, real estate, or emotional edits, choose restrained density and subtle animation unless accessibility requires more.
- If the user asks for social, retention, Shorts, Reels, TikTok, or creator pacing, consider bold/social captions, phrase reveals, and selective keyword emphasis.
- If the user asks for education, training, tutorial, internal comms, or accessibility, prioritize meaning, full-enough coverage, stable timing, and readable line breaks.
- If the user asks for no captions, plan `captions_disabled_by_user` or `no_captions` unless accessibility or delivery requirements override it.
- If a product demo or SaaS workflow is present, avoid hiding cursor paths, product actions, UI labels, and proof screens.
- If the transcript/source is incomplete, set review/deferral status rather than inventing text.
- If a caption style implies premium rendering, generated translation, or future worker work, include credit/approval notes.

## Relationships To Other Skills

Captions must coordinate with:

- Transitions: caption entry/exit should not make cut edges unreadable.
- Overlay/compositing: captions must avoid lower thirds, proof cards, browser/app frames, B-roll PIP, UI panels, and safe-area conflicts.
- Graphic Design / VisualExplain: captions should not duplicate cards, labels, diagrams, or proof text without purpose.
- Motion Design: caption motion must be meaningful, readable, comfortable, and not mechanically repeated.
- 3D Visual: captions may reduce, move, or pause around 3D hero reveals, spatial object movement, and depth/occlusion moments.
- B-roll: captions may continue under voiceover but must adapt to full-frame, inset, PIP, split-screen, and proof/context B-roll.
- SoundSync/music/SFX: captions must not ignore speech intelligibility, ducking, beat timing, or SFX emphasis; speech meaning remains primary.
- StoryTiming: captions must hand off conflicts with reveal events, cuts, B-roll, overlays, SFX, music cues, and QA.
- Stroke Motion and Real Motion: captions must not obscure drawn attention paths, object motion, proof overlays, or realistic visual effects.
- Browser/app visuals: captions must not invent UI/source details and must avoid blocking UI labels, dashboards, pages, and redaction areas.

## Credit And Approval Behavior

Caption planning must be approval-gated and credit-aware when needed.

No or low credit impact:

- Planning-only caption selection.
- Existing transcript/source text used with static captions.
- Minor line-breaking, density, and placement planning.

Approval required:

- Paraphrase that may change meaning.
- Quote/testimonial caption changes.
- Marketing offer, price, metric, legal, medical, finance, or claim-sensitive captions.
- Low-confidence transcript source.
- Translation or multilingual captions.
- Premium/generated/future caption animation or worker/provider work.
- Caption rendering/export work if implemented later.
- Any plan that conflicts with explicit "no captions" user preference.

Premium/generated/future work must include a credit estimate and user approval before execution. This document does not execute any such work.

## QA Doctrine

Caption QA must verify:

- Meaning is preserved.
- Source type and accuracy status are known.
- Quotes, claims, names, prices, metrics, dates, and product details are source-backed.
- Line breaks preserve phrases and do not create misleading emphasis.
- Read time is adequate.
- Text is readable at target aspect ratios.
- Contrast, size, background plate, stroke/shadow, and typography support readability.
- Captions avoid faces, mouth, eyes, product actions, important objects, UI, proof pages, lower thirds, graphics, B-roll insets, and 3D objects.
- Caption animation does not reduce readability or accessibility.
- Captions respect user preference, including no-caption requests.
- Captions coordinate with StoryTiming, cuts, transitions, B-roll, graphics, hero visuals, music, SFX, and speech.
- Translation/multilingual captions are clearly future/review-required if mentioned.

## Revision Behavior

Future caption plans should offer concrete revisions:

- Reduce or increase caption density.
- Switch from bold social to clean readable captions.
- Switch from word-by-word to phrase-by-phrase or static captions.
- Move captions higher/lower/left/right to avoid collisions.
- Add or remove keyword emphasis.
- Add or remove speaker labels.
- Preserve exact transcript instead of condensed text.
- Request user approval for paraphrase, claim, quote, or translation.
- Disable captions or use no captions for a segment.
- Re-run StoryTiming conflict review if captions move across cuts, B-roll, overlays, graphics, 3D, SFX, or music cues.

## Examples

These examples are planning examples only. They are not fixtures, prompts, runtime data, TypeScript, JSON schema, SQL, or renderer instructions.

### 1. Simple Clean Talking-head Edit

- `skill_key`: `caption.basic_readable`
- `caption_role`: `basic_readable_captions`
- `source_type`: `transcript_segment`
- `accuracy_status`: `cleaned_for_readability`
- `planning_reason`: Speech carries the setup and should remain understandable without audio.
- `restraint_decision`: Use balanced captions with static or subtle fade behavior.
- `caption_density`: `balanced`
- `timing_summary`: Phrase-level timing with minimum read time.
- `text_policy_summary`: Remove filler words only when meaning is unchanged.
- `placement_summary`: Lower center safe zone, face and platform UI avoided.
- `animation_level`: `subtle_fade`
- `relationship_to_other_skills`: Coordinate with StoryTiming cuts and any lower thirds.
- `credit_impact`: `none`
- `approval_required`: `false`
- `QA checks`: Source accuracy, read time, line breaks, safe area, face collision.

### 2. User Requested No Captions

- `skill_key`: `caption.no_captions`
- `caption_role`: `no_captions`
- `source_type`: `unknown_source`
- `accuracy_status`: `unknown`
- `planning_reason`: User explicitly requested no captions.
- `restraint_decision`: Reject caption execution unless accessibility or delivery requirements override it.
- `caption_density`: `none`
- `timing_summary`: No caption timing.
- `text_policy_summary`: No caption text.
- `placement_summary`: No placement.
- `animation_level`: `no_animation`
- `relationship_to_other_skills`: Preserve visual hierarchy for overlays, B-roll, graphics, and 3D.
- `credit_impact`: `none`
- `approval_required`: `false`
- `QA checks`: Confirm no captions are accidentally planned or rendered.

### 3. Social Short With Keyword Emphasis

- `skill_key`: `caption.keyword_emphasis`
- `caption_role`: `keyword_emphasis_captions`
- `source_type`: `transcript_segment`
- `accuracy_status`: `condensed_without_meaning_change`
- `planning_reason`: Short-form clip needs no-audio comprehension and selective retention support.
- `restraint_decision`: Use phrase captions with limited keyword emphasis.
- `caption_density`: `balanced`
- `timing_summary`: Phrase reveal anchored to speech rhythm and beat cues only where helpful.
- `text_policy_summary`: Condense lightly; do not change claims.
- `placement_summary`: Lower center safe zone with face and product avoidance.
- `animation_level`: `keyword_pop`
- `relationship_to_other_skills`: Coordinate with SoundSync beat timing and motion design comfort.
- `credit_impact`: `low`
- `approval_required`: `false` unless paraphrase changes meaning.
- `QA checks`: Keyword selection, timing, contrast, collision, density, repetition.

### 4. Premium Property Tour

- `skill_key`: `caption.minimal_phrase`
- `caption_role`: `minimal_phrase_captions`
- `source_type`: `transcript_segment`
- `accuracy_status`: `cleaned_for_readability`
- `planning_reason`: Captions should support narration without crowding room visuals.
- `restraint_decision`: Use restrained captions and let room labels carry some context.
- `caption_density`: `restrained`
- `timing_summary`: Captions appear after room reveal and avoid transition edges.
- `text_policy_summary`: Short phrases only; no extra claims about pricing or square footage.
- `placement_summary`: Lower safe zone unless room label occupies it, then upper safe fallback.
- `animation_level`: `subtle_fade`
- `relationship_to_other_skills`: Coordinate with graphic room labels, B-roll, and transitions.
- `credit_impact`: `none`
- `approval_required`: `true` for any property claim not in source.
- `QA checks`: Room label collision, proof/claim safety, readability, pacing.

### 5. Product Demo With Feature Card

- `skill_key`: `caption.product_feature`
- `caption_role`: `product_feature_captions`
- `source_type`: `transcript_segment`
- `accuracy_status`: `exact_transcript`
- `planning_reason`: Captions clarify spoken feature steps while graphic card names the feature.
- `restraint_decision`: Use captions but avoid duplicating the card.
- `caption_density`: `balanced`
- `timing_summary`: Caption delays while the feature card enters, then resumes under demo action.
- `text_policy_summary`: Keep exact product terms and avoid invented UI labels.
- `placement_summary`: Move captions above product action path when needed.
- `animation_level`: `phrase_reveal`
- `relationship_to_other_skills`: Coordinate with graphic design, overlays, B-roll, and browser/app safety.
- `credit_impact`: `low`
- `approval_required`: `true` for unverified product claims.
- `QA checks`: UI/action avoidance, graphic duplication, source accuracy, line breaks.

### 6. Education Explainer

- `skill_key`: `caption.educational_clear`
- `caption_role`: `educational_captions`
- `source_type`: `transcript_segment`
- `accuracy_status`: `cleaned_for_readability`
- `planning_reason`: Dense information needs readable, phrase-safe captions.
- `restraint_decision`: Use dense but structured captions.
- `caption_density`: `dense`
- `timing_summary`: Sentence/phrase timing with longer minimum read time.
- `text_policy_summary`: Preserve technical terms and exact definitions.
- `placement_summary`: Avoid diagrams and labels; use fallback zone when graphics appear.
- `animation_level`: `no_animation`
- `relationship_to_other_skills`: Coordinate with VisualExplain cards, StoryTiming, and motion design.
- `credit_impact`: `none`
- `approval_required`: `false` unless definitions are rewritten.
- `QA checks`: Term accuracy, line breaks, readability, diagram collisions, timing.

### 7. Podcast Clip With Speaker Identification

- `skill_key`: `caption.speaker_identification`
- `caption_role`: `speaker_identification_captions`
- `source_type`: `transcript_segment`
- `accuracy_status`: `exact_transcript`
- `planning_reason`: Multi-speaker audio needs speaker clarity.
- `restraint_decision`: Use concise speaker labels and stable captions.
- `caption_density`: `balanced`
- `timing_summary`: Captions switch at speaker turns with safe read time.
- `text_policy_summary`: Preserve quotes and speaker attribution.
- `placement_summary`: Avoid lower third nameplates and face crops.
- `animation_level`: `subtle_fade`
- `relationship_to_other_skills`: Coordinate with lower thirds, StoryTiming, and SoundSync speech safety.
- `credit_impact`: `none`
- `approval_required`: `true` for uncertain speaker labels.
- `QA checks`: Speaker identity, quote accuracy, lower-third collision, timing.

### 8. Marketing Ad With Offer Or CTA

- `skill_key`: `caption.marketing_offer`
- `caption_role`: `marketing_offer_captions`
- `source_type`: `user_provided_script`
- `accuracy_status`: `user_approved_text`
- `planning_reason`: CTA and offer text must be readable and source-approved.
- `restraint_decision`: Use captions only where they support the offer without overclaiming.
- `caption_density`: `restrained`
- `timing_summary`: CTA caption holds long enough for reading and exits before end card.
- `text_policy_summary`: Use exact approved offer copy; no invented pricing or deadlines.
- `placement_summary`: Avoid CTA button, product, and platform UI zones.
- `animation_level`: `subtle_slide`
- `relationship_to_other_skills`: Coordinate with graphic design proof cards, overlays, and transitions.
- `credit_impact`: `low`
- `approval_required`: `true`
- `QA checks`: Claim safety, exact offer copy, contrast, end-card collision.

### 9. B-roll Under Voiceover

- `skill_key`: `caption.b_roll_voiceover`
- `caption_role`: `captions_repositioned_for_overlay`
- `source_type`: `transcript_segment`
- `accuracy_status`: `cleaned_for_readability`
- `planning_reason`: Voiceover remains important while inset B-roll appears.
- `restraint_decision`: Continue captions, but move around inset/PIP B-roll.
- `caption_density`: `balanced`
- `timing_summary`: Caption timing follows voiceover, not B-roll cut rhythm.
- `text_policy_summary`: Preserve voiceover meaning.
- `placement_summary`: Move to upper safe zone during lower-right PIP.
- `animation_level`: `subtle_fade`
- `relationship_to_other_skills`: Coordinate with B-roll, overlay/compositing, and StoryTiming.
- `credit_impact`: `none`
- `approval_required`: `false`
- `QA checks`: PIP collision, read time, source accuracy, safe area.

### 10. 3D Hero Visual

- `skill_key`: `caption.hero_reduced`
- `caption_role`: `captions_reduced_for_hero_visual`
- `source_type`: `transcript_segment`
- `accuracy_status`: `condensed_without_meaning_change`
- `planning_reason`: 3D product reveal needs visual priority while preserving key phrase.
- `restraint_decision`: Reduce captions during the hero moment and resume after reveal.
- `caption_density`: `hero_reduced`
- `timing_summary`: Caption exits before object reveal, returns after hold.
- `text_policy_summary`: Keep only the key phrase; avoid product claim expansion.
- `placement_summary`: Use upper safe zone or pause captions if spatial object crosses text zone.
- `animation_level`: `captions_static_during_hero_visual`
- `relationship_to_other_skills`: Coordinate with 3D visual, motion design, transitions, and SoundSync.
- `credit_impact`: `low`
- `approval_required`: `true` if 3D/premium work is generated later.
- `QA checks`: 3D occlusion, object collision, read time, claim safety.

## Anti-patterns

Fail future caption planning when it includes:

- Caption name only, such as "use captions" with no source, accuracy, timing, placement, or QA.
- Skill-name-only execution.
- Captions everywhere after the user says no captions.
- Unreadable tiny captions.
- Captions too dense to read.
- Random kinetic captions.
- The same caption animation repeated mechanically.
- Captions covering faces, mouths, or eyes.
- Captions covering product action, cursor paths, important objects, UI, proof pages, or CTAs.
- Captions colliding with 3D, graphics, B-roll, lower thirds, overlays, browser/app frames, or platform UI.
- Captions duplicating graphic text without purpose.
- Captions changing meaning.
- Captions inventing or exaggerating claims.
- Low-confidence transcript used without review.
- Quote or testimonial paraphrased without approval.
- Translated captions used without review.
- Captions chosen before the creative concept and edit preference are understood.
- Premium/generated caption work without credit estimate.
- Premium/generated caption work without approval.
- Worker execution from raw prompt only.
- Runtime code, TypeScript, migrations, installs, package mutations, ASR, transcript processing, translation, caption rendering, provider calls, or render/export unlocks in a docs-only prompt.

## Future Implementation Notes

If caption skills are eventually approved, future implementation may need records or typed contracts similar to these names, but none are created now:

- `caption_plans`
- `caption_text_plans`
- `caption_timing_plans`
- `caption_placement_plans`
- `caption_style_plans`
- `caption_animation_plans`
- `caption_accuracy_review_records`
- `caption_translation_plans_future`
- `caption_qa_requirements`
- `edit_plan_skill_routes` with caption-related skill keys
- `transcript_segments` references
- `overlay_compositing_plans`
- `graphic_design_plans`
- `motion_design_plans`
- `b_roll_plans`
- `three_d_visual_plans`
- `storytiming_coordination_records`

Future implementation must reconcile existing source truths before adding any schema, types, workers, prompts, provider calls, render/export behavior, caption rendering, ASR, transcript processing, or UI.

## Duplicate And Overlap Notes

Direct Creative Skill caption doctrine lives in `docs/creative-skills/` only.

Existing owners already cover caption and transcript-adjacent behavior:

- `caption-readability-motion-policy.md` exists and owns caption readability/motion policy guidance.
- `docs/caption-cut-timing-integration.md` documents caption/cut timing integration with StoryTiming.
- `docs/production-caption-artifact-policy.md`, `docs/production-caption-execution-policy.md`, `docs/production-caption-preview-policy.md`, and `docs/production-caption-qa-policy.md` cover production caption artifact, execution, preview, and QA boundaries.
- `docs/production-speech-caption-foundation.md` and `docs/production-speech-caption-runbook.md` cover speech/caption foundation and runbook boundaries.
- `src/types/reeditpro.ts` owns `CaptionStyleId`, `CaptionReadabilityRisk`, `CaptionVisualCueTimingPlan`, and related app-level caption types.
- `src/types/storytiming.ts` owns `CaptionTimingPlanRecord`.
- `src/types/edit-quality.ts` and `src/types/edit-planning-db.ts` include caption plan records.
- `src/lib/professional-editing-ontology.ts` owns current caption style presets.
- `src/lib/caption-timing-policy.ts`, `src/lib/caption-visual-cue-timing-planner.ts`, `src/lib/timing-validation.ts`, `src/lib/edit-qa-planner.ts`, `src/lib/mock-planner.ts`, and `src/lib/planner-validation.ts` already participate in caption planning, timing, validation, QA, and mock planner flows.
- `src/backend/services/storytiming-caption-service.ts`, `src/backend/services/storytiming-caption-readability-service.ts`, `src/backend/services/storytiming-caption-conflict-service.ts`, and `src/backend/services/storytiming-caption-cut-qa-service.ts` cover mock/backend StoryTiming caption services.
- Render/export and worker boundaries already exist in production caption docs and must not be bypassed.

Future caption skill work must reference these owners rather than creating parallel caption style types, transcript records, ASR flows, caption timing services, render/export caption lanes, worker contracts, QA records, or UI behavior.

Required browser/app capture planning files are missing in the current repo snapshot:

- `browser-app-capture-planning.md`
- `browser-capture-settings-catalog.md`
- `src/lib/browser-capture-planner.ts`

Future browser/app caption planning must reconcile those missing paths before claiming a browser capture planning contract exists.

## RP-SKILLS-10 Handoff

Recommended next prompt:

`RP-SKILLS-10 - Sound/Music Planning Contract`

Allowed scope for `RP-SKILLS-10`:

- Docs-only SoundSync, music, and SFX planning contract under `docs/creative-skills/`.
- Inherit the universal, transition, overlay/compositing, graphic design, motion design, 3D visual, B-roll, and caption contracts where relevant.
- Define music roles, mood, energy curve, cue points, beat maps, ducking, speech safety, lyrics policy, ambient preservation, room tone, transition SFX, signature-skill sound support, credit/approval behavior, sound/music QA, revision behavior, and anti-patterns.

Forbidden scope for `RP-SKILLS-10` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- ASR, transcript processing, translation, caption rendering, audio generation, audio processing, browser/capture/media/generation runtime, prompt router changes, render/export, Playwright execution, animation code, design-token changes, or app behavior.
