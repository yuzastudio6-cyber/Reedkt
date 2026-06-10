# Creative Graphics Private Preview Manifest Template

Prompt: `TRACKA-GD-HANDOFF-1`

Status: `private_preview_composition_plan_ready_with_warnings`

Production capability enabled: `none; Track A private preview composition plan only`

## Template Purpose

This template defines placeholder-only fields for a future controlled private preview prompt. It is not an executable manifest and does not create files, uploads, signed URLs, Supabase rows, or public artifacts.

## Placeholder Manifest

```json
{
  "compositionPlanId": "tracka_gd_handoff_1_private_preview_plan",
  "status": "private_preview_composition_plan_ready_with_warnings",
  "privatePreviewStatus": "private_preview_not_executed",
  "approvedPlanSnapshotRef": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "confirmedOutputFrameRef": "<CONFIRMED_OUTPUT_FRAME_PLACEHOLDER>",
  "privateArtifactManifestRef": "<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>",
  "privateGcsPathRef": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRowRef": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksumRef": "<CHECKSUM_PROVENANCE_PLACEHOLDER>",
  "sourceOfTruthPolicy": "supabase_row_private_gcs_manifest_checksum_approved_snapshot",
  "signedUrlSourceOfTruth": false,
  "publicArtifactApproved": false,
  "fixtures": [
    {
      "toolId": "satori_social_cards",
      "sourceFixtureRef": "<SATORI_SOCIAL_CARDS_LOCAL_PRIVATE_FIXTURE_REF>",
      "plannedLayerRole": "social_card_layer",
      "plannedTimingRef": "<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>"
    },
    {
      "toolId": "d3_dataviz",
      "sourceFixtureRef": "<D3_DATAVIZ_LOCAL_PRIVATE_FIXTURE_REF>",
      "plannedLayerRole": "data_graphic_layer",
      "plannedTimingRef": "<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>"
    },
    {
      "toolId": "echarts_dataviz",
      "sourceFixtureRef": "<ECHARTS_DATAVIZ_LOCAL_PRIVATE_FIXTURE_REF>",
      "plannedLayerRole": "chart_layer",
      "plannedTimingRef": "<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>"
    },
    {
      "toolId": "vega_lite_dataviz",
      "sourceFixtureRef": "<VEGA_LITE_DATAVIZ_LOCAL_PRIVATE_FIXTURE_REF>",
      "plannedLayerRole": "data_graphic_layer",
      "plannedTimingRef": "<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>"
    },
    {
      "toolId": "viz_graphviz_diagrams",
      "sourceFixtureRef": "<VIZ_GRAPHVIZ_DIAGRAMS_LOCAL_PRIVATE_FIXTURE_REF>",
      "plannedLayerRole": "diagram_layer",
      "plannedTimingRef": "<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>"
    }
  ]
}
```

## Forbidden Manifest Values

- raw Supabase project refs
- database URLs
- Secret Manager payloads
- provider keys
- signed URLs
- public URLs
- real GCS object paths
- real production artifact identifiers
- raw prompt worker instructions

## Boundary Status

Private preview generation: `private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

