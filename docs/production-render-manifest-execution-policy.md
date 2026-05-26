# Production Render Manifest Execution Policy

Render execution consumes approved `TimelineManifest` and `RenderManifest` data or their private artifact IDs. Required fields include approved snapshot, tool execution plan, idempotency key, canvas, fps, duration, render engine, export settings, and private source/proxy/artifact refs.

The normalized execution manifest records clips, captions, audio, overlays, masks, color, enhancement, slow-motion refs, QA requirements, and render/export settings. It never stores signed URLs, raw prompts, secrets, or Revideo render instructions.

Hyperframe remains preview/editor bridge metadata. Remotion is the programmatic renderer, FFmpeg owns mux/export/transcode, and libass is caption burn-in support.
