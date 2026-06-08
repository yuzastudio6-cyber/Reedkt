# Creative Graphics Local Artifact Manifest Candidates

Status: `generated_local_fixture_candidate_prepared`

All manifest candidates are placeholders only. No actual local files, private objects, public URLs, signed URLs, checksums, uploads, or Supabase rows are created in GD-3.

## Common Fields

```json
{
  "localArtifactPath": "<LOCAL_ARTIFACT_PATH_PLACEHOLDER>",
  "privateGcsPath": "<PRIVATE_GCS_PATH_PLACEHOLDER>",
  "supabaseArtifactRecord": "<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>",
  "checksum": "<CHECKSUM_PLACEHOLDER>",
  "approvedPlanSnapshot": "<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>",
  "publicUrl": null,
  "signedUrl": null
}
```

## Candidate Artifact Types

| Candidate | Expected artifact type | Required notes |
| --- | --- | --- |
| SVG asset | `svg_asset` | Vector source stays private; Track A validation required before composition. |
| PNG asset | `png_asset` | Static raster placeholder; no public delivery claim. |
| Transparent PNG asset | `transparent_png_asset` | Alpha/transparency evidence placeholder required. |
| Chart SVG | `chart_svg` | Synthetic data correctness evidence required. |
| Chart PNG | `chart_png` | Synthetic data correctness and label readability evidence required. |
| Diagram SVG | `diagram_svg` | Graph correctness evidence required. |
| Diagram PNG | `diagram_png` | Graph correctness and rasterization provenance placeholders required. |
| Social card SVG | `social_card_svg` | Public posting remains blocked. |
| Social card PNG | `social_card_png` | Public posting remains blocked. |
| Lottie animation | `lottie_animation_manifest` | Timing and alpha evidence placeholders required. |
| Remotion preview manifest | `remotion_preview_manifest` | Render/export remains blocked. |
| Canvas effect manifest | `canvas_effect_manifest` | Canvas runtime remains blocked. |
| Three.js scene manifest | `three_scene_manifest` | Browser/WebGL runtime remains blocked. |
| Rasterized SVG asset | `rasterized_svg_asset` | Source vector and raster output placeholders required. |

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
