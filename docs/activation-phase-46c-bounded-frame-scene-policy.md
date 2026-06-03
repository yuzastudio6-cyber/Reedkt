# Phase 46C Bounded Frame/Scene Policy

Phase 46C allows only bounded metadata, scene, and frame checks.

- PyAV may probe container and stream metadata and decode only enough frames to
  cover the approved `6.9s` to `8.9s` window.
- OpenCV may compute metrics only for the six approved offsets.
- PySceneDetect may run only on a temporary bounded clip created from the
  approved window, not the full source video.
- Sharp/libvips may create private thumbnail metadata from sampled controlled
  frames only.

Full-video frame extraction, arbitrary offsets, committed real-media-derived
images, public previews, final exports, and broad media processing remain
blocked.
