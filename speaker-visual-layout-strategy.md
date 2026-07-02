# Speaker Visual Layout Strategy

## Purpose

ReeditPro needs to decide, segment by segment:

- when to show the speaker
- when to hide the speaker and keep voiceover
- when to use picture-in-picture
- when to use side-by-side
- when to use full visual takeover
- when to use lower visual panels
- when to use maps, charts, evidence boards, and screen captures
- when to use simple captions only

This is not a template system. It is an adaptive planning system based on:

- user request
- video content
- transcript meaning
- platform and aspect ratio
- edit category
- edit level
- reference DNA
- visual asset plan
- source footage quality
- safe zones
- credit budget
- QA risk

The goal is to make every segment answer the viewer's current need instead of forcing one fixed layout across the whole video.

## Core Question

For every segment, ReeditPro asks:

> What does the viewer need to see right now?

Possible answers:

- speaker
- visual
- both
- object or product
- map, chart, timeline, or evidence
- clean video and captions only

## Speaker Presence Modes

### `full_speaker`

The speaker or source footage stays primary. Use when face, emotion, trust, authenticity, personal story, or CTA matters.

### `partial_speaker`

The speaker remains visible but shares space with a visual panel or graphic. Use when the person still matters, but the explanation needs room.

### `picture_in_picture`

The speaker appears in a small PIP zone while the visual owns most of the frame. Use when commentary or teaching benefits from speaker presence but the viewer needs the visual.

### `side_panel_speaker`

The speaker occupies a side panel while the visual occupies the opposite panel. Use for presentation, slideshow, education, business, product, and landscape layouts.

### `voice_only`

The speaker voice continues, but the face is not visible. Use when the viewer needs a full visual such as a map, chart, evidence board, timeline, diagram, or screen capture.

### `hidden`

The source speaker is not visually needed. The edit may use b-roll, full graphics, cards, or a full visual scene.

## Visual Dominance Modes

### `none`

No extra visual. Speaker or source video carries the segment.

### `support`

A small supporting visual, label, lower panel, or callout supports the speaker without taking over.

### `balanced`

Speaker and visual share the frame.

### `dominant`

The visual is the main focus while the speaker remains small, side-panel, or PIP.

### `full_takeover`

The visual takes the whole frame while voice continues or during a visual scene.

## Layout Modes

### `full_speaker`

- Description: Speaker or source footage dominates the frame.
- Best use cases: hooks, emotional lines, trust moments, personal story, CTA, simple points.
- Avoid use cases: dense maps, charts, timelines, documents, or evidence boards.
- Platform fit: all, especially 9:16 talking-head and direct-to-camera clips.
- Basic/Pro/Premium behavior: available to all tiers.
- Preferred tools: source footage, captions, light editor motion.
- Caption/safe-zone notes: captions must avoid faces and key gestures.

### `voiceover_visual_takeover`

- Description: Speaker voice continues while a visual takes over the frame.
- Best use cases: exact information, diagrams, timelines, charts, evidence, maps, screen focus.
- Avoid use cases: emotional confession, trust-building hook, or CTA where the face matters.
- Platform fit: all ratios.
- Basic/Pro/Premium behavior: Basic uses a simple version; Pro and Premium can use richer graphic hierarchy.
- Preferred tools: Remotion, GPT-Image-2, controlled editor motion.
- Caption/safe-zone notes: preserve caption area and readable visual text.

### `picture_in_picture_speaker`

- Description: Large visual with a smaller speaker PIP.
- Best use cases: education, product demos, screen captures, maps, commentary.
- Avoid use cases: crowded vertical frames or emotional lines where speaker should be large.
- Platform fit: all, strongest in 16:9 and 1:1.
- Basic/Pro/Premium behavior: Basic may use simple PIP; Pro and Premium can use stronger PIP placement.
- Preferred tools: Remotion PIP layer, source footage, visual asset.
- Caption/safe-zone notes: PIP must not collide with captions, key labels, or platform UI.

