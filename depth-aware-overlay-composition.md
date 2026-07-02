# Depth-Aware Overlay Composition

## 1. Purpose

Depth-aware overlay composition makes ReeditPro visuals feel integrated into real footage.

Instead of simply placing a map, card, graphic, or animation on top of the video, ReeditPro can plan to place that visual behind selected foreground subjects and important objects. The milestone is planning-only: it describes where layers should go, which foreground objects may need preservation, how risky the composition is, and which fallback layout should be used if a future mask worker cannot execute it cleanly.

Example:
- The person remains in front of a map overlay.
- The pole the person is leaning near also remains in front.
- The map feels behind the scene.
- Captions remain above everything.

This is not real segmentation, mask generation, object detection, tracking, OpenCV processing, background removal, or Remotion rendering. It is typed frontend/mock planning for later workers.

## 2. Core Layer Stack

Depth-aware composition uses a planned layer stack:

Layer 5:
- captions
- top text
- UI-safe elements

Layer 4:
- foreground subject/object masks
- person masks
- contact object masks
- hero object masks
- scene anchor masks

Layer 3:
- map layer
- card layer
- graphic layer
- AI animation layer
- VisualExplain layer

Layer 2:
- original video
- source footage

Layer 1:
- background processing
- color/base video treatment
- any planned base cleanup

Captions stay above masks and graphics. The graphic/map/card layer can sit between source footage and foreground masks when depth-aware composition is useful and approved.

## 3. Important Foreground Objects

ReeditPro does not need to preserve every object. It should identify which planned foreground objects matter for the story, depth illusion, or readability.

### human_subject

The main person or people who should remain visually clear:
- main speaker
- secondary person
- face
- hands
- body silhouette

### contact_object

An object the person is touching, holding, leaning on, sitting on, using, or visually connected to:
- pole
- chair
- table
- phone
- laptop
- microphone
- product
- steering wheel
- bag
- tool
- counter
- desk
- bike
- door frame

### hero_object

The product or object the video is about:
- product
- phone
- car
- house
- food item
- document
- tool
- screen

### scene_anchor_object

An object that helps the overlay feel grounded in the real scene:
- pole
- railing
- table edge
- counter
- podium
- mic stand
- door frame

### background_object

A normal background object that usually does not need preservation unless it affects depth, story, or readability.

## 4. Contact Object Preservation

Contact object preservation is a core part of premium depth-aware composition.

If a person is interacting with an object, that object may share the same foreground depth group. The visual can then sit behind both the person and the object, instead of covering one and preserving the other.

Example: person leaning near a pole
- Foreground group: person plus pole.
- Graphic/map layer should go behind both.
- Captions stay above both.
- If the map covers the pole while the person stays in front, the edit looks fake.

Rules:
- Preserve contact objects only when they affect depth, story, or readability.
- Do not mask every object.
- Contact object preservation is more complex than subject-only masking.
- If mask risk is high, use a safer layout.
- If a future worker cannot confirm the contact object, fall back to a lower panel, side-by-side layout, or full visual takeover.

## 5. Depth Compositing Modes

### none

No depth overlay. The segment uses a normal layout, panel, full speaker shot, or full visual takeover without foreground masking.

### graphic_on_top

A graphic sits on top of source video without masking. This is safer and can work for small labels, simple callouts, or empty-space overlays.

### graphic_behind_subject

The graphic layer appears behind the main person or subject. This requires a planned subject mask and future worker confirmation.

### graphic_behind_subject_and_contact_objects

The graphic appears behind the person plus contact objects or scene anchors. This is the key mode for cases like a map behind a person and a pole.

### graphic_between_background_and_foreground

The graphic is inserted between the base video background and preserved foreground elements. This may require subject, contact object, or multi-object depth masks.

### subject_cutout_overlay

The subject is cut out and placed over a new planned layout. This is an advanced composition plan and must not be treated as executed masking in the frontend mock.

### object_anchored_overlay

A graphic follows or anchors to a planned object. This implies future tracking or object confirmation and should include fallback layout.

### masked_panel_behind_subject

A panel or card sits behind the subject while the subject mask stays on top. This can make lower panels and speaker-led graphics feel integrated.

### full_visual_replacement

