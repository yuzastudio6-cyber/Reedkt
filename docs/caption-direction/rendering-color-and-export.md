# Rendering, Color, and Export

## Render ownership

- Remotion: creative caption scene composition.
- libass: stable subtitle/open-caption fallback and delivery path.
- FFmpeg: mux, transcode, package, and technical validation.
- OpenTimelineIO/Hyperframe: approved timeline/editor interchange where applicable.

No renderer makes story decisions or executes raw chat.

## Deterministic creative render

`CaptionRenderSpec` freezes:

- approved snapshot, scene graph, StoryTiming, output frame, and color profile;
- exact font assets/subsets and shaped layout;
- mask/anchor/occupancy versions;
- typed motion primitive values;
- pinned Remotion packages and browser build;
- asset hashes, renderer image, and tolerance profile;
- reduced-motion and fallback variants.

Identical approved specs should render identically within documented rasterization/codec tolerances. Models never write JSX, JavaScript, CSS, shell, filter graphs, or renderer code.

## Stable render

ASS must use the approved canvas, safe zones, fonts, script direction, and projection—not a hard-coded 1080×1920 canvas. SRT and WebVTT carry accessible text/timing without pretending to preserve creative spatial choreography.

The current fixed-canvas ASS builder remains a legacy path until CAP-14 adds a versioned, canvas-aware path and compatibility fixtures.

## Layer order

The target logical stack is:

1. final/color-managed source picture;
2. far-background typography;
3. environmental background typography;
4. behind-subject typography;
5. Living Frame background elements;
6. subject or foreground masks;
7. subject-plane typography;
8. object-attached typography;
9. in-front-of-subject typography;
10. foreground hero typography;
11. standard readable speech captions;
12. explicitly required accessibility-safe visible text;
13. transitions and output finishing.

Depth roles select layers; captions are not forced into one global topmost
layer. Critical readable projections must remain comprehensible regardless of
creative depth.

## Color management

- `CaptionColorManagementPlan` records the output color space, whether the look
  is already applied, where captions enter the pipeline, brand preservation,
  HDR/SDR behavior, alpha behavior, local scrim/backplate behavior, and
  preview/final parity.
- Design colors are interpreted in a declared working/output space.
- Contrast and legibility QA run on color-managed rendered frames.
- HDR/SDR and gamut transforms cannot silently change semantic colors or reduce readability.
- Calibration previews identify proxy limitations.
- Transparent/alpha handling, premultiplication, stroke/shadow blending, and local scrims are specified.
- Font rasterization and subpixel behavior are tested across preview/final paths.

Caption colors normally composite in a controlled output/display space so a
creative grade cannot unpredictably alter approved text. The existing color
pipeline remains the owner.

## Caption Calibration Preview

Before full final-caption rendering, produce a representative preview from
final or near-final frames: clean, busy, dark, bright, B-roll, Living Frame,
subject-occluded, hero, ordinary phrase, and reduced-motion examples as
applicable.

The preview demonstrates exact fonts, measured breaks/sizes, typography roles,
colors, emphasis, stroke/shadow/backplate, placement, depth, masks,
entry/internal/exit motion, a representative sound example, and reduced-motion
behavior. It uses the same approved font assets, color plan, renderer versions,
and scene contracts as final output. Review uses the existing approval/revision
system; users do not approve every ordinary phrase individually.

## Export

FFmpeg packaging consumes approved renders and accessible tracks, preserves frame rate/timebase/audio sync, embeds or sidecars languages according to delivery policy, and records codec/container/color metadata. Final QA checks duration, frame count, streams, caption presence, language labels, encoding, sync, and artifact hashes before delivery.

Creative-render failure may degrade to libass only when the Caption Approval Envelope allows it. A structural creative failure that changes the promised edit requires review or a revised plan.
