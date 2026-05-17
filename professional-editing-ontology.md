# Professional Editing Ontology

## Why This Ontology Exists

ReeditPro must convert natural chat requests into structured professional editing plans. The AI should understand user intent, but it should not freestyle randomly or produce low-quality AI slop.

The ontology gives future planners and workers shared language for:

- Edit styles.
- Pacing styles.
- Cut styles.
- Transition styles.
- Color grade styles.
- Caption styles.
- B-roll policies.
- Audio and SoundSync styles.
- Visual system policies.
- Frame and layout rules.
- Quality standards by tier.
- Custom directive handling.
- QA rules.

The database guides the AI. The database does not limit the AI.

If a user asks for something outside the ontology, ReeditPro should understand the request, map it to the closest known professional presets, store the rest as custom directives, ask a clarifying question only if the missing answer changes the edit, and produce an executable edit plan.

## Professional Tier Principle

Basic, Pro, and Premium must all meet a professional editing standard.

- Basic means professional fundamentals, lower compute, fewer generated assets, fewer retries, and simpler fallback.
- Pro means stronger planning, better polish, more planned b-roll/captions/visuals, Hailuo fallback, and no Veo.
- Premium means full production depth, more custom assets, stronger QA, more retries, and Veo Lite final fallback only.

No tier should produce bad color grading, sloppy captions, random transitions, weak pacing, poor sound, or unprofessional output.

## Core Edit Styles

### clean_professional

- Purpose: Deliver a polished clean edit without heavy stylization.
- Best use cases: Training clips, client updates, simple talking-head, internal content.
- Pacing tendency: Clean tight pacing that preserves natural meaning.
- Caption tendency: Clean subtitle or minimal accessibility captions.
- Color grade tendency: Clean natural.
- Transition tendency: Hard cuts, J-cuts, L-cuts, cutaways, motivated cuts.
- B-roll tendency: Uploaded footage first, only where it supports meaning.
- Avoid rules: Avoid random b-roll, aggressive effects, and unnecessary AI video.

### premium_clean

- Purpose: Make the edit feel refined, confident, and expensive without clutter.
- Best use cases: Founder clips, brand videos, testimonials, premium creator content.
- Pacing tendency: Tight but not frantic.
- Caption tendency: Small premium subtitles or keyword emphasis.
- Color grade tendency: Premium clean.
- Transition tendency: Smooth premium transitions used sparingly.
- B-roll tendency: Support key points with tasteful visual variety.
- Avoid rules: Avoid overproduced social effects and noisy captions.

### high_retention_social

- Purpose: Hold attention on short-form platforms.
- Best use cases: TikTok, Reels, Shorts, social hooks, creator clips.
- Pacing tendency: High retention, fast, hook-aware.
- Caption tendency: Bold social or keyword emphasis captions.
- Color grade tendency: Bright social or clean natural.
- Transition tendency: Beat-synced cuts, snap zooms, flash cuts, pop transitions.
- B-roll tendency: High visual variety when every insert supports the point.
- Avoid rules: Avoid meaningless transitions, fake drama, or visual clutter that hurts comprehension.

### cinematic_story

- Purpose: Shape footage into an emotional or narrative story.
- Best use cases: Personal stories, relationship stories, dramatic explanations, case stories.
- Pacing tendency: Emotional pause, cinematic slow build, or clean tight depending platform.
- Caption tendency: Keyword emphasis or small premium subtitles.
- Color grade tendency: Cinematic contrast or moody dramatic.
- Transition tendency: Smooth premium and Stroke Motion transitions.
- B-roll tendency: Support key story beats and emotional turns.
- Avoid rules: Avoid comedy timing or bright playful styling unless requested.

### documentary_evidence

- Purpose: Explain what happened with evidence, timeline, and neutral proof.
- Best use cases: Scam stories, fraud breakdowns, public controversy explainers, investigations.
- Pacing tendency: Documentary measured or clean tight for social.
- Caption tendency: Documentary lower third or small premium subtitle.
- Color grade tendency: Documentary neutral.
- Transition tendency: Evidence cards, timeline slides, document zooms, neutral lower thirds.
- B-roll tendency: Proof-first b-roll and documentary evidence cards.
- Avoid rules: Avoid speculative visuals, playful colors, and claims that look more certain than the source supports.

