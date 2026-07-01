# B-roll Planning Contract

## Purpose

This document defines the B-roll-specific planning contract for future ReeditPro B-roll skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, capture code, media analysis code, generation code, stock/search integrations, model loading, package changes, Supabase connections, SQL, credentials, browser runtime, WebGL/canvas runtime, 3D runtime, AI calls, video/image/audio/3D provider calls, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It references [transition-planning-contract.md](transition-planning-contract.md) where B-roll bridges cuts or scene changes. It references [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) where B-roll appears as inset, picture-in-picture, split-screen, or overlay. It references [graphic-design-planning-contract.md](graphic-design-planning-contract.md) where B-roll needs labels, proof cards, source notes, or context graphics. It references [motion-design-planning-contract.md](motion-design-planning-contract.md) where B-roll has movement, reveal, inset motion, pacing, or rhythm. It references [three-d-visual-planning-contract.md](three-d-visual-planning-contract.md) where B-roll may be 3D object B-roll or a lower-integration 3D alternative.

This document defines B-roll-specific fields and rules that future docs, types, schema, workers, source selection systems, provider plans, render plans, and QA systems must follow if B-roll skills are eventually implemented.

## B-roll Doctrine

B-roll must not be random filler.

B-roll should support meaning, proof, context, pacing, product clarity, location clarity, process clarity, story emotion, or visual rhythm. B-roll should not hide the speaker or main footage when the speaker, expression, gesture, product action, or source moment matters more. B-roll should not be used just to make the edit look busy.

A premium edit can be visually rich with B-roll, but B-roll density must be intentional. A no-B-roll decision can be professional. Every B-roll choice needs a source, a role, a timing reason, and QA.

Core principle:

"Every B-roll shot must answer what it proves, clarifies, covers, or emotionally supports."

## Universal, Transition, Overlay, Graphic Design, Motion, And 3D Inheritance

Every `BRollSkillPlan` inherits the universal skill planning envelope from RP-SKILLS-02:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

B-roll references RP-SKILLS-03 when it bridges cuts or scenes:

- Cut/transition relationship.
- Ambient/sound bridge behavior.
- Transition QA.
- Speech-safety behavior around J-cuts, L-cuts, and voiceover.

B-roll references RP-SKILLS-04 when it is inset, picture-in-picture, split-screen, or layered:

- Full-frame, inset, picture-in-picture, and split-screen composition.
- Screen zone.
- Safe area.
- Caption collision.
- Layer order.
- Aspect ratio behavior.

B-roll references RP-SKILLS-05 when it needs labels, proof cards, context cards, source notes, or explanation:

- Labels/proof cards/context cards/source notes around B-roll.
- Information hierarchy for B-roll explanations.
- Typography and readability around B-roll.

B-roll references RP-SKILLS-06 when it moves or affects rhythm:

- B-roll movement, reveal, inset motion, and screen focus motion.
- Timing/rhythm/beat behavior.
- Repetition avoidance and comfort.

B-roll references RP-SKILLS-07 when B-roll is 3D or a 3D alternative:

- 3D object B-roll.
- 3D explainer B-roll.
- B-roll as a lower-integration alternative to 3D overlay.
- 3D source/model/provenance caution.

This B-roll contract adds:

- B-roll role.
- Source type.
- Source status.
- Proof/context level.
- Existing footage versus generated/future source.
- Full-frame versus inset/PIP/split-screen.
- Speaker relationship.
- Spoken phrase/story beat support.
- Source/proof safety.
- Audio relationship.
- Caption relationship.
- B-roll-specific QA.

Do not duplicate the full universal, transition, overlay/compositing, graphic design, motion design, or 3D visual contracts except when referencing inheritance.

## B-roll Role Family

These roles are guidance, not hard-coded execution. A future planner should choose the role because it fits the moment, not because the edit needs generic visual variety.

| Role | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `no_b_roll` | Intentional absence of B-roll. | Emotional close-up, strong source footage, simple clean edit. | Speaker needs cut cover or visual proof. | `none` | A valid professional decision. |
| `source_clip_cutaway` | Cutaway from existing source clip. | Hide cut, support spoken point, show detail. | Source does not match meaning. | `none` / `low` | Prefer existing source when useful. |
| `proof_visual` | Visual that supports a claim. | Testimonials, case studies, product proof. | Source is unverified. | `low` / `medium` | Must not overclaim. |
| `context_visual` | Visual that gives setting or background. | Location, process, story setup. | Generic or distracting context. | `none` / `low` | Supports understanding. |
| `visual_break` | Short relief from talking-head frame. | Long talking-head section. | Speaker emotion matters more. | `low` | Must still support meaning. |
| `cut_cover` | B-roll used to hide edit, stumble, or jump cut. | Removing filler words or a bad splice. | Cut can stay clean without hiding. | `none` / `low` | Should not feel like filler. |
| `product_detail` | Close detail of product/object. | Product demo, ecommerce, feature callout. | Product action needs full frame. | `low` / `medium` | Can pair with labels. |
| `location_detail` | Place, room, street, exterior, or environmental detail. | Property, travel, lifestyle, event. | Location detail is irrelevant. | `none` / `low` | Supports place clarity. |
| `process_step` | Visual step in a process. | Tutorials, education, product workflow. | Step is unclear or out of order. | `low` / `medium` | Timing must match explanation. |
| `before_after_visual` | Before/after comparison. | Transformation, renovation, results. | Source is not verified. | `medium` | Can need split-screen. |
| `emotional_support_visual` | Visual that supports feeling or tone. | Personal story, testimonial, lifestyle. | Feels manipulative or generic. | `low` / `medium` | Use lightly. |
| `environment_establishing_visual` | Establishing shot or place mood. | Vlog, property, documentary, travel. | The scene is already clear. | `low` | Keep duration intentional. |
| `screen_app_visual` | Screen/app visual from safe source. | Product demo, SaaS, tutorial. | Source status unknown. | `medium` | Needs browser/app safety. |
| `browser_page_visual` | Browser page visual from safe source. | Article, webpage, landing page, proof context. | Invented page or sensitive data. | `medium` | Requires source/redaction plan. |
| `dashboard_visual` | Dashboard or analytics visual. | SaaS, case study, proof. | Metrics unverified. | `medium` | Never invent metrics. |
| `article_or_evidence_visual` | Article, document, receipt, proof page, or evidence-like visual. | Documentary, case study, proof. | Claim-sensitive without verification. | `medium` | Needs wording caution. |
| `testimonial_context_visual` | Context around a testimonial. | Customer, location, product in use. | Lowers trust or feels staged. | `low` / `medium` | Trust-first pacing. |
| `social_proof_visual` | Review, customer count, logo wall, or public proof visual. | Marketing, case study. | Unverified proof. | `medium` | Needs source/proof safety. |
| `stock_visual_future` | Future stock/library B-roll candidate. | Missing source footage, generic context. | Would feel generic or unlicensed. | `medium` / `high` | Future rights-aware lane only. |
| `user_provided_asset_visual` | User-supplied image, video, screenshot, or asset. | Brand, proof, product, screen. | Source unclear or sensitive. | `low` / `medium` | May need redaction. |
| `generated_visual_future` | Future generated image/video B-roll candidate. | Premium concept without source. | No approval or credit budget. | `high` / `premium` | Future provider-gated only. |
| `three_d_object_broll` | 3D object used as B-roll. | Product/object explanation without overlay integration. | Live source B-roll is clearer. | `high` / `premium` | References RP-SKILLS-07. |
| `three_d_explainer_broll` | 3D explainer sequence as B-roll. | Education, product mechanics, spatial systems. | 2D diagram is clearer. | `high` / `premium` | Approval-aware. |
| `real_motion_alternative_visual` | B-roll chosen instead of Real Motion overlay. | Lower-cost proof/context alternative. | Realistic overlay is user-approved and needed. | `medium` / `high` | Keeps Real Motion lane distinct. |
| `full_frame_b_roll` | B-roll takes over full frame. | Strong source/proof/context or voiceover. | Speaker should stay visible. | `low` / `medium` | Must be earned. |
| `inset_b_roll` | B-roll appears in a smaller framed area. | Preserve speaker while showing context. | Small unreadable source. | `low` / `medium` | Inherits overlay rules. |
| `picture_in_picture_b_roll` | B-roll and speaker/source appear together. | Tutorials, product demos, screen demos. | Cluttered captions or tiny faces. | `low` / `medium` | PIP must be caption-safe. |
| `split_screen_b_roll` | B-roll shares frame with speaker/other visual. | Comparisons, before/after, proof. | Too dense for mobile. | `medium` | Needs layout and hierarchy. |
| `montage_b_roll` | Multiple B-roll shots in a sequence. | Travel, vlog, social, launch. | Serious proof or dense explanation. | `medium` / `high` | Rhythm must be intentional. |
| `transition_bridge_b_roll` | B-roll bridges scenes or segments. | Scene change, cut cover, mood bridge. | Random transition filler. | `low` / `medium` | May need ambient bridge. |

