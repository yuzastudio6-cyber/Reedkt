# Frame Layout System

## Purpose

ReeditPro should not depend on transparent AI video backgrounds by default. The final canvas belongs to ReeditPro's editor/compositor, and AI animation should be generated inside a controlled frame or panel.

The generated animation background should match the panel background so it composites cleanly inside the final ReeditPro frame. The default panel background is `#FFFFFF`, or a configurable near-white/custom color when the edit plan calls for it.

Transparent overlays can remain a future option for deterministic systems such as SVG, Lottie, Remotion, or controlled renderers. Transparent AI video generation is not the default route.

## Layout Principles

- ReeditPro owns the final canvas, captions, safe zones, panel placement, and compositing.
- AI animation should be generated on a matching white, near-white, or custom panel background.
- Still cards, fact cards, name cards, diagrams, and AI animation panels should follow the target aspect ratio.
- Speaker footage remains primary unless the approved edit plan says otherwise.
- Captions should not cover faces, key objects, panel text, or visual proof moments.

## Template Fields

Frame templates should define:

- Aspect ratio.
- Canvas size.
- Speaker zone.
- Animation zone.
- Caption safe zone.
- Safe margins.
- Panel background color.
- Notes.

## Launch Templates

### TikTok/Reels/Shorts Vertical

Vertical layouts use `9:16` canvases, often with a speaker zone in the upper portion and a lower animation panel.

Recommended launch templates:

- `vertical_talking_head_lower_panel`: speaker zone above, animation panel below.
- `vertical_full_panel`: full visual scene for no-speaker or full-panel story moments.

### YouTube Landscape

YouTube layouts use `16:9` canvases, often with a side panel or lower panel.

Recommended launch templates:

- `youtube_side_panel`: speaker/content on one side, animation panel on the opposite side.
- `youtube_lower_panel`: speaker/content above, animation or proof panel below.

### Square

Square layouts use `1:1` canvases, usually with a centered or lower panel.

Recommended launch template:

- `square_center_panel`: centered white panel with lower caption safe zone.

## Background Policy

AI video generation should default to matching the approved panel background.

- Default panel color: `#FFFFFF`.
- Near-white or custom panel colors may be used when the brand/style plan requires it.
- Do not require transparent AI video backgrounds for default animation routing.
- Use transparent overlays only when a deterministic renderer can provide controlled, inspectable output.
