# Caption Style Profile

`CaptionStyleProfile` is a typed, versioned set of creative and executable constraints. It supports project defaults and explicit scene-level mode changes.

## Project modes

`accessibility_first`, `clean_long_form`, `dynamic_short_form`, `cinematic_editorial`, `educational_explainer`, `multi_speaker_dialogue`, `brand_directed`, `minimal_support`

Possible scene modes include clean subtitles, creator phrases, spatial sentences, hero typography, behind-subject text, persistent lists, full-screen titles, Caption-to-Visual transformations, and minimal/no-caption passages.

## Typography roles

Roles may include primary speech, hero display, editorial serif, quotation, handwritten/emotional accent, cultural/archival accent, technical, and speaker-label fonts. Each role declares:

- purpose and activation rules;
- maximum frequency;
- approved font asset and weights;
- supported scripts/glyph coverage;
- permitted motion and color roles;
- accessible fallback.

Multiple fonts are coherent only when their roles are explicit; novelty is not a selection rule.

## Optical sizing

Store normalized base size, minimum/maximum size, maximum width ratio, maximum lines, phrase-size stability, phone/desktop/television profiles, hero scale ranges, and semantic scale constraints. Use actual shaped glyph geometry.

Readability size, perspective size, editorial size, and semantic size are separate concepts. A phrase must not oscillate in size merely because character counts differ.

## Semantic color

Roles may include base speech, active speech, emphasis, warning/conflict, positive result, speaker identity, hero phrase, historical context, and Caption-to-Visual connection. Color is never the sole carrier of meaning.

## Executable legibility

Profiles store exact text/stroke/shadow/backplate/scrim colors and opacity, stroke width, shadow blur/offset, padding, corner radius, and approved local background blur. The renderer uses the minimum treatment that passes readability and preserves the approved color-managed appearance.

## Motion and placement

The profile allowlists entrances, internal motions, exits, duration/easing ranges, overshoot, travel, stagger, density, repetition, and reduced-motion substitutions. Placement declares preferred/fallback zones, stability requirements, protected face/mouth/gesture/product/text/interface regions, and allowed depth planes.

## Snapshot behavior

Approved snapshots freeze the profile version, resolved font assets, renderer compatibility, output profile, and any scene overrides. A mutable brand preset cannot silently change an approved render.