### `side_by_side_speaker_visual`

- Description: Speaker and visual sit in separate side zones.
- Best use cases: YouTube, education, business, product demos, presentations.
- Avoid use cases: tight 9:16 videos, dense mobile captions, or purely emotional beats.
- Platform fit: best in 16:9.
- Basic/Pro/Premium behavior: Pro and Premium preferred; Basic should use simpler lower-panel or full speaker layouts.
- Preferred tools: Remotion side panel, VisualExplain, cards, screen capture.
- Caption/safe-zone notes: captions should stay below both zones or in an approved caption strip.

### `vertical_speaker_top_visual_bottom`

- Description: Speaker stays on top, visual support panel appears below.
- Best use cases: short-form education, quick proof, simple diagram, creator commentary.
- Avoid use cases: visuals with tiny text or detailed maps.
- Platform fit: best in 9:16.
- Basic/Pro/Premium behavior: available to all tiers; Basic should keep the lower visual simple.
- Preferred tools: Remotion vertical zones, GPT-Image-2 cards, editor motion.
- Caption/safe-zone notes: caption zone must avoid both face and lower visual text.

### `vertical_visual_top_speaker_bottom`

- Description: Visual sits above while speaker/source remains visible below.
- Best use cases: short-form visual hook followed by speaker context.
- Avoid use cases: weak visuals, cramped labels, or speaker emotion-first beats.
- Platform fit: 9:16.
- Basic/Pro/Premium behavior: Pro and Premium preferred; Basic can use only when simple.
- Preferred tools: Remotion vertical zones, VisualExplain, PIP-like source footage.
- Caption/safe-zone notes: avoid crowding the speaker lower zone.

### `lower_visual_panel`

- Description: Speaker remains primary with a compact visual panel below or near the lower frame.
- Best use cases: vertical short-form support graphics, simple labels, quick proof points.
- Avoid use cases: complex text, evidence boards, detailed charts, or maps.
- Platform fit: 9:16, also usable in 16:9 lower-panel layouts and 1:1.
- Basic/Pro/Premium behavior: safe default for Basic; Pro and Premium can add more polish.
- Preferred tools: Remotion lower panel, GPT-Image-2 still cards, editor motion.
- Caption/safe-zone notes: captions must not cover face or panel text.

### `full_graphic_explainer`

- Description: Full-frame controlled graphic explanation.
- Best use cases: diagrams, frameworks, steps, lists, process explanation.
- Avoid use cases: personal authenticity moments or source footage that already explains the point.
- Platform fit: all ratios.
- Basic/Pro/Premium behavior: Basic uses simpler hierarchy; Pro and Premium can use richer VisualExplain motion.
- Preferred tools: GPT-Image-2, Remotion, SVG/Lottie where future deterministic motion is needed.
- Caption/safe-zone notes: large readable labels and caption-safe lower area are required.

### `full_stroke_motion_scene`

- Description: Self-contained Stroke Motion story scene where the speaker face is less important.
- Best use cases: story transformation, reveal, action, emotional metaphor, cause and effect.
- Avoid use cases: dense factual proof or real named people without safety planning.
- Platform fit: all ratios when generated inside approved frame/panel rules.
- Basic/Pro/Premium behavior: Pro and Premium preferred; Basic should use still/editor motion unless motion is essential.
- Preferred tools: Stroke Motion, GPT-Image-2 start/end frames, Wan/Hailuo routes, Remotion placement.
- Caption/safe-zone notes: action must stay inside safe margins and caption-safe area.

### `full_map_takeover`

- Description: Map owns the frame while voice explains location, route, or geography.
- Best use cases: location, route, city, neighborhood, country, travel, distance, geography.
- Avoid use cases: points where the map is decorative or unnecessary.
- Platform fit: all ratios, with simplified labels in 9:16.
- Basic/Pro/Premium behavior: available to all tiers; Basic should use simple map cards.
- Preferred tools: MapLibre, Turf, Remotion.
- Caption/safe-zone notes: labels and pins must remain readable.