## Source Type And Source Status Model

### Source Types

| Source type | Meaning | Rule |
| --- | --- | --- |
| `existing_source_clip` | Existing project video clip. | Prefer when it supports meaning. |
| `uploaded_user_asset` | User-uploaded image/video/asset. | Treat as user-provided, still check sensitivity. |
| `user_provided_screenshot` | Screenshot uploaded or supplied by user. | Needs source/redaction status. |
| `user_provided_screen_recording` | User-supplied screen recording. | Needs redaction/source safety. |
| `reference_video_influence_only` | Reference video influences style or pacing only. | Must not become copied B-roll. |
| `authorized_browser_capture_later` | Future authorized capture may be used. | Does not imply capture exists now. |
| `internal_mock` | Internal mock or placeholder. | Use safe wording; not proof. |
| `stock_library_future` | Future stock/library candidate. | Rights-aware future lane only. |
| `generated_image_future` | Future generated image candidate. | Requires credit/approval later. |
| `generated_video_future` | Future generated video candidate. | Requires credit/approval later. |
| `three_d_generated_future` | Future 3D-generated B-roll. | References RP-SKILLS-07 and approval. |
| `real_motion_generated_future` | Future Real Motion-style visual alternative. | Premium, approval-gated. |
| `procedural_graphic_or_renderer_future` | Future renderer/procedural visual. | Future runtime gate only. |
| `unknown_source` | Source is unknown. | Cannot be proof. |

### Source Status Values

| Source status | Meaning | Rule |
| --- | --- | --- |
| `verified_user_provided` | User supplied and source is clear. | Can be used if privacy-safe. |
| `project_source_footage` | Existing uploaded source footage. | Prefer for source-first edits. |
| `transcript_derived` | Candidate inferred from transcript only. | Needs actual source selection later. |
| `claimed_by_user` | User claims source but not verified. | Use safe wording and confirmation. |
| `reference_dna_only` | Reference influence only. | Do not copy source shots. |
| `mock_only` | Placeholder planning only. | Must not imply proof. |
| `needs_confirmation` | User confirmation needed. | Do not execute. |
| `needs_authorization` | Capture/use authorization needed. | Do not execute. |
| `needs_rights_review` | License or rights review needed. | Do not execute. |
| `needs_redaction` | Sensitive data needs redaction. | Plan redaction before use. |
| `unknown` | Status unknown. | Not proof. |
| `not_allowed` | Source is disallowed. | Do not use. |

Rules:

- Reference video influence must not become copied B-roll.
- Do not invent exact screen/app/browser/evidence visuals.
- Do not claim stock/generated assets exist in docs-only planning.
- User-provided/private/sensitive material needs source status and possible redaction.
- Generated/future B-roll requires approval and credit estimate before execution.
- Unknown source cannot be treated as proof.

## B-roll Proof/Context Level Model

B-roll should not make a claim stronger than the source supports.

| Proof/context level | Meaning | When to use | Source requirements | Wording/QA caution |
| --- | --- | --- | --- | --- |
| `none` | No proof/context function. | Cut cover or visual break. | Source still needs relevance. | Avoid implying proof. |
| `atmospheric` | Mood or feeling support. | Vlog, lifestyle, travel. | Source should match story tone. | Do not overstate meaning. |
| `illustrative` | Shows a general idea. | Explainers, concepts. | Can be source or future generated. | Mark as illustrative if needed. |
| `contextual` | Provides place, background, or situation. | Location, product setting, process. | Source should be related. | Avoid false specificity. |
| `supporting` | Supports spoken point. | Product, education, demo. | Source should map to phrase. | QA meaning alignment. |
| `proof_like` | Looks like proof but may not be formal evidence. | Testimonial, case study. | Source status clear. | Avoid claim inflation. |
| `evidence_like` | Used as evidence/document/screen/proof. | Documentary, article, dashboard. | Verified source and redaction. | Strong source/proof QA. |
| `claim_sensitive` | Could affect legal/compliance/trust. | Metrics, pricing, reviews, health/finance/legal. | Confirmation and safe wording. | May need disclaimer/user confirmation. |

