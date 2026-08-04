# Placement, Depth, and Occlusion

## VisualOccupancyManifest

Final placement uses final or near-final frames and a shared, versioned occupancy manifest. Protected regions may include face, eyes, mouth, hair, hands, gestures, product, important objects, existing text, map labels, chart values, browser highlights, lower thirds, CTA, B-roll panels, Living Frame visuals, platform interface, and crop-risk areas.

Evidence may come from Visual Intelligence observations, deterministic OpenCV
or OCR measurements, layout plans, B-roll/visual plans, and Track All mask,
tracking, anchor, and occlusion artifacts. Each observation carries provenance
and confidence. Captions does not call a visual provider or SAM runtime
directly.

## Candidate scoring

Candidate placement is scored against:

- readability and measured background contrast;
- face/mouth/gesture/product/label safety;
- Living Frame and platform safety;
- shaped phrase width and line geometry;
- composition balance;
- required movement and stability;
- depth/occlusion intent;
- crop/reframe resilience.

The worker must not independently default every caption to `bottom_safe`.

## Depth roles

`far_background`, `environmental_background`, `behind_subject`, `subject_plane`, `speaker_adjacent`, `object_attached`, `in_front_of_subject`, `foreground_hero`, `full_screen`

The accessible/stable track defaults above creative depth and outside protected regions. Creative tracks may occupy other planes only when the approved scene graph and masks support them.

## Collision versus occlusion

Collision avoidance asks whether elements overlap accidentally. Occlusion-aware typography asks whether intentional overlap is valuable and still understandable.

Safe occlusion generally needs large recognizable forms, limited hidden area, sufficient pre/post visibility, short hidden duration, noncritical hidden portions, and a complete accessible projection.

Never intentionally hide proper names, critical numbers, negation, claim-sensitive wording, or most of a critical word. Mask flicker, unstable tracking, and competing occluded phrases are blocking defects.

## Anchors

Object/environmental typography may attach to a product, phone, hand, wall, desk, screen, or map region. Anchor records include coordinate space, perspective transform, scale/rotation compensation, tracking confidence, occlusion ordering, motion blur policy, camera relationship, exit behavior when the anchor leaves frame, lost-anchor behavior, and a stable screen-space fallback.

Environmental typography may belong to a wall, landscape, glowing background,
title environment, projected surface, or stylized depth composition. It remains
speech-derived typography and must not be confused with untracked source text.

Rendered-frame QA—not bounding boxes alone—must validate final visibility, mask edges, glyph recognition, and stable read time.

## Camera coordination

Caption Direction may request a digital push, reframe, drift, focus handoff,
speaker de-emphasis, background softening, follow, or full-screen transition
when it has a narrative reason. The camera/layout system and StoryTiming retain
execution and conflict authority. The attention budget rejects simultaneous
excessive camera, caption, Living Frame, B-roll, and transition movement.
