# Edit Workflow Blueprints

## Dropdown Workflow System

The video type dropdown gives workflow context only. It does not automatically decide the final edit structure, hook, pacing, or signature systems.

All workflow profiles can use:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion
- SoundSync
- None

The AI decides whether each system is useful per segment based on user instructions, uploaded clip order, edit level, transcript, visual footage, reference video style, platform, credit budget, and whether the visual improves the video.

## Workflow Profile Schema

Each profile should define:

- Purpose
- Best use cases
- Clip order guidance
- Hook guidance
- Pacing guidance
- Reference video guidance
- Caption guidance
- Music/SoundSync guidance
- Signature system guidance
- Credit cost expectations
- Questions to ask only if information is missing

## Hook Policy

Not every video needs a hook.

Hook policies:

- Required
- Recommended
- Optional
- Not needed
- Avoid

User instruction always wins. If the user says "simple edit, no hook," the AI should not force a hook.

## Clip Order Policy

Uploaded clip order is source sequence. It is the order the user filmed the clips or believes they belong.

The AI should respect it as context, but not treat it as automatic final edit order. The planner must show a Source Sequence Map and Recommended Edit Structure before changing final order.

## Reference Video Policy

Reference video analysis should create Reference DNA, not a shot-for-shot copy.

Reference DNA includes topic, opening style, pacing, music intro, beat changes, transition style, caption style, visual effect style, use of signature systems, mood, tone, and why the reference edit works.

## Credit Estimate Behavior

Each workflow profile should produce a credit estimate before generation. Higher edit levels, Real Motion, heavy SoundSync, multiple aspect ratios, and regeneration options should increase estimated credits.

Credits should be deducted only after approval.

## Launch Workflow Profiles

### 1. Simple Clean Edit

- **Purpose:** Clean up footage without changing the user's natural structure.
- **Best use cases:** Personal updates, basic talking clips, simple client notes, training snippets.
- **Clip order guidance:** Respect uploaded order unless there is an obvious mistake; show any reorder in the plan.
- **Hook guidance:** Not needed or avoid unless the user asks.
- **Pacing guidance:** Remove dead space, silence, stumbles, and obvious filler while preserving natural speech.
- **Reference video guidance:** Use only for subtle pacing or caption style; do not transform the edit into a stylized format.
- **Caption guidance:** Basic readable captions if requested or useful.
- **Music/SoundSync guidance:** Optional light cleanup or subtle bed; do not overproduce.
- **Signature system guidance:** All systems allowed, but usually none or very light usage unless the user asks.
- **Credit cost expectations:** Low.
- **Ask only if missing:** Desired length, whether captions are needed, whether to remove filler words.

### 2. Social Short / Viral Clip

- **Purpose:** Create a high-retention short-form edit for social platforms.
- **Best use cases:** TikTok, Reels, Shorts, highlight clips, attention-driven edits.
- **Clip order guidance:** Uploaded order provides source context; AI may propose a stronger hook-first structure.
- **Hook guidance:** Recommended or required depending on user goal and platform.
- **Pacing guidance:** Fast, tight, clear, with strong early payoff.
- **Reference video guidance:** Extract opening style, caption rhythm, beat changes, and transition language.
- **Caption guidance:** Strong captions are usually recommended.
- **Music/SoundSync guidance:** Often useful for beat timing, impacts, risers, and emotional pacing.
- **Signature system guidance:** All systems are allowed; AI routes Stroke Motion, VisualExplain, Real Motion, or none per segment.
- **Credit cost expectations:** Medium to high depending on visuals, SoundSync, variants, and Real Motion.
- **Ask only if missing:** Target platform, desired length, whether the user wants aggressive or clean pacing.

### 3. Talking Head / Personal Brand