Proof-like and evidence-like B-roll must be source-aware. Claim-sensitive B-roll may need compliance, disclaimer, or user confirmation. Unknown source cannot be treated as verified proof.

## Full-frame Versus Inset/PIP/Split-screen Model

Full-frame B-roll hides the speaker/main footage, so it must be earned. Inset/PIP can preserve the speaker while showing proof/context. Split-screen works for comparisons but can become cluttered. Aspect ratio, platform UI, and caption zones matter. Inset/PIP/split-screen inherit overlay/compositing rules from RP-SKILLS-04.

| Display mode | What it is | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `full_frame_takeover` | B-roll fully takes over the frame. | Strong proof, voiceover, hero context. | Speaker emotion matters. | Earn the takeover. |
| `full_frame_cutaway` | Short full-frame cutaway. | Detail, context, cut cover. | Generic filler. | Keep timing tight. |
| `quick_cutaway` | Very brief insert. | Hide jump cut, quick proof. | Needs reading or inspection. | Must be comprehensible. |
| `partial_overlay` | B-roll sits over part of frame. | Source detail with speaker visible. | Collision-heavy layout. | Inherits overlay rules. |
| `inset_card` | B-roll in framed inset. | Proof/context next to speaker. | Tiny unreadable screen. | May need label. |
| `picture_in_picture` | Speaker and B-roll visible together. | Tutorials, product demos, reactions. | Caption clutter. | PIP must be face-safe. |
| `split_screen` | Screen divided between visuals. | Comparisons and before/after. | Mobile readability risk. | Coordinate captions. |
| `side_by_side` | Two equal or near-equal panels. | Speaker plus proof, comparison. | Dense labels. | Needs hierarchy. |
| `before_after_split` | Before/after layout. | Transformation and renovation. | Unverified comparison. | Source status matters. |
| `browser_frame_inset` | Browser/app visual in frame. | SaaS, evidence, tutorial. | Unknown source. | Redaction and source safety. |
| `product_detail_inset` | Product detail inset. | Product demo and feature. | Detail too small. | Use graphic label if needed. |
| `background_layer` | B-roll as background texture/scene. | Mood, title, context. | Distracts from text/speaker. | Keep subtle. |
| `texture_or_atmosphere_layer` | Abstract/mood layer. | Brand, lifestyle, vibe. | Proof moments. | Avoid generic filler. |
| `no_display` | No B-roll shown. | Speaker/main footage stronger. | Cut needs cover. | Valid restraint. |

## When To Use B-roll

Use B-roll when:

- Speaker mentions a product, object, place, process, customer, result, or screen.
- Spoken concept needs visual support.
- Viewer needs proof or context.
- Edit needs to hide a cut, remove a stumble, or smooth a jump.
- Pacing needs a meaningful visual break.
- Long talking-head section needs meaningful variation.
- Process or step needs demonstration.
- Product demo needs detail shot.
- Real estate/property tour needs room or location context.
- Education/explainer needs supporting example.
- Marketing/ad needs proof, offer, product, or result visual.
- Testimonial/case study needs customer, context, or proof visual.
- Screen/app/browser content needs user-provided or authorized visual support.
- Source footage contains useful detail shots.
- B-roll is a better/lower-cost alternative to 3D/Real Motion.
- User edit preference supports visual richness.

## When To Avoid B-roll

Avoid, delay, or replace B-roll when:

- The user requested clean, simple, minimal, or no extra visuals.
- Speaker expression/emotion matters more than cutaway.
- B-roll is generic filler.
- B-roll does not match spoken meaning.
- Source status is unclear.
- B-roll would imply false proof/evidence.
- B-roll would hide important product/action.
- B-roll would collide with captions, graphics, 3D, or overlays.
- B-roll repeats the same type too often.
- B-roll breaks spatial/story continuity.
- B-roll lowers trust in testimonial/case study.
- Stock/generated B-roll would feel generic.
- Credit budget does not support generated/future B-roll.
- A graphic, caption, clean cut, or no extra visual is clearer.
- Source B-roll quality is too poor or off-tone.

## B-roll Density Model

B-roll density is not quality. Rich B-roll can be professional when earned. Minimal B-roll can be premium when the speaker/story should lead.

| Density | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No B-roll. | Emotional speaker moment or strong source. | May miss needed context. | Emotional speaker moment stays on face. |
| `minimal` | One or two essential inserts. | Clean edit, podcast, personal brand. | Still feels static if topic needs proof. | One quick product cutaway. |
| `restrained` | Purposeful, sparse support visuals. | Premium real estate, case study, testimonial. | Too slow for social. | Real estate detail shots. |
| `balanced` | B-roll for key support/proof/context. | Education, business, storytelling. | Can become routine. | Education clip with examples. |
| `rich` | Frequent meaningful B-roll. | Product demo, social, launch. | Hides speaker too often. | Product demo with cutaways. |
| `montage` | Sequential B-roll-driven rhythm. | Travel, vlog, social sequence. | Can lose meaning. | Travel/vlog montage. |
| `hero` | Major full-frame visual payoff. | Product/location/proof reveal. | Premium moment feels unearned. | Full-frame product reveal. |

## BRollTimingPlan Pseudo-Record

`BRollTimingPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, prompt runtime, capture runtime, generation runtime, or executable contract.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `b_roll_start_seconds` | Required | Planned timeline start. | `18.2` |
| `b_roll_end_seconds` | Required | Planned timeline end. | `22.6` |
| `duration_seconds` | Required | Total visible duration. | `4.4` |
| `source_start_seconds` | Optional | Source clip in-point. | `3.1` |
| `source_end_seconds` | Optional | Source clip out-point. | `7.5` |
| `timing_anchor_type` | Required | Anchor type such as transcript, story beat, cut cover, product action, music, or transition. | `spoken_product_phrase` |
| `transcript_anchor_text` | Optional | Spoken phrase supported. | `the filter locks in place` |
| `transcript_anchor_id` | Optional | Transcript token/phrase id. | `tr_0042` |
| `story_beat_anchor_id` | Optional | StoryTiming beat id. | `beat_feature_demo` |
| `cut_cover_target` | Optional | Cut/stumble covered by B-roll. | `remove filler at 00:19.1` |
| `transition_relationship` | Required | Transition/cut relationship. | `bridges_to_demo_closeup` |
| `caption_relationship_timing` | Required | Relationship to captions. | `caption remains readable below inset` |
| `music_beat_anchor` | Optional | Music beat anchor. | `downbeat_12` |
| `pre_roll_buffer` | Required | Buffer before B-roll starts. | `0.2` |
| `post_roll_buffer` | Required | Buffer after B-roll ends. | `0.3` |
| `minimum_read_or_view_time` | Required | Minimum time for viewer comprehension. | `2.0` |
| `sync_precision_needed` | Required | Timing precision requirement. | `cut_cover_frame_safe` |

## BRollSourceSelectionPlan Pseudo-Record

`BRollSourceSelectionPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, stock/search integration, media analysis runtime, prompt runtime, or executable contract.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `source_type` | Required | Source type. | `existing_source_clip` |
| `source_status` | Required | Source status. | `project_source_footage` |
| `source_asset_id` | Optional | Media asset id. | `asset_product_detail_01` |
| `source_clip_id` | Optional | Source clip id. | `clip_demo_b` |
| `source_reference` | Required | Human-readable source reference. | `uploaded product close-up` |
| `selected_moment_summary` | Required | What moment is selected. | `product latch closing` |
| `spoken_phrase_supported` | Required | Spoken phrase/story point supported. | `locks in place` |
| `visual_relevance_reason` | Required | Why source matches meaning. | `Shows the exact latch action being described.` |
| `proof_context_level` | Required | Proof/context level. | `supporting` |
| `quality_notes` | Required | Visual quality/tone notes. | `stable close-up, warm color, usable` |
| `rights_or_authorization_notes` | Required | Rights/source authorization. | `project source footage` |
| `redaction_needed` | Required | Whether redaction is needed. | `false` |
| `sensitive_data_notes` | Optional | Sensitive data notes. | `no visible account data` |
| `fallback_source_option` | Required | Fallback if source is unavailable or unsafe. | `graphic feature card` |
| `generated_future_required` | Required | Whether future generated B-roll is required. | `false` |
| `user_confirmation_required` | Required | Whether user confirmation is required. | `false` |

## BRollCompositionPlan Pseudo-Record

`BRollCompositionPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, render runtime, capture runtime, or executable contract.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `b_roll_role` | Required | Selected B-roll role. | `product_detail` |
| `display_mode` | Required | Display mode. | `inset_card` |
| `screen_zone` | Required | Planned screen zone. | `right_mid_safe_zone` |
| `safe_area_strategy` | Required | Safe-area behavior. | `avoid face and captions` |
| `face_relationship` | Required | Relationship to face/expression. | `speaker remains visible left` |
| `speaker_visibility_strategy` | Required | Whether speaker remains visible. | `speaker PIP maintained` |
| `caption_collision_strategy` | Required | Caption collision plan. | `captions below, inset above lower third` |
| `graphic_label_relationship` | Required | Label/proof/context card relationship. | `small product label only` |
| `overlay_composition_reference` | Optional | Link/reference to overlay rules if needed. | `RP-SKILLS-04 inset rules` |
| `motion_design_relationship` | Required | Motion/reveal relationship. | `soft inset slide, no bounce` |
| `transition_relationship` | Required | Transition relationship. | `covers cut into demo segment` |
| `layer_order` | Required | Planned layer order. | `base video, B-roll inset, label, captions` |
| `aspect_ratio_behavior` | Required | Behavior across aspect ratios. | `vertical inset becomes top third` |
| `platform_ui_margin_strategy` | Required | Platform UI margin behavior. | `avoid TikTok right rail` |
| `source_status_display_needed` | Required | Whether source/context label is needed. | `false` |
| `redaction_display_strategy` | Required | Redaction display behavior. | `none` |

## BRollAudioRelationshipPlan Pseudo-Record

`BRollAudioRelationshipPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, audio runtime, prompt runtime, or executable contract.

B-roll often plays under voiceover/speech. Original source audio may need muting, ambience preservation, or room tone bridge. B-roll should not create jarring audio unless intentionally planned. Full sound/music contract belongs to RP-SKILLS-10.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `original_audio_used` | Required | Whether original B-roll audio is used. | `false` |
| `original_audio_muted` | Required | Whether original B-roll audio is muted. | `true` |
| `ambience_preserved` | Required | Whether ambience remains. | `false` |
| `room_tone_bridge_needed` | Required | Whether room tone bridge is needed. | `true` |
| `music_relationship` | Required | Music relationship. | `music bed continues softly` |
| `beat_sync_needed` | Required | Whether beat sync is needed. | `false` |
| `sfx_needed` | Required | Whether SFX is needed. | `false` |
| `speech_ducking_needed` | Required | Whether speech ducking is needed. | `false` |
| `voiceover_continues_under_broll` | Required | Whether voiceover continues under B-roll. | `true` |
| `dialogue_replaced_or_covered` | Required | Whether dialogue is replaced/covered. | `false` |
| `audio_tail_strategy` | Required | Audio tail strategy. | `clean return to source room tone` |
| `silence_preservation` | Required | Whether silence should be preserved. | `preserve pause before testimonial line` |
| `audio_qa_notes` | Required | Audio QA notes. | `no abrupt ambience jump` |

## BRollSkillPlan Pseudo-Record

`BRollSkillPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, prompt runtime, capture runtime, media analysis runtime, search integration, provider call, or executable contract. It includes universal fields by reference and adds B-roll-specific fields.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable future plan id. | `broll_plan_product_detail_01` |
| `project_id` | Required | Project id. | `project_123` |
| `edit_plan_id` | Required | Edit plan id. | `edit_plan_v5` |
| `edit_plan_segment_id` | Required | Segment id. | `segment_04` |
| `skill_key` | Required | Skill key. | `b_roll_planning` |
| `b_roll_role` | Required | Selected B-roll role. | `product_detail` |
| `b_roll_purpose` | Required | Why B-roll exists. | `clarify latch action` |
| `planning_reason` | Required | Meaning/taste reason. | `The detail shot shows the exact product action described.` |
| `restraint_decision` | Required | Restraint decision. | `use_source_broll_not_generated` |
| `source_type` | Required | Source type. | `existing_source_clip` |
| `source_status` | Required | Source status. | `project_source_footage` |
| `source_asset_id` | Optional | Source asset id. | `asset_17` |
| `selected_moment_summary` | Required | Selected source moment. | `close-up of latch clicking shut` |
| `spoken_phrase_supported` | Required | Supported phrase/story point. | `locks in place` |
| `proof_context_level` | Required | Proof/context level. | `supporting` |
| `display_mode` | Required | Display mode. | `inset_card` |
| `b_roll_start_seconds` | Required | Timeline start. | `18.2` |
| `b_roll_end_seconds` | Required | Timeline end. | `22.6` |
| `duration_seconds` | Required | Visible duration. | `4.4` |
| `source_start_seconds` | Optional | Source in-point. | `3.1` |
| `source_end_seconds` | Optional | Source out-point. | `7.5` |
| `screen_zone` | Required | Screen zone. | `right_mid_safe_zone` |
| `speaker_visibility_strategy` | Required | Speaker visibility. | `speaker remains visible left` |
| `caption_relationship` | Required | Caption relationship. | `captions remain bottom and above all layers` |
| `graphic_label_relationship` | Required | Graphic/label relationship. | `one small feature label` |
| `transition_relationship` | Required | Transition/cut relationship. | `covers jump cut` |
| `motion_design_relationship` | Required | Movement/reveal relationship. | `soft inset reveal, no bounce` |
| `audio_relationship_summary` | Required | Audio relationship. | `muted original, voiceover continues` |
| `rights_or_authorization_notes` | Required | Rights/source notes. | `project source footage; no extra rights needed` |
| `redaction_needed` | Required | Redaction requirement. | `false` |
| `generated_future_required` | Required | Whether future generation is required. | `false` |
| `credit_impact` | Required | Credit impact. | `low` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | QA checks. | `source matches phrase, captions safe, no false proof` |
| `revision_options` | Required | Revision options. | `remove inset, use full-frame, choose alternate clip` |
| `lower_cost_alternative` | Required | Lower-cost option. | `clean cut with caption emphasis` |
| `worker_notes` | Optional | Future worker-safe notes. | `Use approved plan id; no search or generation from raw prompt.` |
| `must_follow_rules` | Required | Rules that must be followed. | `Use source footage only; no generated B-roll.` |
| `avoid_rules` | Required | Things to avoid. | `Avoid generic filler and hiding product action.` |
| `status` | Required | Planning status. | `planned_source_only` |
| `metadata_json` | Optional | Future metadata container. | `{ "rp_skills": "08" }` |

## B-roll Scoring Model

Positive signals:

- B-roll directly supports spoken meaning.
- Source footage contains relevant visual.
- B-roll clarifies product, object, place, process, screen, result, or context.
- B-roll provides proof/context.
- B-roll covers a necessary cut smoothly.
- B-roll improves pacing without hiding important emotion.
- B-roll is better/cheaper than 3D or generated visual.
- B-roll aligns with edit preference and workflow.
- B-roll fits platform/aspect ratio.
- Source status is clear.
- Caption/audio conflicts are low.
- Novelty/variation improves edit.

Negative signals:

- User requested minimal/no extra visuals.
- B-roll is generic filler.
- Source status unclear.
- Proof/evidence implication unsafe.
- B-roll hides key facial emotion.
- B-roll hides product/action.
- B-roll conflicts with captions/graphics/3D.
- B-roll quality/tone mismatch.
- Repeated B-roll type.
- Breaks story/spatial continuity.
- Original audio conflict.
- Credit budget too low for generated/future B-roll.
- Simpler skill is better.

Documentation-only pseudo formula:

```text
b_roll_score =
  meaning_support
