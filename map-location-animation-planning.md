# Map + Location Animation Planning

## Purpose

ReeditPro needs a professional map and location planning layer for videos where geography, movement, place, neighborhood, route, or location evidence matters. Map visuals should help the viewer understand where something happened, where someone traveled, where a property or neighborhood is, how places are connected, how a story moved across cities or regions, where an event or case took place, and how locations fit in a timeline.

This layer is planning-only. It does not render maps, call map APIs, geocode locations, verify locations, or execute any map tool.

## Controlled Tools, Not AI Video

Map and location visuals should generally use controlled tooling:

- MapLibre for map display and camera animation planning.
- Turf for route, bounds, distance, geometry, and padding planning.
- Remotion for final composition, layout, caption placement, and timing.
- D3, deck.gl, or CesiumJS later for advanced map/data/globe visuals.
- GPT-Image-2 only for stylized map cards or non-geographic illustrations where exact map accuracy is not needed.

AI video should not invent exact maps, labels, roads, pins, or geography. Wan, Hailuo, and Veo are not map rendering tools. Veo remains Premium-only final fallback for AI video assets, not map generation.

## Map Visual Types

- `location_pin`: simple location reveal with one pin or label.
- `route_reveal`: route line drawn between two or more points.
- `multi_location_sequence`: multiple locations shown in order.
- `region_highlight`: approximate state, country, neighborhood, or region highlight.
- `real_estate_neighborhood`: property or neighborhood context.
- `travel_route`: travel movement, itinerary, or trip path.
- `documentary_case_map`: restrained geography for documentary or case-study context.
- `evidence_location_map`: source-aware evidence map with careful wording.
- `money_movement_map`: geography of financial movement or scam/fraud flow.
- `screen_map_card`: map shown as a framed card.
- `map_behind_subject`: map behind a speaker or foreground subject.
- `map_behind_subject_and_contact_object`: map behind a person plus contact object such as a pole, table, chair, mic, laptop, or product.
- `picture_in_picture_map`: speaker PIP over a map.
- `side_by_side_map`: speaker and map side by side.
- `lower_panel_map`: compact lower panel map.
- `full_map_takeover`: map owns the frame for a short explanation.
- `globe_reveal_future`, `heatmap_future`, `arc_flow_future`: advanced future-only map visuals.

## Layout Modes

- `full_map_takeover`: use when geography needs full attention and the speaker can move to voiceover.
- `lower_visual_panel`: use for Basic/simple location context or short-form vertical explainers.
- `side_by_side_speaker_visual`: use when trust/speaker presence matters while the map explains.
- `picture_in_picture_speaker`: use when the map should dominate but the speaker should stay visible.
- `voiceover_visual_takeover`: use when the map is the main explanation and voice carries context.
- Foreground-aware overlay: use for map behind subject when foreground preservation is planned.
- Screen/map card inside a frame: use when an exact map is not needed full-screen.

## Map Behind Subject And Contact Object

A Premium-style map overlay can sit behind a person and behind important contact objects, such as a pole, table, microphone, chair, laptop, product, or object the person is leaning on, holding, or touching.

Rules:

- The person and contact object can become one foreground depth group.
- The map layer sits behind that group.
- Captions remain above everything.
- Map labels must remain readable outside foreground and caption zones.
- If mask risk is high, the plan must include a safer fallback layout.
- Basic should usually use safer layouts such as lower panel or side-by-side.
- Pro can plan low/medium risk map-behind-subject overlays with fallback.
- Premium can plan advanced foreground/contact-object preservation with stronger QA.
- This milestone only plans the effect. It does not generate masks.

## Map Style Families

- `clean_social_map`: bright, readable, low-label map for social explainers; avoid clutter and fake precision.
- `documentary_evidence_map`: neutral evidence tone with restrained colors; use source-aware wording.
- `muted_case_study_map`: quiet case-study map for scams, investigations, or serious claims; avoid sensational styling.
- `warm_lifestyle_travel_map`: warmer travel or lifestyle tone; keep pins and routes friendly but clear.
- `real_estate_neighborhood_map`: neighborhood context, nearby points, and property relation; avoid dense traffic-like visuals.
- `business_location_map`: clean business/location context; use restrained brand colors.
- `luxury_property_map`: premium real estate/property tone with calm warmth and clean labels.
- `dark_cinematic_map`: dramatic map style for story moments; avoid documentary overstatement.
- `high_contrast_simple_map`: highly readable simple map for quick explanations.
- `custom`: user-directed style mapped to a safe known family plus custom notes.

## Camera And Animation Settings

Map plans should understand:

- `mapStyle`, `centerCoordinates`, `zoom`, `bearing`, `pitch`
- `cameraPath`, `flyDuration`, `flySpeed`, `curve`, `easing`
- `fitBounds`, `padding`
- `routeLineColor`, `routeLineWidth`, `routeLineDash`, `routeRevealDuration`
- `pinStyle`, `pinDropTiming`
- `labelStyle`, `regionHighlightColor`, `regionHighlightOpacity`
- `mapPanelBackground`, `safeLabelZones`, `captionSafeZone`
- `foregroundMaskAwareness`

## Tier Behavior

Basic:

- Static/simple map card.
- Lower panel map.
- Simple pin/location reveal.
- Simple voiceover visual takeover.
- No complex map-behind-subject masking unless very safe.
- No heavy map animation.
- No Veo.

Pro:

- Route reveal.
- Multi-location sequence.
- Side-by-side or PIP map.
- Map behind subject if low/medium risk with fallback.
- MapLibre/Turf planning.
- No Veo.

Premium:

- Advanced map animation.
- Richer documentary/evidence maps.
- Map behind subject plus contact objects.
- Stronger depth/mask QA planning.
- Future deck.gl/CesiumJS planning if needed.
- Veo still final fallback only for AI video, not map generation.

## Map Safety And Claims

For Documentary / Case Study:

- Do not present uncertain location claims as verified.
- If location is alleged or unknown, use safe wording.
- Map visuals should not exaggerate certainty.
- Source-needed location claims should be flagged.
- Avoid fake exact pins if only broad region is known.
- Use approximate region highlights when exact location is uncertain.

## Tool Responsibilities

MapLibre:

- Map camera/render planning.
- Pins, routes, layers, and future map asset generation.

Turf:

- Route, bounds, distance, and geometry planning.

Remotion:

- Map layer placement.
- Speaker/visual layout.
- Timing, captions, and depth-aware composition layer planning.

OpenCV/segmentation future:

- Mask, foreground, and contact-object preservation.

GPT-Image-2:

- Stylized map cards, documentary map card frames, and non-geographic illustration.
- Not exact geographic truth unless used as a clearly illustrative metaphor.

Wan/Hailuo/Veo:

- Not for maps.
- Only relevant if a map is part of an organic generated story scene, where geography accuracy is limited.
- Veo remains Premium-only fallback for AI video assets.

## Non-Goals

This milestone does not install MapLibre/Turf, render real maps, call map APIs, geocode locations, verify locations, run Remotion, or run backend workers.