The source video is hidden and the visual takes over. This has no foreground mask requirement, but captions and safe zones still matter.

## 6. Mask Strategies

### none

No mask is planned.

### subject_mask

A foreground mask for the person or main subject only.

### subject_plus_contact_object_mask

A mask group for the person plus an object they touch, lean on, hold, or visually connect to.

### hero_object_mask

The product or hero object is preserved in front of the overlay.

### scene_anchor_mask

A pole, table, door, counter, railing, or similar anchor is preserved to keep the composition grounded.

### multi_object_depth_mask

Subject plus several objects or anchors are preserved. This is advanced and should be used only when the effect meaningfully improves the edit.

### full_cutout_composition

Subject or object is cut out and recomposited over a new layout. This is premium-risk planning and requires future worker validation.

## 7. Mask Risk Levels

### low

Use for static subjects, clean edges, large obvious foreground shapes, simple backgrounds, and low movement.

### medium

Use for moderate movement, some thin objects, partially complex backgrounds, or an object near the foreground.

### high

Use for fast movement, thin or complex objects, hair, transparent objects, heavy camera motion, busy backgrounds, or overlapping subjects.

### premium

Use for multiple moving foreground objects, subject plus contact object plus hero object, tracking needs, edge refinement needs, or temporal consistency needs.

## 8. Tier Behavior

### Basic

Basic uses safer layouts:
- lower visual panels
- side-by-side when supported by the frame
- simple voiceover visual takeover
- simple overlay in safe empty space
- full visual replacement when the speaker does not need to remain visible

Basic avoids complex foreground masks and multi-object depth masks. It can note a requested depth effect as not used in Basic unless extremely simple, then recommend a safe fallback.

### Pro

Pro can plan foreground-aware overlays when useful:
- subject mask when the scene is clear
- subject plus contact object mask when risk is low or medium
- map/card behind person when safe
- fallback layout required for medium or higher mask risk

Pro still does not execute masks in the frontend and must never route to Veo because of depth composition needs.

### Premium

Premium can plan deeper compositions:
- multi-object depth masks
- contact object preservation
- hero object masks
- object anchoring/tracking plans
- stronger QA
- fallback attempts
- manual-style review notes

Premium still treats Veo as final fallback/rescue only. Depth composition is a compositing and masking problem, not a reason to default to AI video generation.

## 9. Sticky Rules

- Protect the face first.
- Preserve contact objects when they affect the depth illusion.
- Do not mask every object.
- Use depth-aware overlays only when they improve the edit.
- If mask risk is high, use a safer layout.
- Captions stay above foreground masks and graphics.
- Graphic text must remain readable.
- Fallback layout must exist for medium, high, or premium risk depth effects.
- Do not use depth-aware overlay just because it looks cool.
- The visual must support the spoken meaning.
- Workers must not execute mask or depth plans before approval.

## 10. Tool Implications

Remotion owns layer ordering and final composition:
- base source video
- overlay graphic/card/map layer
- future foreground subject/object mask layer
- captions/top text layer

Future segmentation, OpenCV, background-removal, and tracking workers may create masks after approval, but this milestone does not implement them.

MapLibre, D3, ECharts, GPT-Image-2, or similar tools may create visual assets. Wan, Hailuo, and Veo are not used to solve masking. FFmpeg may handle final export later, but not in this milestone.

Depth-aware composition is mainly layout, compositing, QA, and worker-planning metadata. It is not AI video generation.

## 11. Prompt Implications

Prompt builders should know when an asset will be:
- behind a subject
- behind subject plus contact objects
- in a masked panel
- a full visual takeover
- object anchored

Generated assets should keep important text away from expected foreground masks. Map labels, card titles, evidence labels, and callout text should avoid the planned face/body/contact-object zones. Matching panel backgrounds and caption safe zones still apply.

AI video prompts should create clips or assets only. They should not ask Wan, Hailuo, or Veo to solve real masking. Remotion and future mask workers handle the final composition.

## 12. Non-Goals

This milestone does not implement:
- real segmentation
- real masks
- real tracking
- real OpenCV
- real background removal
- real object detection
- real Remotion rendering
- real upload/playback
- backend execution
- provider API calls
