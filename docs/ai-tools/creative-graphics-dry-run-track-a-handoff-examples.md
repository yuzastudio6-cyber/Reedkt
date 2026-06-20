# Creative Graphics Dry-Run Track A Handoff Examples

Status: `dry_run_fixture_spec_created`

Track A receives private manifest fields only. GD-2 does not transfer final composition, render/export, delivery, or public artifact ownership.

| Output Type | Artifact Type | Dimensions | Timing | Alpha | Safe Zone | Private Path | Checksum | Approved Snapshot | QA Status | Track A Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Remotion preview | `remotion_preview_manifest` | `1920x1080` | `fps: 30`, `durationFrames: 180` | planned | caption safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| D3 chart | `chart_svg` | `1920x1080` | not temporal | optional | chart label safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| Three scene | `three_scene_manifest` | `1920x1080` | `fps: 30`, `durationFrames: 120` | not required | motion safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| PixiJS overlay | `canvas_effect_manifest` | `1920x1080` | `fps: 30`, `durationFrames: 120` | required when overlay | caption safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| Anime.js motion | `motion_timeline_manifest` | `1920x1080` | `fps: 30`, `durationFrames: 90` | optional | text safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| Lottie overlay | `lottie_animation_manifest` | `1920x1080` | `fps: 30`, `durationFrames: 90` | required | caption safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| SVG vector | `svg_asset` | `1920x1080` | not temporal | optional | text safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| ECharts chart | `chart_png` | `1920x1080` | not temporal | not required | chart label safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| Vega-Lite chart | `chart_svg` | `1920x1080` | not temporal | optional | chart label safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| Viz diagram | `diagram_svg` | `1920x1080` | not temporal | optional | diagram label safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| Satori card | `social_card_png` | `1200x630` | not temporal | not required | card safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |
| resvg raster | `rasterized_png_asset` | `1920x1080` | not temporal | optional | source safe | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_STATUS_PLACEHOLDER>` | required |

Blocked uses for every handoff: raw prompt worker execution, signed URL source-of-truth, public artifact, final delivery without Track A validation, provider fallback without approval, and production/beta unlock.
