# Creative Graphics Generated/Local Track A Handoff Candidates

Status: `generated_local_fixture_candidate_prepared`

Track A handoff candidates are private manifest shapes only. GD-3 does not grant Track A final render/export ownership and does not run final composition.

| Output class | Artifact type | Private manifest ref | Dimensions | Timing | Alpha support | Safe zone | Local artifact | Private GCS | Checksum | Approved snapshot | QA evidence | Track A validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Static vector | `svg_asset` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | not temporal | optional | text safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| Static raster | `png_asset` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | not temporal | optional | text safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| Transparent overlay | `transparent_png_asset` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | optional | required | caption safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| Chart/dataviz | `chart_svg_or_png` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | not temporal | optional | chart label safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| Diagram | `diagram_svg_or_png` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | not temporal | optional | diagram label safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| Motion overlay | `lottie_or_motion_manifest` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | `fps: 30`, `durationFrames: <DURATION_FRAMES_PLACEHOLDER>` | required when overlay | caption safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| Remotion preview | `remotion_preview_manifest` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | `fps: 30`, `durationFrames: <DURATION_FRAMES_PLACEHOLDER>` | planned | caption safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |
| 3D/canvas scene | `scene_or_canvas_manifest` | `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` | `1920x1080` | temporal when planned | optional | motion safe | `<LOCAL_ARTIFACT_PATH_PLACEHOLDER>` | `<PRIVATE_GCS_PATH_PLACEHOLDER>` | `<CHECKSUM_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | `<QA_EVIDENCE_PLACEHOLDER>` | required |

Blocked uses for every candidate: raw prompt worker execution, signed URL source-of-truth, public artifact, final delivery without Track A validation, provider fallback without approval, and production/beta unlock.