### education_explainer

- Purpose: Help viewers understand a concept, lesson, process, or framework.
- Best use cases: Tutorials, course clips, finance explainers, health explainers, step-by-step teaching.
- Pacing tendency: Educational structured.
- Caption tendency: Education label captions or clean subtitles.
- Color grade tendency: Clean natural or corporate neutral.
- Transition tendency: Graphic motion design transitions.
- B-roll tendency: Support key points with diagrams, cards, examples, and screen recordings.
- Avoid rules: Avoid random AI video when controlled diagrams or cards are clearer.

### luxury_real_estate

- Purpose: Present property, place, or environment with calm premium polish.
- Best use cases: Property tours, rental listings, luxury walkthroughs, location videos.
- Pacing tendency: Luxury smooth.
- Caption tendency: Small premium subtitles or minimal lower thirds.
- Color grade tendency: Luxury real estate.
- Transition tendency: Elegant slides, soft dissolves, subtle parallax, masked reveals.
- B-roll tendency: Uploaded footage first, room/feature labels where useful.
- Avoid rules: Avoid chaotic cuts, heavy glitch effects, and transitions that break spatial clarity.

### business_product

- Purpose: Explain or sell a product, service, offer, or brand clearly.
- Best use cases: SaaS demos, product demos, ecommerce, agency offers, coaching content.
- Pacing tendency: Clean tight and benefit-led.
- Caption tendency: Keyword emphasis captions.
- Color grade tendency: Premium clean or corporate neutral.
- Transition tendency: Graphic motion design plus clean cuts.
- B-roll tendency: Product feature b-roll, screen recordings, proof visuals, offer cards.
- Avoid rules: Avoid vague visuals, overclaiming, or motion that hides the product.

### lifestyle_natural

- Purpose: Keep casual creator footage human and watchable.
- Best use cases: Day-in-life, travel, fitness, food, beauty, casual stories.
- Pacing tendency: Natural with light cleanup.
- Caption tendency: Clean subtitle or minimal captions.
- Color grade tendency: Warm lifestyle or clean natural.
- Transition tendency: Clean cuts and smooth premium transitions.
- B-roll tendency: Lifestyle atmosphere, environment, object close-ups.
- Avoid rules: Avoid heavy AI video and corporate polish unless requested.

### energetic_creator

- Purpose: Create a high-energy creator edit with strong rhythm.
- Best use cases: Fitness, motivational, creator launches, casual social content.
- Pacing tendency: Fast social or high retention.
- Caption tendency: Bold social, karaoke, or keyword emphasis.
- Color grade tendency: Bright social.
- Transition tendency: Beat-synced cuts, speed ramps, whip pans, pop transitions.
- B-roll tendency: High visual variety when it supports the spoken point.
- Avoid rules: Avoid effects that overpower voice or make captions hard to read.

## Transition Style Library

### clean_cut_transitions

Examples:

- Hard cut.
- Jump cut.
- Cut on word.
- Cut on action.
- Cutaway.
- J-cut.
- L-cut.
- Match cut.
- Motivated cut.
- Invisible cut.
- Smash cut.
- Reaction cut.

### smooth_premium_transitions

Examples:

- Cross dissolve.
- Dip to black.
- Dip to white.
- Soft blur dissolve.
- Film-style dissolve.
- Slow push transition.
- Elegant slide.
- Masked reveal.
- Light sweep.
- Subtle parallax transition.

### social_viral_transitions

Examples:

- Snap zoom.
- Whip pan.
- Flash cut.
- Speed ramp.
- Motion blur swipe.
- Glitch hit.
- Shake impact.
- Freeze-frame punch.
- Beat-synced cut.
- Pop transition.
- Whoosh transition.
- Crash zoom.

### graphic_motion_design_transitions

Examples:

- Card slide.
- Card stack.
- Shape wipe.
- Line-draw reveal.
- Arrow flow.
- Diagram build.
- Step reveal.
- Number count-up.
- Highlight sweep.
- Split panel reveal.
- Mask reveal.
- Label pop-in.
- Icon morph.

### documentary_evidence_transitions

Examples:

- Timeline slide.
- Evidence card pin.
- Paper slide.
- Document zoom.
- Map zoom.
- Red-circle highlight.
- Case-board line connect.
- Archival dissolve.
- Neutral lower-third reveal.
- Screenshot push-in.

