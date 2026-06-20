# AI_TOOLS_CREATIVE_GRAPHICS Batch 2 Tool Selection

Decision: `approved_with_warnings_for_ai_graphics_batch_2`

## Selected Future Execution Set

| Package | Selected | Reason |
| --- | --- | --- |
| `satori` | yes | Lightweight metadata/spec-only card fixture planning candidate. |
| `@svgdotjs/svg.js` | yes | Lightweight vector manifest/spec-only fixture planning candidate. |
| `@viz-js/viz` | yes | DOT/Graphviz metadata or DOT-to-SVG proof planning candidate without route/runtime execution. |
| `lottie-web` | yes | Manifest/import-only proof candidate with Lottie player/browser behavior blocked. |

## Deferred Candidate

| Package | State | Reason |
| --- | --- | --- |
| `animejs` | deferred | Prior GD evidence exists, but Batch 2 stays small and non-motion-runtime-focused. It can be revisited later as metadata/import-only proof. |

## Batch 2 Boundaries

- Future proof may install only the selected packages and their npm-resolved dependency metadata.
- Future proof may run import smoke and synthetic spec/manifest fixture validation only after a later execution prompt.
- This packet does not run `npm install`, import selected packages, create Batch 2 fixtures, run browser/WebGL behavior, or execute tools.

No dependency install, package-lock mutation, Batch 2 import smoke, Batch 2 synthetic fixture proof, actual tool execution, route execution, worker execution, provider/model call, browser runtime, WebGL runtime, Remotion render/export, resvg rasterization, map rendering, media/audio processing, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
