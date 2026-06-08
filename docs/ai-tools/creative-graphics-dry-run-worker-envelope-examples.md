# Creative Graphics Dry-Run Worker Envelope Examples

Status: `dry_run_fixture_spec_created`

These envelopes are static examples only. Worker execution remains blocked until a future runtime unlock stage.

## Generic Scoped Tool-Call Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "<EDIT_INTENT_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "<TOOL_ID_PLACEHOLDER>",
  "fixtureId": "<FIXTURE_ID_PLACEHOLDER>",
  "privateArtifactScope": {
    "privateArtifactManifest": "<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>",
    "gcsPrivatePath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
    "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
    "checksum": "<CHECKSUM_PLACEHOLDER>"
  },
  "runtimeExecution": "blocked_until_future_unlock_gate",
  "rawPromptExecution": "blocked",
  "workerExecutionBlockedNote": "GD-2 defines fixture envelopes only and does not run workers."
}
```

## Chart Fixture Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "synthetic chart explanation",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "d3_dataviz",
  "fixtureId": "gd2_d3_dataviz_dry_run",
  "inputManifest": "<SYNTHETIC_CHART_INPUT_PLACEHOLDER>",
  "privateArtifactScope": "<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>",
  "workerExecutionBlockedNote": "No chart renderer is called in GD-2."
}
```

## Motion Fixture Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "synthetic timed overlay",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "lottie_web_overlays",
  "fixtureId": "gd2_lottie_web_overlays_dry_run",
  "timingContext": { "fps": 30, "durationFrames": 90 },
  "privateArtifactScope": "<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>",
  "workerExecutionBlockedNote": "No animation runtime is called in GD-2."
}
```

## Raster Fixture Envelope

```json
{
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "synthetic SVG rasterization",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "toolId": "resvg_js_svg_rasterization",
  "fixtureId": "gd2_resvg_js_svg_rasterization_dry_run",
  "privateArtifactScope": "<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>",
  "workerExecutionBlockedNote": "No rasterization runtime is called in GD-2."
}
```
