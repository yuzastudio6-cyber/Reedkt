# Track All deterministic geometry

## Current implemented route

Track All uses the existing server-owned operations:

1. `tool.ffprobe.inspect_approved_media.v1` for checksum-bound codec, frame,
   FPS, duration, dimensions, and rotation truth.
2. `tool.ffmpeg.execute_approved_media_recipe.v1` for an exact approved-range
   private proxy recipe. The compiler accepts bytes plus authority, not a
   caller path or command.
3. `tool.pyscenedetect.detect_scene_boundaries.v1` for fixed content-detector
   shot candidates.
4. `tool.opencv.analyze_approved_visual_artifacts.v1` with either
   `track_all_camera_motion_v1` or `track_all_planar_homography_v1`.

The OpenCV profiles run in the repository's existing pinned, networkless,
read-only, non-root structured Python image. Inputs contain server-injected
source bytes and exact bounded settings. Caller commands, code, environment,
paths, URLs, derived pixels, and arbitrary profiles remain rejected.

## Camera geometry

The camera profile decodes only the authorized range, downsizes analysis
frames to a bounded maximum dimension without changing source authority,
detects Shi–Tomasi features, tracks them with pyramidal Lucas–Kanade optical
flow, fits a RANSAC partial-affine transform, accumulates stabilized geometry,
and classifies static, pan, tilt, zoom, roll, or handheld motion. It emits
feature count, reprojection error, confidence, discontinuity, and shot-reset
evidence per sampled frame.

The resulting `camera_motion_graph_v1` is content-addressed and rejects
missing, duplicated, reordered, or out-of-range frames.

## Planar geometry

The planar profile requires exactly four normalized, approved target corners
and a non-zero initialization frame when selected by planning. It tracks
features inside the evolving polygon, calculates RANSAC homographies forward
and backward from the initialization frame, and emits four-corner geometry,
homography, reprojection error, visibility, occlusion, surface stability, and
confidence. Supported semantic surface classes live in
`planar_track_graph_v1`; OpenCV owns the deterministic geometry while SAM may
later provide only an optional region mask.

No failure silently becomes a model fallback. Low feature confidence and high
reprojection error remain explicit QA/repair evidence.

## Actual internal evidence

`npm run test:track-all-deterministic-geometry` creates one private synthetic
MP4 with the installed FFmpeg, validates it with FFprobe, executes real
PySceneDetect and both real OpenCV profiles inside the confined image, projects
strict camera and planar artifacts, checks a non-zero initialization frame,
and proves caller executable/URL rejection. The fixture publishes no media or
derived pixels and performs no provider, model, GPU, paid, or production
action.

This fixture is internal deterministic-route evidence. Final qualification is
issued only by the later aggregate receipt command. It is not SAM evidence and
does not establish production storage, deployed workers, or production
qualification.