### stroke_motion_transitions

Examples:

- Line continuation.
- Path draw.
- Character morph.
- Symbol transform.
- Relationship line crack.
- Line reconnect.
- Motion trail.
- Red danger flicker.
- Emotion pulse.
- Stroke wipe.

## Color Grading Library

Every color grade should reference professional operations such as exposure correction, white balance, contrast curve, highlight recovery, shadow control, skin tone protection, saturation/vibrance, noise reduction when needed, sharpening/clarity, shot matching, LUT/preset strength, vignette only if appropriate, secondary correction for faces/products, and legal/social-safe levels.

### clean_natural

- Visual look: Balanced, accurate, natural.
- Best use cases: Basic clean edits, training, talking-head, lifestyle.
- Technical operations: Exposure, white balance, shot matching, skin protection, light contrast.
- Avoid rules: Avoid stylized LUTs and heavy saturation.

### premium_clean

- Visual look: Clean contrast, polished skin/product tones, refined highlights.
- Best use cases: Brand, personal brand, premium social, testimonials.
- Technical operations: Contrast curve, highlight recovery, secondary face/product correction, controlled sharpening.
- Avoid rules: Avoid crushed shadows and overdone glow.

### warm_lifestyle

- Visual look: Warm, human, slightly soft.
- Best use cases: Family, travel, food, beauty, creator content.
- Technical operations: Warm white balance, gentle saturation, skin tone protection.
- Avoid rules: Avoid orange skin or muddy whites.

### cinematic_contrast

- Visual look: Deeper contrast and mood while preserving faces.
- Best use cases: Storytelling, dramatic explanations, emotional edits.
- Technical operations: Contrast curve, shadow control, highlight recovery, subtle filmic rolloff.
- Avoid rules: Avoid losing detail in faces or key objects.

### documentary_neutral

- Visual look: Neutral, factual, restrained.
- Best use cases: Evidence, investigations, timelines, case studies.
- Technical operations: Shot matching, legal levels, neutral saturation, clarity.
- Avoid rules: Avoid sensational colors or dramatic filters that imply bias.

### luxury_real_estate

- Visual look: Bright, clean, spacious, premium.
- Best use cases: Property tours, interiors, hospitality, location videos.
- Technical operations: Exposure lift, white balance, highlight recovery, vertical correction if available later.
- Avoid rules: Avoid over-warm interiors or blown windows.

### corporate_neutral

- Visual look: Professional, restrained, accurate.
- Best use cases: Business, SaaS, training, corporate comms.
- Technical operations: Clean white balance, mild contrast, skin/product secondary correction.
- Avoid rules: Avoid trendy social filters.

### bright_social

- Visual look: High clarity, brighter image, more pop.
- Best use cases: Short-form creator edits, energetic social.
- Technical operations: Exposure correction, vibrance, sharpening, face protection.
- Avoid rules: Avoid neon saturation and clipped highlights.

### moody_dramatic

- Visual look: Lower brightness, strong mood, controlled contrast.
- Best use cases: Tension, serious story, emotional aftermath.
- Technical operations: Shadow control, contrast curve, selective saturation.
- Avoid rules: Avoid hiding information or making faces unreadable.

### film_emulation_light

- Visual look: Subtle film tone without heavy grain.
- Best use cases: Cinematic story, premium creator, lifestyle.
- Technical operations: Light LUT strength, highlight rolloff, controlled grain if requested later.
- Avoid rules: Avoid heavy vintage styling by default.

### muted_editorial

- Visual look: Soft saturation, restrained palette, editorial feel.
- Best use cases: Documentary, luxury, reflective storytelling.
- Technical operations: Saturation control, contrast moderation, shot matching.
- Avoid rules: Avoid dull skin or lifeless product shots.

### high_key_clean

- Visual look: Bright, airy, clean.
- Best use cases: Beauty, education, product, clean brand.
- Technical operations: Exposure lift, highlight control, clean whites, skin protection.
- Avoid rules: Avoid blown highlights.

### monochrome

- Visual look: Black-and-white or single-tone styling.
- Best use cases: Serious story, memory, stylized brand request.
- Technical operations: Channel mix, contrast, skin luminance protection.
- Avoid rules: Avoid monochrome unless requested or clearly justified.

