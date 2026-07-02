# Video Understanding Report

## Purpose

A Video Understanding Report helps ReeditPro understand the uploaded footage before choosing editing style, b-roll, visual assets, layout, tools, color, captions, sound, and model routes.

The report exists to prevent template editing. Instead of assuming "Education video equals charts" or "Storytelling video equals Stroke Motion," ReeditPro asks:

> What does this exact video need?

This milestone is mock-only. It creates structured planning fields for future transcript, visual, audio, and media analysis workers, but it does not run real analysis.

## What The Report Understands

The report should summarize:

- source clip order
- clip roles
- transcript meaning
- story structure
- hook candidates
- strong lines
- weak or dead sections
- emotional moments
- proof moments
- explanation moments
- CTA or outro moments
- b-roll opportunities
- visual support opportunities
- speaker visibility needs
- graphic, map, chart, and timeline opportunities
- screen capture opportunities
- object and product moments
- location and map moments
- audio quality issues
- visual quality issues
- color and lighting issues
- safe zones
- face, product, and object protection zones
- caption risk zones
- foreground and depth opportunities
- tool strategy hints
- QA concerns

## Relationship To User Intent

User instructions remain higher priority than default video analysis.

If the report detects a fast social hook candidate but the user asks to keep the edit calm and natural, ReeditPro should keep the edit calm and natural. The report guides planning. It does not override explicit user instructions, tier policy, safety policy, approval gates, source-order requirements, or model-routing rules.

## Relationship To Source Order

Uploaded order is source and story context. The report should reference:

- uploaded order
- confirmed source order
- possible final edit order suggestions
- clips marked important or optional
- b-roll and support clips

If source order is not confirmed, the report can be a draft, but approval should warn that source order needs confirmation before generation begins.

## Clip Role Detection

Mock clip roles:

- `main_story`
- `hook_candidate`
- `context`
- `proof`
- `b_roll`
- `speaker`
- `product`
- `screen_recording`
- `location`
- `transition`
- `ending`
- `optional`
- `unknown`

These roles are planning hints only. Future workers can replace them with real transcript, scene, and media analysis.

## Transcript And Meaning Analysis

Transcript intelligence fields should include:

- transcript summary
- key phrases
- hook lines
- claim lines
- emotional lines
- explanation lines
- CTA lines
- unclear lines
- visual support needed
- caption density recommendation

The mock frontend report derives these from project settings, clip metadata, and custom instructions only. It does not create or analyze a real transcript.

## Visual Analysis

Visual analysis fields should include:

- detected scene type
- speaker framing
- face zone
- product and object zones
- empty space zones
- background complexity
- foreground subject opportunities
- contact object opportunities
- masking and depth opportunity
- b-roll quality
- screen capture, product shot, map, and location indicators
- visual quality issues
- color and lighting issues

This is advisory planning. It should not claim actual face detection, object detection, segmentation, or computer vision has happened.

## Audio Analysis

Audio analysis fields should include:

- voice clarity
- background noise
- music present
- loudness consistency
- silence or dead space
- breath and filler density
- SoundSync opportunity
- audio cleanup need

This milestone does not perform real audio analysis. It records expected professional cleanup and timing concerns for future workers.

## Visual Support Opportunities

Opportunity types:

- `caption_only`
- `b_roll_cutaway`
- `still_card`
- `fact_card`
- `name_card`
- `timeline_card`
- `evidence_board`
- `graphic_explainer`
- `chart_or_diagram`
- `map_animation`
- `screen_capture`
- `stroke_motion`
- `real_motion`
- `full_visual_takeover`
- `lower_panel_visual`
- `picture_in_picture`
- `no_extra_visual`

Each opportunity should explain why that visual helps the exact beat. ReeditPro should avoid adding visuals just because a category usually uses them.

## Tool Strategy Hints

The report may suggest tool categories, not execute tools:

- `remotion_layout`
- `gpt_image_asset`
- `wan_animation`
- `hailuo_fallback`
- `veo_premium_fallback_only`
- `map_tool`
- `chart_tool`
- `browser_capture_tool`
- `color_pipeline`
- `audio_pipeline`
- `qa_vision_tool`
- `none`

Tool hints identify needs for later routing. They do not install tools, call providers, create masks, render video, or start workers.

## Tier Behavior

Basic:

- identifies useful opportunities but prefers safe, simple choices
- focuses on color, audio, pacing, captions, and clean b-roll
- uses fewer AI video assets
- never uses Veo

Pro:

- plans richer visual support when it improves the segment
- may use Hailuo as fallback according to routing policy
- never uses Veo

Premium:

- plans deeper opportunity detection and QA notes
- may include more character, layout, and depth-aware review
- may use Veo only as final fallback/rescue, never as primary/default

## Non-Goals

This milestone does not implement:

- actual video analysis
- actual transcript generation
- actual scene detection
- actual face detection
- actual object detection
- actual audio analysis
- actual computer vision
- actual tool execution
- actual rendering
