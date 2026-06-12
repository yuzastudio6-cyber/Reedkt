# Creative Graphics Group B Private Preview Manifest Template

Prompt: `TRACKA-GD-GROUPB-HANDOFF-1`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_2`

This is a placeholder manifest template for a future `TRACKA-GD-GROUPB-HANDOFF-2` execution packet. It is not a preview output, render, export, upload, signed URL, public artifact, Supabase mutation, or delivery artifact.

```json
{
  "previewId": "<GROUP_B_PRIVATE_PREVIEW_ID_PLACEHOLDER>",
  "approvedPlanSnapshotPlaceholder": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "decisionState": "ready_with_warnings_for_tracka_gd_groupb_handoff_2",
  "sourceFixtureEvidenceRefs": {
    "anime_js_motion": "<GD10_ANIME_TIMING_EVIDENCE_REF_PLACEHOLDER>",
    "lottie_web_overlays": "<GD10_LOTTIE_MANIFEST_EVIDENCE_REF_PLACEHOLDER>",
    "remotion_graphics": "<GD10_REMOTION_MANIFEST_EVIDENCE_REF_PLACEHOLDER>"
  },
  "artifactManifestRefs": {
    "gd10ArtifactManifest": "<GD10_ARTIFACT_MANIFEST_REF_PLACEHOLDER>",
    "futurePrivatePreviewManifest": "<GROUP_B_PRIVATE_PREVIEW_MANIFEST_REF_PLACEHOLDER>"
  },
  "localArtifactRefs": {
    "anime_js_motion": "<LOCAL_ARTIFACT_REF_PLACEHOLDER>",
    "lottie_web_overlays": "<LOCAL_ARTIFACT_REF_PLACEHOLDER>",
    "remotion_graphics": "<LOCAL_ARTIFACT_REF_PLACEHOLDER>"
  },
  "privateGcsPathPlaceholders": {
    "anime_js_motion": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
    "lottie_web_overlays": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
    "remotion_graphics": "<PRIVATE_GCS_PATH_PLACEHOLDER>"
  },
  "checksumPlaceholders": {
    "anime_js_motion": "<CHECKSUM_PLACEHOLDER>",
    "lottie_web_overlays": "<CHECKSUM_PLACEHOLDER>",
    "remotion_graphics": "<CHECKSUM_PLACEHOLDER>"
  },
  "dimensions": "<DIMENSIONS_PLACEHOLDER>",
  "safeZones": "<SAFE_ZONE_PLACEHOLDER>",
  "timing": "<TIMING_PLACEHOLDER>",
  "fps": "<FPS_PLACEHOLDER>",
  "durationFrames": "<DURATION_FRAMES_PLACEHOLDER>",
  "overlayStack": [
    "<ANIME_TIMING_REFERENCE_PLACEHOLDER>",
    "<LOTTIE_MANIFEST_PLACEHOLDER>",
    "<REMOTION_MANIFEST_PLACEHOLDER>"
  ],
  "qaEvidenceRefs": {
    "timing": "<QA_TIMING_EVIDENCE_REF_PLACEHOLDER>",
    "layout": "<QA_LAYOUT_EVIDENCE_REF_PLACEHOLDER>",
    "cleanup": "<QA_CLEANUP_EVIDENCE_REF_PLACEHOLDER>"
  },
  "blockedUses": [
    "remotion_final_render_export",
    "lottie_browser_player_rendering",
    "group_b_tool_execution",
    "public_artifact",
    "signed_url_as_source_of_truth",
    "supabase_mutation",
    "worker_execution",
    "provider_model_calls",
    "internal_beta_unlock",
    "external_beta_unlock",
    "production_unlock"
  ],
  "sourceOfTruthPolicy": "Supabase row + private GCS path + manifest + checksum + approved plan snapshot",
  "cleanupPolicy": "<LOCAL_PRIVATE_CLEANUP_POLICY_PLACEHOLDER>",
  "noSignedUrlSourceOfTruth": true,
  "trackAValidationRequired": true,
  "remotionFinalRenderBlocked": true,
  "lottieBrowserPlayerBlocked": true
}
```

No real GCS paths, signed URLs, public URLs, Supabase values, secrets, or Secret Manager payloads are present.

Capability: `none; Track A Group B creative graphics private preview composition plan only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
