# B-roll and Visual Co-composition

Caption Direction consumes existing B-roll, map, chart, diagram, browser, evidence, lower-third, and layout plans. It does not replace their owners.

Supported compositions include:

- B-roll above the speaker;
- speaker below or beside B-roll;
- captions beside B-roll;
- stable transcript captions near the speaker;
- semantic or hero typography in another region;
- persistent lists alongside changing B-roll;
- caption-to-visual handoff into a map, chart, diagram, or controlled visual.

## Co-composition contract

Each scene declares:

- region ownership and priority;
- existing visible text/OCR evidence;
- protected labels, products, faces, and CTAs;
- semantic duplication policy;
- caption track roles and preferred/fallback zones;
- transition/handoff frames requested from StoryTiming;
- crop and output-variant behavior;
- fallback when visual assets are late or replaced.

## Rules

- Do not cover important B-roll labels or repeat visible text without purpose.
- Do not place accessibility captions inside rapidly changing visual panels when a stable region exists.
- Structural typography that changes panel size or shot duration must be reserved and approved early.
- A visual replacement or crop/reframe invalidates affected final placement.
- Maps, charts, diagrams, browser captures, evidence labels, and exact data never fallback to AI video.
