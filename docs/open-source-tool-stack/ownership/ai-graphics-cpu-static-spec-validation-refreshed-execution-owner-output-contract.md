# AI Graphics CPU Static Spec Validation Refreshed Execution Owner Output Contract

Decision: `ai_graphics_cpu_static_spec_validation_refreshed_execution_owner_review_passed_with_warnings`

Owner review accepts only sanitized metadata, spec-shape, and manifest-contract outputs recorded by PR #616 and QA-reviewed by PR #617.

Allowed output classes:

- deterministic chart metadata JSON for `d3`
- compile/validation metadata for `vega_lite`
- parse/validation metadata for `vega`
- manifest contract metadata for `satori`
- manifest contract metadata for `svgdotjs_svg_js`
- DOT metadata shape JSON for `viz_js`

Blocked output classes:

- browser/WebGL/canvas runtime output
- SVG/image/media/render/export artifacts
- public artifacts
- signed URLs
- Tool Route or Worker outputs
- provider/model outputs
- Supabase/SQL/GCS outputs

No public artifact, signed URL, generated media, browser capture, canvas output, WebGL output, Remotion render/export, or resvg rasterization was created.
