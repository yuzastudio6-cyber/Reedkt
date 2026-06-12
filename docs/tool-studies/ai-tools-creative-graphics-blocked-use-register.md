# AI_TOOLS_CREATIVE_GRAPHICS Blocked-Use Register

All entries are blocked in TOOL-STUDY-0.

| Blocked Use | Reason | Future Owner |
| --- | --- | --- |
| final render/export | Track A and future render workers own final composition/export after explicit approval | `TRACK_A_RENDER_EXPORT` |
| direct worker execution | worker claims, leases, and jobs remain future runtime work | `WORKER_RUNTIME_JOBS` |
| direct provider/model calls | providers may only be future proposal specialists under separate approval | `PROVIDER_GATEWAY_MODELS` |
| direct tool execution | this phase is docs/diagnostics only | relevant tool owner |
| route execution | TOOL-ROUTE-1 is still future dry-run planning | `WORKER_RUNTIME_JOBS` / owner routes |
| graphics generation | no graphics assets are generated here | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Remotion rendering | no Remotion package is installed or run | `TRACK_A_RENDER_EXPORT` |
| D3 rendering | no chart renderer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| ECharts rendering | no chart renderer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Vega or Vega-Lite rendering | no declarative chart renderer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Three.js/WebGL rendering | no WebGL or 3D renderer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| PixiJS/canvas rendering | no canvas renderer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Lottie playback/rendering | no Lottie renderer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| SVG rasterization | no resvg or SVG rasterizer runs | `AI_TOOLS_CREATIVE_GRAPHICS` |
| unreviewed generated code execution | generated code must not run from provider or raw prompt output | `COMPLIANCE_SECURITY` |
| unapproved package install | package-lock remains unchanged and dependencies are not added | `COMPLIANCE_SECURITY` |
| Supabase mutation | no schema, RLS, migration, storage, product-row, or service-role change | `SUPABASE_RLS_STORAGE_DATABASE` |
| SQL execution | no SQL runs in this phase | `SUPABASE_RLS_STORAGE_DATABASE` |
| GCS upload/storage transfer | no private or public storage transfer happens | `OBSERVABILITY_AUDIT_COST` |
| public artifacts | public delivery policy remains blocked | `COMPLIANCE_SECURITY` |
| signed URLs as source-of-truth | temporary delivery URLs cannot define truth | `COMPLIANCE_SECURITY` |
| raw prompt execution | raw chat/provider prompts cannot become executable instructions | `PROVIDER_GATEWAY_MODELS` |
| production or external beta unlock | this owner study is not a launch gate | `COMPLIANCE_SECURITY` |

## Blocked Source-Of-Truth Inputs

- raw prompts;
- raw provider/model responses;
- raw generated code;
- arbitrary SVG/HTML/CSS/DOT/JS payloads;
- signed URLs;
- public artifacts;
- private Supabase rows;
- secrets;
- unreviewed package output;
- temporary screenshots, previews, render outputs, or rasterized files.