### `full_evidence_board`

- Description: Documentary or case-study evidence layout with cards, names, sources, timeline, or money trail.
- Best use cases: names, timeline, source context, claim status, money trail, case proof.
- Avoid use cases: unverified allegations presented as fact or crowded mobile layouts.
- Platform fit: all ratios with simplified mobile hierarchy.
- Basic/Pro/Premium behavior: Basic uses simple neutral cards; Pro/Premium can use richer boards and deeper QA.
- Preferred tools: Remotion, GPT-Image-2, D3 if needed.
- Caption/safe-zone notes: allegations must remain visually neutral and readable.

### `screen_capture_with_speaker_pip`

- Description: Screen capture or web/app view owns the frame while speaker appears in PIP.
- Best use cases: websites, SaaS, dashboards, browser pages, articles, product demos.
- Avoid use cases: tiny UI that cannot be read or emotional speaker-led moments.
- Platform fit: best in 16:9, usable in 1:1 and simplified 9:16.
- Basic/Pro/Premium behavior: Basic can use simple mock screen cards; Pro/Premium can plan richer capture layouts.
- Preferred tools: Playwright, Remotion.
- Caption/safe-zone notes: PIP must not cover important UI or captions.

### `speaker_cutout_overlay`

- Description: Speaker cutout overlays a dominant visual.
- Best use cases: advanced Premium explainers where speaker presence and visual dominance both matter.
- Avoid use cases: Basic/Pro default planning, unclear foreground edges, or any task before masking exists.
- Platform fit: all ratios only after future masking/depth support.
- Basic/Pro/Premium behavior: Premium preferred. Actual cutout and masking are future RP-LAYOUT-02 work.
- Preferred tools: future foreground masking, depth-aware compositor, Remotion.
- Caption/safe-zone notes: avoid face, caption, and object collisions.

### `b_roll_cutaway`

- Description: Uploaded b-roll or proof footage takes over while speaker continues as voiceover.
- Best use cases: product detail, environment, proof, room tour, process detail, cutaway footage.
- Avoid use cases: random filler footage or moments where face/trust matters more.
- Platform fit: all ratios.
- Basic/Pro/Premium behavior: safe across all tiers when footage supports meaning.
- Preferred tools: uploaded clips, source sequence map, Remotion/source layer.
- Caption/safe-zone notes: preserve important source details and captions.

### `split_screen_comparison`

- Description: Two visuals or states share the frame for comparison.
- Best use cases: before/after, competitor comparison, option A/B, proof contrast.
- Avoid use cases: small text, too many columns, or emotional speaker moments.
- Platform fit: best in 16:9 and 1:1, simplified in 9:16.
- Basic/Pro/Premium behavior: Pro/Premium preferred; Basic should use a simpler before/after card.
- Preferred tools: Remotion, VisualExplain, GPT-Image-2 cards.
- Caption/safe-zone notes: both sides need readable labels and safe caption placement.

### `before_after_panel`

- Description: Before/after visual panel shows transformation.
- Best use cases: results, transformations, product outcomes, property changes, case results.
- Avoid use cases: unverified claims or layouts where the contrast is unclear.
- Platform fit: all ratios.
- Basic/Pro/Premium behavior: Basic can use a simple static panel; Pro/Premium can add controlled motion.
- Preferred tools: Remotion, GPT-Image-2, VisualExplain.
- Caption/safe-zone notes: label both states clearly.

### `object_anchored_callout`

- Description: Callout is anchored to a product, object, or visual proof area.
- Best use cases: product feature, real estate detail, app UI highlight, object proof.
- Avoid use cases: Basic default planning or any claim that requires real tracking before tracking exists.
- Platform fit: all ratios when safe zones allow it.
- Basic/Pro/Premium behavior: Pro/Premium planning only; actual object tracking is future work.
- Preferred tools: future object tracking, Remotion, VisualExplain.
- Caption/safe-zone notes: do not cover speaker face, product, or captions.

