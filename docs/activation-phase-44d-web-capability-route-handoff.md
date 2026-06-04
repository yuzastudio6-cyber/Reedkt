# Phase 44D Web Capability Route Handoff

The web profiler produces route planning hints only.

Allowed hint examples:

- `prefer_server_worker`
- `browser_preview_metadata_possible`
- `browser_image_metadata_possible`
- `webgpu_present_but_unapproved`
- `webcodecs_present_but_media_processing_blocked`
- `low_storage_avoid_browser_processing`
- `cross_origin_isolation_required_for_threads`
- `unknown_capability_fail_closed`

The profiler does not choose tools, execute routes, execute workers, or override blocked routes. Phase 44H cost estimator and Phase 44J hybrid E2E simulation remain required before live route execution. Demucs remains blocked, VLM remains excluded, and broad media, public artifacts, provider calls, beta, production, and Track A remain blocked.