## Caption Style Library

Caption controls should include font family, font size, font weight, line count, position, safe zones, face avoidance, keyword highlight, emoji allowed/not allowed, animation style, background box/no box, stroke/shadow, timing mode, and max words per caption.

Caption styles:

- clean_subtitle: Readable standard subtitles, usually 1-2 lines, no random emphasis.
- small_premium_subtitle: Smaller refined captions with subtle shadow or box.
- bold_social_captions: Larger social captions with strong weight and safe placement.
- keyword_emphasis_captions: Captions with selected words highlighted for meaning.
- karaoke_word_by_word: Word-by-word timing for high retention or music-led edits.
- sentence_block_captions: Short sentence groups for educational clarity.
- documentary_lower_third: Lower thirds for names, roles, places, and facts.
- education_label_captions: Labels, definitions, and diagram-adjacent text.
- minimal_accessibility_captions: Accessible captions that stay out of the visual story.
- caption_icon_callout: Caption plus icon/callout for concepts or product features.

## B-Roll Planning Library

B-roll types:

- uploaded_b_roll.
- speaker_cutaway.
- product_shot.
- screen_recording.
- environment_shot.
- proof_evidence_shot.
- stock_like_generated_still.
- ai_generated_visual.
- graphic_card.
- timeline_card.
- money_trail_visual.
- reaction_insert.
- object_close_up.

B-roll policies:

- none.
- minimal_support_only.
- support_key_points.
- high_visual_variety.
- proof_first_b_roll.
- documentary_evidence_b_roll.
- product_feature_b_roll.
- lifestyle_atmosphere_b_roll.
- uploaded_footage_first.
- ai_generated_only_if_approved.

No random b-roll. B-roll must support meaning.

## Audio / SoundSync Library

Audio operations:

- Noise reduction.
- Voice leveling.
- De-essing.
- EQ cleanup.
- Compression.
- Loudness normalization.
- Music bed.
- Music ducking.
- SFX hits.
- Transition sounds.
- Impact sounds.
- Risers.
- Whooshes.
- Ambient bed.
- Silence cleanup.
- Breath reduction.

Sound styles:

- clean_voice_only.
- subtle_premium_bed.
- energetic_social.
- cinematic_emotional.
- documentary_serious.
- corporate_clean.
- lifestyle_warm.
- luxury_soft.
- high_retention_impact.

## Pacing And Cut Style Library

Pacing styles:

- natural.
- clean_tight.
- fast_social.
- high_retention.
- cinematic_slow_build.
- documentary_measured.
- educational_structured.
- luxury_smooth.
- comedy_timing.
- emotional_pause.

Cut intensity:

- minimal.
- balanced.
- tight.
- aggressive.
- beat_synced.
- cinematic.

Cut operations:

- Remove silence.
- Remove filler words.
- Tighten pauses.
- Keep emotional pause.
- Jump cut.
- Cut to b-roll.
- Cut on beat.
- Cut on keyword.
- Reaction cut.
- CTA cut.
- Hook-first reorder.
- Source-order preserve.

## Custom Directive Handling

If the user asks for something not directly in the ontology, do not fail. Create a custom directive with:

- Raw user request.
- Interpreted meaning.
- Mapped known presets.
- Custom overrides.
- Must-follow rules.
- Avoid rules.
- Confidence.
- Clarifying questions if needed.

Example request:

`Make it feel like a serious courtroom breakdown but with modern social pacing.`

Mapped plan:

- Edit style: `documentary_evidence`.
- Pacing: `clean_tight` or `high_retention`.
- Color grade: `documentary_neutral`.
- Transition style: `documentary_evidence_transitions`.
- Custom directive: serious courtroom breakdown tone.
- Avoid: comedy, playful colors, childish motion.

## QA Rules

Professional editing QA should check:

- User must-follow rules are satisfied.
- Avoid rules are not violated.
- B-roll supports meaning.
- Transitions match edit style.
- Captions are readable and safe.
- Color grade matches selected style.
- Sound is clean and not overpowering voice.
- Basic and Pro do not use Veo.
- Premium uses Veo only as final fallback.
- AI visuals stay inside frame panels.
- Generated backgrounds match frame panels.
- Approval happens before generation.
