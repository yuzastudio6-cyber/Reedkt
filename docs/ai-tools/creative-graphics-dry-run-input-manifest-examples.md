# Creative Graphics Dry-Run Input Manifest Examples

Status: `dry_run_fixture_spec_created`

All examples are synthetic and safe. Do not use real user data, real media URLs, signed URLs, public URLs, provider secrets, service-role keys, Secret Manager values, or private media references.

## Title Card Input

```json
{
  "inputType": "title_card",
  "structuredAgentFindings": "<STRUCTURED_AGENT_FINDINGS_PLACEHOLDER>",
  "editIntent": "introduce synthetic product milestone",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "copy": {
    "headline": "Synthetic Launch Metric",
    "subhead": "Placeholder context for dry-run layout only"
  },
  "frame": {
    "aspectRatio": "16:9",
    "dimensions": { "width": 1920, "height": 1080 }
  },
  "styleManifest": "<STYLE_MANIFEST_PLACEHOLDER>"
}
```

## Lower Third Input

```json
{
  "inputType": "lower_third",
  "editIntent": "label synthetic speaker role",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "text": {
    "primary": "Alex Example",
    "secondary": "Synthetic product lead"
  },
  "timingContext": {
    "startFrame": 120,
    "durationFrames": 180,
    "fps": 30
  }
}
```

## Chart Data Input

```json
{
  "inputType": "chart_data",
  "chartType": "bar",
  "editIntent": "show synthetic comparison",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "dataset": [
    { "label": "Plan A", "value": 42 },
    { "label": "Plan B", "value": 57 }
  ],
  "dataSource": "synthetic_fixture_only"
}
```

## Diagram Graph Input

```json
{
  "inputType": "diagram_graph",
  "editIntent": "explain synthetic workflow",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "nodes": ["request", "plan", "approval", "worker"],
  "edges": [["request", "plan"], ["plan", "approval"], ["approval", "worker"]]
}
```

## Social Card Input

```json
{
  "inputType": "social_card",
  "editIntent": "static synthetic share card",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "headline": "Synthetic Milestone Ready",
  "badge": "Fixture Only",
  "dimensions": { "width": 1200, "height": 630 }
}
```

## Lottie Overlay Intent

```json
{
  "inputType": "lottie_overlay_intent",
  "editIntent": "animated synthetic attention cue",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "timingContext": { "startFrame": 60, "durationFrames": 90, "fps": 30 },
  "alphaRequired": true,
  "safeZone": "caption_safe"
}
```

## 3D Scene Intent

```json
{
  "inputType": "three_scene_intent",
  "editIntent": "synthetic depth card with placeholder geometry",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "sceneObjects": ["placeholder_panel", "placeholder_axis", "placeholder_marker"],
  "cameraIntent": "slow orbit planning only"
}
```

## Canvas Effect Intent

```json
{
  "inputType": "canvas_effect_intent",
  "editIntent": "synthetic particle accent behind text",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "effectType": "placeholder_particle_field",
  "timingContext": { "durationFrames": 120, "fps": 30 }
}
```

## SVG Vector Intent

```json
{
  "inputType": "svg_vector_intent",
  "editIntent": "synthetic icon and label system",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "shapes": ["rounded_panel", "arrow", "label_anchor"],
  "text": "Fixture Label"
}
```

## Rasterization Intent

```json
{
  "inputType": "rasterization_intent",
  "editIntent": "convert synthetic SVG plan to private PNG artifact",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "sourceVectorManifest": "<PRIVATE_VECTOR_MANIFEST_PLACEHOLDER>",
  "targetFormat": "png"
}
```
