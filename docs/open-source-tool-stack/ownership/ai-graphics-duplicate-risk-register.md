# AI Graphics Duplicate Risk Register

Decision: `ai_graphics_owner_assignment_trackb_conflict_sync_passed_with_warnings`

| Risk | Status | Handling |
| --- | --- | --- |
| Existing lane-level AI graphics ownership appears in `docs/open-source-tool-stack/open-source-tool-stack-owner-map.md` | `existing_lane_reference_found` | Treat as source context, not a conflicting named owner. |
| AI graphics / Worker metadata overlap appears in owner-lane reconciliation docs | `duplicate_review_required` | Keep `assignmentStatus: pending_duplicate_review` and `exclusiveOwnershipClaimed: false`. |
| Tool Route and Worker Runtime lanes include the 13 draft metadata tools | `coordination_required` | Atlas may coordinate metadata handoff only; Tool Route and Worker retain their execution boundaries. |
| Track A / Track B / Sound / Map / Provider Gateway ownership | `not_assigned` | Do not assign those tools to Atlas. |
| Track B central owner rule | `synced` | `TRACK_B_MEDIA_OSS_STEWARD` owns FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars / nodejs-polars, OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, MediaInfo, ExifTool, ImageMagick / GraphicsMagick, Tesseract, OpenColorIO, and OpenImageIO. |
| PR #544 Track A owner context | `reference_only` | Atlas AI graphics does not claim Track A visual/render/export ownership. |

Duplicate risk found: `true`

Concrete conflicting named owner found: `false`

Exclusive ownership claimed: `false`

Track B ownership claimed by Atlas: `false`

Track A ownership claimed by Atlas: `false`
