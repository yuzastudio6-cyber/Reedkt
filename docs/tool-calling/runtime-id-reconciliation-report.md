# Tool-Calling Runtime ID Reconciliation Report

## Summary

The runtime ID reconciliation layer maps study-card and owner-evidence labels onto canonical `ProductionToolId` entries without creating a second registry. `server/tool-registry` remains the source of truth for selectable runtime IDs.

Track B external registry expansion promotes `mediainfo`, `exiftool`, `tesseract`, and `imagemagick` into first-class planning metadata. GraphicsMagick remains pending as a separate runtime identity.

## First-Class Runtime IDs Covered By Study Cards

All current first-class `ProductionToolId` entries have explicit study-card coverage. On the current base that includes 53 first-class IDs: the 49 IDs from first-class coverage expansion plus `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.

## Promoted Track B Aliases

- `mediainfo -> mediainfo`
  - Status: `alias_resolved_to_production_tool_id`.
  - Boundary: planning metadata only; no MediaInfo probe or media execution is enabled.
- `exiftool -> exiftool`
  - Status: `alias_resolved_to_production_tool_id`.
  - Boundary: planning metadata only; no ExifTool process is enabled.
- `tesseract -> tesseract`
  - Status: `alias_resolved_to_production_tool_id`.
  - Boundary: planning metadata only; OCR execution and language-pack use remain future work.
- `imagemagick_graphicsmagick -> imagemagick`
  - Status: `alias_resolved_to_production_tool_id`.
  - Boundary: ImageMagick is first-class for planning metadata; GraphicsMagick is not separately counted.

## Existing Resolved Aliases

- `sharp_libvips -> sharp`
- `polars_nodejs_polars -> polars`
- `remotion_render_validation -> remotion`
- `opentimelineio_timeline_validation -> opentimelineio`
- `libass_caption_burnin -> libass`
- `film_frame_interpolation -> film`
- `opencolorio -> opencolorio`
- `openimageio -> openimageio`

## Remaining Pending Runtime Identity

- `graphicsmagick -> pending_production_tool_registry_expansion`
  - Reason: GraphicsMagick is not separately proven or accepted as a first-class runtime ID in this milestone.
  - Diagnostic boundary: `graphicsMagickCounted: false`; not selectable as `selectedToolId`; no adapter contract.
  - Next step: require separate owner proof, registry profile, QA/fallback policy, capability card, and diagnostics before runtime selection.

## Runtime Selection Rule

Runtime selection must use operation capability, input/output compatibility, ranking policy, quality gates, fallback rules, resource profile, and future telemetry. It must not select bare `graphicsmagick` or any non-first-class runtime ID.