+ source_relevance
+ proof_or_context_gain
+ pacing_gain
+ visual_variety_gain
+ user_preference_fit
+ workflow_fit
+ platform_fit
- generic_filler_risk
- source_status_risk
- face_emotion_risk
- caption_graphic_collision_risk
- continuity_risk
- repetition_penalty
- audio_conflict_risk
- credit_penalty
- simpler_skill_better_penalty
```

## B-roll Relationship To Edit Preference

User direct instruction overrides defaults.

| Edit preference | B-roll behavior |
| --- | --- |
| No extra visuals | Avoid B-roll unless necessary for clarity, cut cover, or user request. |
| Keep visuals minimal | Use only highly relevant B-roll. |
| Balanced visual mix | Use B-roll for key support/proof/context. |
| More graphic design | Use graphics to label or structure B-roll. |
| More Stroke Motion | B-roll should not compete with story animation. |
| Real Motion if useful | Compare B-roll versus Real Motion/3D overlay before selecting. |
| Premium/luxury | Use restrained, beautiful, intentional B-roll with smooth pacing. |
| Energetic/social | Use faster B-roll rhythm where meaningful. |
| Educational | Use B-roll examples that improve comprehension. |
| Documentary/testimonial | Use source-aware B-roll and trust-first pacing. |
| Product/tech | Use product/screen/process B-roll where it clarifies. |

## B-roll Relationship To Workflow Context

| Workflow context | Likely B-roll behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | Minimal or no B-roll. | Busy filler visuals. | Speaker/source remains primary. |
| Social Short / Viral Clip | Quick meaningful inserts or montage. | Unrelated retention filler. | Rhythm must support meaning. |
| Talking Head / Personal Brand | Occasional cutaway or proof/context insert. | Hiding face/emotion too often. | Trust and presence matter. |
| Podcast Clip | One cut cover or source visual if useful. | Overproduced visual stack. | Captions and faces dominate. |
| Vlog / Lifestyle | Environment/detail B-roll and mood support. | Generic stock-like visuals. | Authentic source matters. |
| Product Demo | Product detail, process, screen, or proof B-roll. | Hiding the action being explained. | Use source first. |
| Real Estate / Property Tour | Room/detail/location B-roll with restrained pacing. | Fake or unsupported property visuals. | Spatial continuity matters. |
| Education / Explainer | Process/example B-roll for comprehension. | Visuals that do not map to concept. | Hold long enough to understand. |
| Marketing Ad | Proof, offer, product, result, or hero B-roll. | Generated/premium without approval. | Credit and proof gates matter. |
| Testimonial / Case Study | Trustworthy context/proof B-roll. | Overclaiming or generic stock. | Trust beats spectacle. |
| Custom / Let AI Decide | Select B-roll only when score beats alternatives. | Assuming B-roll by default. | Use restraint and QA. |

## B-roll Relationship To Other Skills

- Transitions: B-roll can bridge cuts and scenes, but should inherit transition timing, edge, ambient bridge, and QA from RP-SKILLS-03.
- Overlays/compositing: inset, picture-in-picture, split-screen, and layered B-roll inherit screen zone, safe area, layer, aspect ratio, and collision rules from RP-SKILLS-04.
- Graphic design: B-roll labels, proof cards, source notes, and context cards inherit hierarchy/readability from RP-SKILLS-05.
- Motion design: B-roll reveals, inset motion, focus motion, pacing, and rhythm inherit RP-SKILLS-06.
- 3D visuals: 3D object B-roll and 3D explainer B-roll inherit RP-SKILLS-07.
- Captions: B-roll must preserve caption readability. Full caption contract belongs to RP-SKILLS-09.
- Stroke Motion: B-roll should not compete with the same story beat or story animation.
- Real Motion: B-roll may be a lower-cost alternative to Real Motion/3D overlay; Real Motion remains premium and approval-gated.
- Browser/app visuals: screen/app/browser B-roll must use source status, safe wording, and redaction planning.
- SoundSync/music/SFX: B-roll transitions, ambience, room tone, and source audio must stay speech-safe. Full sound/music contract belongs to RP-SKILLS-10.
- StoryTiming: B-roll reveals, cut covers, proof moments, captions, and audio bridges must coordinate with StoryTiming. Full StoryTiming coordination belongs to RP-SKILLS-11.

Conflict examples:

- B-roll hides speaker emotion.
- B-roll hides captions.
- B-roll conflicts with graphic card.
- B-roll makes 3D hero moment unnecessary.
- B-roll is clearer/lower-cost than generated 3D.
- B-roll transition needs ambient bridge.
- B-roll source status affects proof card.
- Screen/app B-roll needs redaction/source caution.
- B-roll original audio conflicts with speech/music.
- Too much B-roll reduces authenticity.

## B-roll And 3D Visual Boundary

3D object B-roll is different from 3D overlay integration. 3D B-roll can support spoken meaning without needing to sit inside the live footage. 3D overlay requires heavier compositing, screen placement, tracking, masking, lighting, shadow, and higher QA.

When 3D overlay is too expensive or risky, 3D B-roll may be a lower-integration alternative. When 3D is not needed, existing source B-roll or graphic design may be better. 3D B-roll remains credit/approval-aware if generated or premium.

## B-roll And Browser/App/Screen Safety

| Source status | Meaning | Rule |
| --- | --- | --- |
| `user_provided_url` | User supplied a URL. | Does not imply capture happened; confirm use/capture later. |
| `uploaded_screenshot` | Screenshot is uploaded. | Plan redaction and source labels. |
| `uploaded_screen_recording` | Screen recording is uploaded. | Check sensitive/private data. |
| `authorized_capture_later` | Future capture may be authorized. | Do not execute or imply now. |
| `internal_mock` | Internal mock screen. | Use safe wording; not proof. |
| `unknown_source` | Source unknown. | Do not treat as proof. |
| `claimed_source` | User claims source but not verified. | Use safe wording and confirmation. |
| `redaction_needed` | Sensitive data may be visible. | Redaction planning required. |
| `safe_wording_required` | Claims/source wording needs caution. | Avoid exact evidence claims. |

Rules:

- Do not use AI to invent exact website/app screenshots, UI labels, dashboards, metrics, pricing, or evidence pages.
- Browser/app B-roll should use source status and redaction planning.
- Unknown/claimed source visuals need safe wording.
- Sensitive/private data requires redaction planning.
- This prompt does not unlock browser capture, Playwright, WebGL, canvas, media analysis, generation, or runtime execution.

Requested browser-capture reading files are not present in this repo snapshot: `browser-app-capture-planning.md`, `browser-capture-settings-catalog.md`, and `src/lib/browser-capture-planner.ts`. Future browser/app B-roll work should reconcile that absence before claiming a browser capture planning contract exists.

## B-roll Accessibility, Readability, And Trust

B-roll planning must:

- Preserve viewer understanding.
- Avoid excessive cutaways that make the story hard to follow.
- Avoid hiding important emotion.
- Keep captions readable.
- Keep source/proof visuals from misleading.
- Make testimonial/case-study B-roll feel trustworthy.
- Avoid visual rhythm that causes discomfort.
- Avoid over-fast montage when clarity matters.
- Keep product/process visuals on screen long enough to understand.

## B-roll Repetition And Novelty

Do not use the same type of B-roll repeatedly without reason. Do not use generic stock-like visuals mechanically. Do not use B-roll to cover every pause. Vary B-roll roles: proof, context, product detail, emotional support, process, cut cover, and location.

Save hero B-roll for actual hero moments. A repeated B-roll motif can be intentional if planned as a brand/story device.

Repetition states:

- `first_use`
- `repeated_intentionally`
- `repeated_unintentionally`
- `overused`
- `avoid_this_pattern_next`

## Credit And Approval Behavior

| B-roll behavior | Typical credit impact |
| --- | --- |
| `no_b_roll` | `none` |
| Existing source clip B-roll | `none` / `low` |
| Simple source cutaway | `low` |
| Inset/PIP B-roll with overlay planning | `low` / `medium` |
| Browser/app B-roll planning/redaction | `medium` |
| User-provided asset B-roll | `low` / `medium` |
| Stock/library B-roll future | `medium` / `high` depending on licensing/workflow |
| Generated image/video B-roll future | `high` / `premium` |
| 3D object B-roll future | `high` / `premium` |
| Real Motion-style visual alternative | `premium` |
| Tracking/masking/advanced compositing B-roll | `high` / `premium` |

Rules:

- Premium/generated B-roll must be itemized.
- Generated/future B-roll requires estimate and approval.
- Stock/library use must be future-gated and rights-aware.
- Optional heavy B-roll should have lower-cost alternatives.
- Lower-cost alternatives can include existing source B-roll, graphic design card, caption emphasis, simple cutaway, or no B-roll.
- No generation, capture, search, stock/library lookup, provider execution, or runtime media analysis before approval and future runtime gates.

## B-roll QA

B-roll-specific QA checks:

- B-roll has story/meaning reason.
- B-roll is not random filler.
- Spoken phrase/story beat support is clear.
- Source status is known.
- Proof/context level is appropriate.
- B-roll does not imply false evidence.
- B-roll does not hide important face/emotion/product/action.
- Captions remain readable.
- Visual quality/tone matches edit.
- Timing/duration fits comprehension.
- Transition relationship works.
- Audio/ambience/room tone relationship is smooth.
- Source/proof/redaction handled where needed.
- User preference honored.
- Repetition avoided.
- Credit/approval compliance.
- Lower-cost alternative present for optional premium/generated B-roll.

Blocking examples:

- Generated/premium B-roll without approval.
- B-roll implies unverified proof/evidence.
- Sensitive data visible without redaction plan.
- B-roll contradicts user "no extra visuals" instruction.
- B-roll hides important emotion/product/action.
- Browser/app B-roll invents exact UI/source details.
- Unknown source treated as verified proof.

Warning examples:

- B-roll may feel generic.
- B-roll duration may be too short to understand.
- Source/context note may need clearer wording.
- B-roll rhythm may be too fast.
- Same B-roll role repeated too often.
- Audio bridge may need smoothing.

## Revision Behavior

Safe revision options:

- Remove B-roll.
- Use less B-roll.
- Use more source B-roll.
- Choose different source clip.
- Replace generated/future B-roll with existing source footage.
- Replace B-roll with graphic design card.
- Replace 3D overlay with 3D object B-roll.
- Replace B-roll with caption emphasis.
- Make B-roll full-frame.
- Make B-roll inset/PIP.
- Slow down B-roll cutaways.
- Use smoother transition into B-roll.
- Mute original B-roll audio.
- Preserve ambience.
- Add context/source label.
- Redact sensitive area.
- Lower credit cost.
- Regenerate concept options later.

Revision requires a new credit estimate and approval when it adds premium/generation/provider/stock/search/capture dependency, changes source authorization, increases credit impact, adds advanced tracking/masking/compositing, changes approved timing materially, introduces new SFX/render work, changes source/proof behavior, or changes browser/app/evidence source status. Revisions that simplify, remove, or reduce cost may still need plan snapshot updates, but do not imply execution without approval.

## Examples

### Example 1: Simple Clean Talking Head Rejects B-roll

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `no_b_roll` |
| `source_type` | `existing_source_clip` |
| `source_status` | `project_source_footage` |
| `planning_reason` | The speaker's expression matters more than a cutaway. |
| `restraint_decision` | `reject_broll_speaker_emotion_stronger` |
| `proof_context_level` | `none` |
| `display_mode` | `no_display` |
| `timing_summary` | No B-roll during emotional line. |
| `composition_summary` | Keep full speaker frame and captions. |
| `audio_relationship_summary` | Voice remains primary; no ambience change. |
| `caption_relationship` | Captions remain readable over speaker. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `no extra visual` |
| `QA checks` | B-roll rejected for restraint, emotion preserved, user preference honored. |

### Example 2: Podcast Cut Cover

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `source_clip_cutaway` |
| `source_type` | `existing_source_clip` |
| `source_status` | `project_source_footage` |
| `planning_reason` | One source cutaway hides a removed stumble without making the podcast feel overproduced. |
| `restraint_decision` | `use_one_cutaway_only` |
| `proof_context_level` | `contextual` |
| `display_mode` | `quick_cutaway` |
| `timing_summary` | 1.2 second cutaway over the edit point. |
| `composition_summary` | Full-frame cutaway, then back to speaker. |
| `audio_relationship_summary` | Voice continues, original cutaway audio muted. |
| `caption_relationship` | Captions continue across cutaway. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `clean jump cut` |
| `QA checks` | Cut cover motivated, no random filler, audio smooth. |

### Example 3: Premium Real Estate Detail B-roll

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `location_detail` |
| `source_type` | `existing_source_clip` |
| `source_status` | `project_source_footage` |
| `planning_reason` | Room and detail shots provide property context with restrained premium pacing. |
| `restraint_decision` | `use_restrained_source_broll` |
| `proof_context_level` | `contextual` |
| `display_mode` | `full_frame_cutaway` |
| `timing_summary` | Two 2-second detail cutaways between room statements. |
| `composition_summary` | Full-frame source detail; captions remain lower third. |
| `audio_relationship_summary` | Preserve light room tone, music bed steady. |
| `caption_relationship` | Captions avoid key architectural details. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `single detail cutaway` |
| `QA checks` | Source matches property, pacing restrained, no invented space. |

### Example 4: Product Detail With Label

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `product_detail` |
| `source_type` | `existing_source_clip` |
| `source_status` | `project_source_footage` |
| `planning_reason` | Product close-up clarifies the feature while a small label names it. |
| `restraint_decision` | `use_source_detail_plus_label` |
| `proof_context_level` | `supporting` |
| `display_mode` | `inset_card` |
| `timing_summary` | Inset appears on feature phrase and holds 3 seconds. |
| `composition_summary` | Right inset, speaker stays visible, label after inset settles. |
| `audio_relationship_summary` | Original B-roll audio muted, voiceover continues. |
| `caption_relationship` | Captions stay bottom and above inset layer. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `caption emphasis only` |
| `QA checks` | Product action visible, label readable, no caption collision. |

### Example 5: Education Process B-roll

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `process_step` |
| `source_type` | `existing_source_clip` |
| `source_status` | `project_source_footage` |
| `planning_reason` | A process example helps viewers understand the explanation. |
| `restraint_decision` | `use_broll_for_comprehension` |
| `proof_context_level` | `illustrative` |
| `display_mode` | `full_frame_cutaway` |
| `timing_summary` | Shows the process step for minimum 2.5 seconds. |
| `composition_summary` | Full-frame process shot, then return to teacher. |
| `audio_relationship_summary` | Voiceover continues; process audio muted. |
| `caption_relationship` | Captions remain readable and do not cover hands. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `graphic process card` |
| `QA checks` | Step matches spoken explanation, enough view time, no confusion. |

### Example 6: Marketing Proof/Result B-roll

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `proof_visual` |
| `source_type` | `uploaded_user_asset` |
| `source_status` | `needs_confirmation` |
| `planning_reason` | A result visual may support the claim, but source/proof wording must stay careful. |
| `restraint_decision` | `use_only_after_confirmation` |
| `proof_context_level` | `proof_like` |
| `display_mode` | `inset_card` |
| `timing_summary` | Inset during result phrase after confirmation. |
| `composition_summary` | Source card with small context label. |
| `audio_relationship_summary` | No original audio; voiceover continues. |
| `caption_relationship` | Captions below, source card above. |
| `credit_impact` | `medium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `neutral graphic result summary` |
| `QA checks` | Confirmation required, no overclaiming, source label clear. |

