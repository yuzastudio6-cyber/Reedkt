# Placement, Depth, and Occlusion

## VisualOccupancyManifest

Final placement uses final or near-final frames and a shared, versioned occupancy manifest. Protected regions may include face, eyes, mouth, hair, hands, gestures, product, important objects, existing text, map labels, chart values, browser highlights, lower thirds, CTA, B-roll panels, Living Frame visuals, platform interface, and crop-risk areas.

Evidence may come from approved Qwen VLM observations, OpenCV, MediaPipe, PaddleOCR, layout plans, B-roll/visual plans, masks/tracking, and platform profiles. Each observation carries provenance and confidence.

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

Object/environmental typography may attach to a product, phone, hand, wall, desk, screen, or map region. Anchor records include coordinate space, transform, tracking confidence, occlusion relationship, lost-anchor behavior, camera relationship, and fallback region.

Rendered-frame QA—not bounding boxes alone—must validate final visibility, mask edges, glyph recognition, and stable read time.