- **Purpose:** Turn speaker-led footage into a polished personal brand edit.
- **Best use cases:** Founder clips, creator videos, coach content, thought leadership.
- **Clip order guidance:** Preserve speaker logic unless a stronger story structure is proposed.
- **Hook guidance:** Optional or recommended depending on distribution goal.
- **Pacing guidance:** Tighten delivery while keeping authenticity.
- **Reference video guidance:** Use for tone, caption style, pacing, and visual restraint.
- **Caption guidance:** Usually useful; captions should not cover the face.
- **Music/SoundSync guidance:** Subtle bed or light emphasis, ducked under voice.
- **Signature system guidance:** All systems are allowed; use only where they support the speaker's point.
- **Credit cost expectations:** Medium; higher with Real Motion or multiple visual moments.
- **Ask only if missing:** Desired tone, platform, whether to keep a natural or high-performance style.

### 4. Podcast Clip

- **Purpose:** Extract a compelling moment from longer conversational content.
- **Best use cases:** Podcast highlights, interview clips, guest moments, debate clips.
- **Clip order guidance:** Source order matters for context; final structure may start with the strongest quote.
- **Hook guidance:** Recommended for social clips, optional for archive clips.
- **Pacing guidance:** Remove rambling while preserving conversational meaning.
- **Reference video guidance:** Analyze caption style, speaker layout, intro pacing, and sound treatment.
- **Caption guidance:** Strong captions are usually recommended.
- **Music/SoundSync guidance:** Light bed or stings only if they do not distract from speech.
- **Signature system guidance:** All systems are allowed; VisualExplain can help concepts, Stroke Motion can support story, Real Motion can support proof moments.
- **Credit cost expectations:** Medium.
- **Ask only if missing:** Clip length, guest names, target platform, whether to preserve full context.

### 5. Vlog / Lifestyle

- **Purpose:** Shape casual footage into a natural, watchable story.
- **Best use cases:** Day-in-life, travel, lifestyle, behind-the-scenes, creator updates.
- **Clip order guidance:** Uploaded order often reflects the real experience; changes should be shown in the plan.
- **Hook guidance:** Natural hook or optional.
- **Pacing guidance:** Keep human rhythm while trimming dull moments.
- **Reference video guidance:** Extract mood, music, transitions, and pacing without copying exact shots.
- **Caption guidance:** Use captions selectively unless speech is central.
- **Music/SoundSync guidance:** Important for mood and flow.
- **Signature system guidance:** All systems are allowed; avoid heavy visuals unless they improve the story.
- **Credit cost expectations:** Medium; higher for music-heavy edits or Real Motion.
- **Ask only if missing:** Desired vibe, target length, whether to prioritize natural story or social performance.

### 6. Product Demo

- **Purpose:** Explain or sell a product clearly.
- **Best use cases:** SaaS demos, physical products, app walkthroughs, feature explainers.
- **Clip order guidance:** Uploaded order may reflect demo flow; AI can propose a clearer problem-solution-proof structure.
- **Hook guidance:** Recommended for public/social demos; optional for internal training.
- **Pacing guidance:** Clear, efficient, benefit-led.
- **Reference video guidance:** Extract product reveal, caption style, proof moments, and transition pacing.
- **Caption guidance:** Useful for feature names and benefit statements.
- **Music/SoundSync guidance:** Clean and non-distracting; emphasize proof or outcome moments.
- **Signature system guidance:** All systems are allowed; Real Motion may help product proof, VisualExplain may clarify features, Stroke Motion may support story.
- **Credit cost expectations:** Medium to high, especially with Real Motion.
- **Ask only if missing:** Product name, key feature, target audience, desired CTA.

### 7. Real Estate / Property Tour

- **Purpose:** Present a property, place, room, or location with clarity and mood.
- **Best use cases:** Property tours, rental listings, neighborhood clips, agent walkthroughs.
- **Clip order guidance:** Uploaded order often maps to the physical tour; AI should preserve or explain changes.
- **Hook guidance:** Optional depending on luxury/natural vs social performance goal.
- **Pacing guidance:** Smooth, spatially coherent, not overly chaotic.
- **Reference video guidance:** Extract pacing, music, room labels, transitions, and tone.
- **Caption guidance:** Useful for room names, price, location, features, and CTA.
- **Music/SoundSync guidance:** Mood-setting music is often useful.
- **Signature system guidance:** All systems are allowed; Real Motion is not automatic. Use visual systems only where they clarify or elevate the tour.
- **Credit cost expectations:** Medium; higher if Real Motion or many room overlays are planned.
- **Ask only if missing:** Property type, address/area, luxury vs social style, must-show features.

