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

Logical order supports background/environmental type, behind-subject type, source/visual content, object-attached type, in-front creative type, stable accessible captions, and mandatory notices. Exact renderer layers are derived from the approved scene graph.

## Color management

- Design colors are interpreted in a declared working/output space.
- Contrast and legibility QA run on color-managed rendered frames.
- HDR/SDR and gamut transforms cannot silently change semantic colors or reduce readability.
- Calibration previews identify proxy limitations.
- Transparent/alpha handling, premultiplication, stroke/shadow blending, and local scrims are specified.
- Font rasterization and subpixel behavior are tested across preview/final paths.

## Export

FFmpeg packaging consumes approved renders and accessible tracks, preserves frame rate/timebase/audio sync, embeds or sidecars languages according to delivery policy, and records codec/container/color metadata. Final QA checks duration, frame count, streams, caption presence, language labels, encoding, sync, and artifact hashes before delivery.

Creative-render failure may degrade to libass only when the Caption Approval Envelope allows it. A structural creative failure that changes the promised edit requires review or a revised plan.
