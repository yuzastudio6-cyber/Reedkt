# Creative Graphics Dry-Run Output Manifest Examples

Status: `dry_run_fixture_spec_created`

These examples are placeholder manifests only. They are not generated artifacts, public files, signed URLs, or render outputs.

## SVG Asset

```json
{
  "artifactType": "svg_asset",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "publicUrl": null,
  "signedUrl": null
}
```

## PNG Asset

```json
{
  "artifactType": "png_asset",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "alpha": "planned_or_not_applicable"
}
```

## Transparent Overlay

```json
{
  "artifactType": "transparent_overlay",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "alpha": "required",
  "trackAValidationRequired": true
}
```

## Chart SVG And PNG

```json
{
  "artifactType": "chart_svg_or_png",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "dataSource": "synthetic_fixture_only",
  "dataCorrectnessQa": "<QA_STATUS_PLACEHOLDER>"
}
```

## Diagram SVG

```json
{
  "artifactType": "diagram_svg",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "graphCorrectnessQa": "<QA_STATUS_PLACEHOLDER>"
}
```

## Social Card PNG

```json
{
  "artifactType": "social_card_png",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "deliveryStatus": "blocked_until_policy"
}
```

## Lottie Animation

```json
{
  "artifactType": "lottie_animation_manifest",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "trackAValidationRequired": true
}
```

## Remotion Preview Manifest

```json
{
  "artifactType": "remotion_preview_manifest",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "renderExportStatus": "blocked"
}
```

## Canvas Effect Manifest

```json
{
  "artifactType": "canvas_effect_manifest",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "workerExecutionStatus": "blocked"
}
```

## Three Scene Manifest

```json
{
  "artifactType": "three_scene_manifest",
  "privatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "runtimeExecutionStatus": "blocked"
}
```
