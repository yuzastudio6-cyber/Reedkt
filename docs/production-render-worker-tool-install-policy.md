# Production Render Worker Tool Install Policy

The render worker image is the future home for approved render preparation and final render/export execution, but Milestone 10 only declares core install foundations. It does not render media.

## Core Stack

- Remotion remains the primary programmatic composition and render template engine.
- FFmpeg owns media mux/transcode/export support after later render milestones approve execution.
- libass supports subtitle burn-in where approved caption delivery requires rendered subtitles.
- Sharp/libvips supports image asset preparation.
- OpenTimelineIO supports structured timeline handoff.
- Hyperframe remains the interactive preview and timeline boundary, not a backend AI tool.

## Exclusions

Revideo remains evaluation-only and is not installed as core. GPU/model packages and model weights are not part of the render worker image. Render execution still requires approved snapshots, required assets, QA gates, and future render/export milestones.