### Example 7: Testimonial Context B-roll

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `testimonial_context_visual` |
| `source_type` | `existing_source_clip` |
| `source_status` | `project_source_footage` |
| `planning_reason` | Context footage supports credibility without overstating the customer's result. |
| `restraint_decision` | `use_trust_first_context` |
| `proof_context_level` | `contextual` |
| `display_mode` | `full_frame_cutaway` |
| `timing_summary` | One short context insert before the quote. |
| `composition_summary` | Natural source footage, no proof badge. |
| `audio_relationship_summary` | Preserve soft ambience if it does not conflict. |
| `caption_relationship` | Captions continue cleanly. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `stay on speaker` |
| `QA checks` | Trust maintained, no false evidence, not generic stock. |

### Example 8: Browser/App Visual B-roll

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `screen_app_visual` |
| `source_type` | `user_provided_screenshot` |
| `source_status` | `needs_redaction` |
| `planning_reason` | A user-provided app screenshot supports the feature explanation without inventing UI. |
| `restraint_decision` | `use_after_redaction_plan` |
| `proof_context_level` | `supporting` |
| `display_mode` | `browser_frame_inset` |
| `timing_summary` | Appears after app feature phrase and holds 3 seconds. |
| `composition_summary` | Inset screen frame, redacted account fields, captions below. |
| `audio_relationship_summary` | Voiceover continues; no source audio. |
| `caption_relationship` | Captions remain outside screenshot. |
| `credit_impact` | `medium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `generic graphic feature card` |
| `QA checks` | No invented UI, redaction needed, source status clear. |

### Example 9: 3D Object B-roll For Missing Live Footage

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `three_d_object_broll` |
| `source_type` | `three_d_generated_future` |
| `source_status` | `needs_confirmation` |
| `planning_reason` | Live B-roll is missing, and 3D object B-roll can explain the product without scene integration. |
| `restraint_decision` | `optional_premium_3d_broll` |
| `proof_context_level` | `illustrative` |
| `display_mode` | `full_frame_cutaway` |
| `timing_summary` | Full-frame insert during product explanation. |
| `composition_summary` | Separate 3D B-roll scene; no overlay tracking. |
| `audio_relationship_summary` | Music bed only; optional SFX after approval. |
| `caption_relationship` | Captions over safe lower band. |
| `credit_impact` | `premium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `graphic design card or no extra visual` |
| `QA checks` | RP-SKILLS-07 handoff, approval required, no model claim. |

