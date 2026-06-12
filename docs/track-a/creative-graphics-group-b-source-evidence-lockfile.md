# Creative Graphics Group B Source Evidence Lockfile

Prompt: `TRACKA-GD-GROUPB-HANDOFF-2`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`

This lockfile records the committed evidence sources that a future Handoff-3 prompt may inspect before any controlled private preview execution is considered.

## Locked Evidence

| Tool ID | Source evidence doc | Artifact manifest evidence ref | QA evidence ref | Timing, fps, duration | Dimensions/aspect ratio | Checksum/provenance placeholder | Approved plan snapshot placeholder | Missing metadata | Allowed future private preview role | Blocked use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `anime_js_motion` | `docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md` | 30 fps, 90 frames, 3000 ms synthetic timing evidence | `<GROUP_B_DIMENSIONS_ASPECT_RATIO_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | Final layout binding, safe-zone fit, approved-plan timing binding | Timing source for future local/private preview planning | No Anime.js execution; no worker/provider/model call. |
| `lottie_web_overlays` | `docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md` | 30 fps, 90-frame placeholder timing | `<GROUP_B_DIMENSIONS_ASPECT_RATIO_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | Lottie schema validation, alpha behavior, bounds, player compatibility | Manifest-only overlay placeholder | No browser/player rendering; no public artifact. |
| `remotion_graphics` | `docs/ai-tools/creative-graphics-gd10-group-b-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd10-group-b-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd10-group-b-qa-evidence.md` | 30 fps, 90-frame placeholder timing | `<GROUP_B_DIMENSIONS_ASPECT_RATIO_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | Remotion manifest completeness, composition bounds, final render/export review | Manifest-only composition placeholder | No Remotion render/export; no final render/export. |

## Source-Of-Truth Policy

Future source of truth remains `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`. Signed URLs are not source of truth.

No real GCS path, signed URL, public URL, raw Supabase value, Secret Manager value, or credential is recorded in this lockfile.

## Status

Packet status: `group_b_private_preview_execution_packet_ready_with_warnings`

Private preview status: `group_b_private_preview_not_executed`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
