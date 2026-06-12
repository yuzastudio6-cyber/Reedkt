# Creative Graphics Group B Private Preview Execution Manifest Template

Prompt: `TRACKA-GD-GROUPB-HANDOFF-2`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`

This is a future manifest template only. It does not create preview output, run Group B tools, run Remotion render/export, run Lottie browser/player behavior, upload files, create signed URLs, or create public artifacts.

## Template Fields

```json
{
  "previewRunId": "<GROUP_B_PRIVATE_PREVIEW_RUN_ID>",
  "executionApprovalState": "not_approved_in_handoff_2",
  "sourceEvidenceLockfile": "<SOURCE_EVIDENCE_LOCKFILE>",
  "approvedPlanSnapshotPlaceholder": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "localOutputDirPlaceholder": "<LOCAL_OUTPUT_DIR>",
  "privateArtifactManifests": [
    "<GROUP_B_PRIVATE_PREVIEW_MANIFEST>"
  ],
  "checksumPlaceholders": {
    "anime_js_motion": "<CHECKSUM_PROVENANCE_PLACEHOLDER>",
    "lottie_web_overlays": "<CHECKSUM_PROVENANCE_PLACEHOLDER>",
    "remotion_graphics": "<CHECKSUM_PROVENANCE_PLACEHOLDER>"
  },
  "compositionLayout": "future_track_a_private_preview_placeholder",
  "timing": "future_approved_plan_timing_placeholder",
  "fps": "<GROUP_B_FPS_PLACEHOLDER>",
  "durationFrames": "<GROUP_B_DURATION_FRAMES_PLACEHOLDER>",
  "overlayStack": [
    "anime_js_motion_timing_reference",
    "lottie_web_overlays_manifest_only_reference",
    "remotion_graphics_manifest_only_reference"
  ],
  "qaEvidenceRefs": [
    "docs/track-a/creative-graphics-group-b-private-preview-execution-qa-packet.md"
  ],
  "cleanupPlanRef": "docs/track-a/creative-graphics-group-b-private-preview-cleanup-rollback-packet.md",
  "blockedUses": [
    "group_b_tool_execution",
    "lottie_browser_player_rendering",
    "remotion_render_export",
    "final_render_export",
    "public_artifact",
    "signed_url_as_source_of_truth",
    "supabase_mutation",
    "worker_execution",
    "provider_model_calls",
    "internal_beta",
    "external_beta",
    "production"
  ],
  "sourceOfTruthPolicy": "Supabase row + private GCS path + manifest + checksum + approved plan snapshot",
  "noSignedUrlSourceOfTruth": true,
  "noPublicArtifact": true,
  "remotionFinalRenderBlocked": true,
  "lottieBrowserPlayerBlocked": true
}
```

## Fixture Roles

| Tool ID | Manifest role | Required future evidence |
| --- | --- | --- |
| `anime_js_motion` | Timing reference only. | Approved-plan timing comparison, checksum/provenance, safe-zone placement notes. |
| `lottie_web_overlays` | Manifest-only overlay reference. | Schema validation, alpha/bounds metadata, no browser/player execution evidence. |
| `remotion_graphics` | Manifest-only composition reference. | Manifest completeness, composition bounds, no render/export evidence. |

## Status

Packet status: `group_b_private_preview_execution_packet_ready_with_warnings`

Private preview status: `group_b_private_preview_not_executed`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
