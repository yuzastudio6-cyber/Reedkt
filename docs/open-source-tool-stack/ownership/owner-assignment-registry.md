# Owner Assignment Registry

Decision: `ai_graphics_owner_assignment_trackb_conflict_sync_passed_with_warnings`

This registry adds one pending owner assignment for the AI graphics / Worker metadata coordination lane. It records assignment intent only and does not claim exclusive ownership while duplicate review is open.

| Field | Value |
| --- | --- |
| Owner display name | `Atlas — AI Graphics & Worker Metadata Owner` |
| Owner id | `atlas_ai_graphics_worker_owner` |
| Owner lane | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Coordination lanes | `TOOL_ROUTE_EXECUTION`, `WORKER_RUNTIME_JOBS`, `OPEN_SOURCE_TOOL_STACK_AUDIT` |
| Assignment status | `pending_duplicate_review` |
| Canonical source | PR #416 central open-source tool stack audit |
| Refreshed source | PR #534 and PR #536 open-source tool stack refresh and QA |
| Latest Worker evidence | PR #532 controlled no-op owner review |
| Runtime ready now | `false` |
| Internal beta ready now | `false` |
| External beta ready now | `false` |
| Production ready now | `false` |

## Registry Result

The central ownership registry is created in `docs/open-source-tool-stack/ownership/`. Existing cross-chat coordination files were present and are updated to point to this pending assignment. Existing lane/backlog mentions create duplicate-review risk, but no concrete conflicting named owner was found during implementation.

No Track A tools, Track B tools, Sound/Music tools, Map/Geospatial tools, or Provider Gateway tools are assigned to this owner.

## Track B Conflict Sync

Track B tools are explicitly not owned by Atlas. `TRACK_B_MEDIA_OSS_STEWARD` / Track B Media OSS Steward owns FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars / nodejs-polars, OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, MediaInfo, ExifTool, ImageMagick / GraphicsMagick, Tesseract, OpenColorIO, and OpenImageIO.

Atlas may reference Track B evidence, but cannot claim, install, prove, or execute Track B tools. PR #544 is Track A owner context only; Atlas AI graphics does not claim Track A render/export ownership.