### Example 10: Generated/Future B-roll Rejected For Cost

| Field | Value |
| --- | --- |
| `skill_key` | `b_roll_planning` |
| `b_roll_role` | `generated_visual_future` |
| `source_type` | `generated_video_future` |
| `source_status` | `not_allowed` |
| `planning_reason` | Generated B-roll was considered, but existing source footage supports the point at lower cost. |
| `restraint_decision` | `replace_generated_with_source` |
| `proof_context_level` | `supporting` |
| `display_mode` | `full_frame_cutaway` |
| `timing_summary` | Use existing source cutaway instead. |
| `composition_summary` | Source detail shot, no generated visual. |
| `audio_relationship_summary` | Mute source audio, keep voiceover. |
| `caption_relationship` | Captions remain readable. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `selected existing source footage` |
| `QA checks` | Cost reduced, source status known, no generation claim. |

## Anti-Patterns

Avoid these B-roll planning failures:

- B-roll name only.
- B-roll everywhere.
- Generic filler cutaways.
- B-roll unrelated to spoken meaning.
- B-roll hides important emotion.
- B-roll hides product/action.
- B-roll hides captions.
- B-roll creates false proof/evidence.
- Unknown source treated as verified.
- Browser/app B-roll invents exact screen details.
- Sensitive data shown without redaction/source plan.
- Repeated same B-roll role mechanically.
- Full-frame B-roll used when speaker should stay visible.
- Stock-like visual that lowers trust.
- Generated B-roll without credit estimate.
- Premium B-roll without approval.
- Reference B-roll copied shot-for-shot.
- B-roll chosen before creative concept.
- Worker execution from raw prompt only.

## Future Implementation Notes

Possible future records/tables/types could include:

- `b_roll_plans`
- `b_roll_source_selection_plans`
- `b_roll_timing_plans`
- `b_roll_composition_plans`
- `b_roll_audio_relationship_plans`
- `b_roll_qa_requirements`
- `edit_plan_skill_routes` with `skill_key = b_roll_planning` or related B-roll skill keys
- `source_clip_sequence` records
- `media_assets` references
- `visual_observations` references
- `browser_app_visual_plan` references
- `overlay_compositing_plans`
- `graphic_design_plans`
- `motion_design_plans`
- `three_d_visual_plans`
- `storytiming_coordination_records`

This document does not create those records now. Future schema/types must avoid duplicating this document's source truth. Future caption, SoundSync, and StoryTiming contracts should reference this B-roll contract when B-roll behavior is needed. Runtime B-roll selection, capture, stock/library lookup, generation, media analysis, and provider execution remain future gated work.

Existing B-roll-adjacent and overlap owners include:

- `src/lib/professional-editing-ontology.ts`
- `src/lib/intent-compiler.ts`
- `src/lib/edit-operation-planner.ts`
- `src/lib/mock-planner.ts`
- `src/lib/master-timing-planner.ts`
- `src/lib/speaker-visual-layout-planner.ts`
- `src/lib/planner-validation.ts`
- `src/lib/credit-estimator.ts`
- `src/types/reeditpro.ts`
- `src/types/edit-planning-db.ts`
- `src/types/edit-quality.ts`
- `src/backend/storage/source-upload-flow-service.ts`
- `src/backend/mock/mock-upload-scenarios.ts`
- `src/backend/mock/mock-sfx-scenarios.ts`
- `src/backend/mock/mock-sfx-timing-scenarios.ts`
- `docs/storytiming-planner-service.md`
- `docs/storytiming-render-manifest-plan.md`
- `docs/sfx-timing-trim-alignment.md`
- `docs/music-sfx-timing-integration.md`
- `docs/production-media-analysis-foundation.md`
- `docs/production-media-artifact-policy.md`
- `docs/production-render-stack-decision.md`
- `docs/creative-skills/transition-planning-contract.md`
- `docs/creative-skills/overlay-compositing-planning-contract.md`
- `docs/creative-skills/graphic-design-planning-contract.md`
- `docs/creative-skills/motion-design-planning-contract.md`
- `docs/creative-skills/three-d-visual-planning-contract.md`

This contract is the B-roll planning doctrine and specialized field envelope. It must not create a parallel B-roll policy/type, source sequence, source clip routing, media asset, source cleanup, visual asset planning, StoryTiming, SoundSync/SFX, render strategy, provider/generation, browser/app capture, stock/search, worker, QA, credit, or Supabase lane.

## Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-09 - Caption Planning Contract`

Scope:

Docs-only caption planning contract that inherits the universal, overlay/compositing, graphic design, motion design, transition, 3D, and B-roll contracts where relevant and defines caption roles, readability, timing, line-breaking, density, placement zones, safe-area/collision behavior, animation relationship, keyword emphasis, speaker accessibility, translation/multilingual future considerations, credit/approval behavior, and caption QA.