## Decision Rules

Use full speaker when:

- speaker emotion matters
- trust/authenticity matters
- hook line is human or emotional
- the point is simple
- the speaker face carries the story

Use voiceover visual takeover when:

- the spoken concept needs full visual space
- exact information matters
- map, chart, timeline, evidence, or diagram needs room
- speaker face is less important than the visual

Use PIP speaker when:

- the visual needs most space
- speaker presence still matters
- commentary or teaching context benefits from seeing the speaker

Use side-by-side when:

- teaching, business, product, or presentation feel is useful
- YouTube or landscape format gives enough space
- visual and speaker both matter

Use lower visual panel when:

- the edit is vertical short-form
- speaker should stay primary
- visual supports the point
- visual is simple enough for a smaller panel

Use full evidence board when Documentary / Case Study needs names, timeline, source, money trail, or claim context.

Use full map takeover when location, route, geography, real estate, travel, or distance matters and needs clarity.

Use screen capture with speaker PIP when a website, SaaS app, article, dashboard, page, browser, or screen recording needs to be shown.

Use b-roll cutaway when uploaded footage supports the spoken point better than a generated visual.

## Platform Logic

### 9:16

- `full_speaker`
- `lower_visual_panel`
- `vertical_speaker_top_visual_bottom`
- `picture_in_picture_speaker`
- `voiceover_visual_takeover`
- `full_map_takeover`
- `full_evidence_board`

### 16:9

- `side_by_side_speaker_visual`
- `full_speaker`
- `picture_in_picture_speaker`
- `full_graphic_explainer`
- `screen_capture_with_speaker_pip`
- `full_map_takeover`
- `split_screen_comparison`

### 1:1

- `full_speaker`
- `picture_in_picture_speaker`
- `square_center_panel` as the frame template for centered visual layouts
- `lower_visual_panel`
- `full_graphic_explainer`

## Tier Behavior

### Basic

Basic should use safe, clean layouts:

- `full_speaker`
- `b_roll_cutaway`
- `lower_visual_panel`
- simple `voiceover_visual_takeover`
- simple `picture_in_picture_speaker` if useful

Basic should avoid complex cutouts, depth-aware masking, object tracking, and advanced overlays.

### Pro

Pro can use:

- side-by-side layouts
- visual takeovers
- maps, charts, evidence boards
- picture-in-picture
- stronger VisualExplain layouts

Pro may reference foreground-aware or object-aware planning only as future planning context. Full masking and tracking remain RP-LAYOUT-02 or later.

### Premium

Premium can plan more layout variety:

- stronger mixed layouts
- advanced speaker cutout planning
- deeper QA
- future depth-aware composition
- object preservation and contact-object handling

Veo remains final fallback/rescue only and never becomes default layout or generation behavior.

## Relationship To Remotion

Remotion owns:

- final canvas
- speaker zone
- visual zone
- caption safe zone
- layer timing
- PIP positioning
- side-by-side layout
- lower panels
- card/map/chart placement
- transitions between layout modes

AI models generate assets or clips only. They do not generate the final full video.

## Relationship To Prompt Building

Prompt builders must know:

- layout mode
- visual zone size
- safe margins
- whether this is full takeover or lower panel
- whether speaker is visible
- caption zone
- matching panel background

Image and video prompts should describe the asset's assigned layout role. Remotion motion briefs should include layout mode, speaker visibility, visual dominance, visual zone, and caption safe zone.

## Non-Goals

This document does not implement:

- real video analysis
- real segmentation
- real masking
- real depth-aware object preservation
- real object tracking
- real OpenCV processing
- real Remotion rendering
- real upload/playback
- backend, Supabase, migrations, Stripe, billing, credit deduction, or provider API calls