### 8. Education / Explainer

- **Purpose:** Help viewers understand a concept, lesson, process, or framework.
- **Best use cases:** Course clips, tutorials, explainers, training content, business education.
- **Clip order guidance:** Uploaded order may follow lesson order; AI can propose a clearer teaching structure.
- **Hook guidance:** Optional or not needed for course/training; recommended for public social clips.
- **Pacing guidance:** Clear, structured, and easy to follow.
- **Reference video guidance:** Extract teaching rhythm, graphic style, caption style, and example pacing.
- **Caption guidance:** Strong captions and labels are often useful.
- **Music/SoundSync guidance:** Minimal and non-distracting unless the user wants social polish.
- **Signature system guidance:** All systems are allowed; VisualExplain is often useful but not automatic.
- **Credit cost expectations:** Medium; higher with many graphics or Real Motion examples.
- **Ask only if missing:** Audience level, lesson goal, whether to prioritize clarity or retention.

### 9. Marketing Ad

- **Purpose:** Create a persuasive edit that drives action.
- **Best use cases:** Paid ads, product promos, launches, service offers, creator offers.
- **Clip order guidance:** Uploaded order is source context; final order may follow hook, problem, proof, offer, CTA.
- **Hook guidance:** Usually required.
- **Pacing guidance:** Direct, benefit-led, proof-oriented, and CTA-aware.
- **Reference video guidance:** Extract opening style, pacing, offer structure, CTA, music, caption style, and visual language.
- **Caption guidance:** Strong captions and benefit callouts are usually useful.
- **Music/SoundSync guidance:** Important for energy, beat, transitions, and emotional polish.
- **Signature system guidance:** All systems are allowed; Real Motion, VisualExplain, or Stroke Motion should be justified by segment.
- **Credit cost expectations:** Medium to high.
- **Ask only if missing:** Offer, audience, platform, CTA, compliance or claims constraints.

### 10. Testimonial / Case Study

- **Purpose:** Turn proof, customer story, or outcome footage into a trustworthy edit.
- **Best use cases:** Client testimonials, customer wins, before/after, case study clips.
- **Clip order guidance:** Preserve the story arc unless a clearer proof-first structure is proposed.
- **Hook guidance:** Recommended for public social; optional for sales pages or client review.
- **Pacing guidance:** Credible, clear, and not overhyped.
- **Reference video guidance:** Extract proof structure, caption treatment, lower thirds, pacing, and mood.
- **Caption guidance:** Useful for names, company, quote highlights, and proof points.
- **Music/SoundSync guidance:** Supportive and trustworthy; avoid overpowering the speaker.
- **Signature system guidance:** All systems are allowed; Real Motion can support proof, VisualExplain can clarify outcomes, Stroke Motion can support story.
- **Credit cost expectations:** Medium; higher with proof overlays or multiple versions.
- **Ask only if missing:** Customer name/title, key result, claims sensitivity, desired CTA.

### 11. Custom / Let AI Decide

- **Purpose:** Let AI choose the best planning approach when the user's content does not fit a profile.
- **Best use cases:** Mixed footage, unusual goals, experimental formats, unclear categories.
- **Clip order guidance:** Treat uploaded order as source sequence and explain any proposed changes.
- **Hook guidance:** Determined by user goal, platform, and content.
- **Pacing guidance:** Determined by edit strategy.
- **Reference video guidance:** Use Reference DNA heavily if provided.
- **Caption guidance:** Determined by speech, platform, and accessibility needs.
- **Music/SoundSync guidance:** Determined by mood, pacing, and user preference.
- **Signature system guidance:** All systems are allowed; AI must justify per-segment choices.
- **Credit cost expectations:** Variable; estimate before approval.
- **Ask only if missing:** Goal, target audience, platform, desired length, and must-avoid items.
