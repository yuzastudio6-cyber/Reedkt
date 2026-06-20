# AI_TOOLS_CREATIVE_GRAPHICS Batch 3 Install Evidence

Decision: `ai_graphics_batch_3_install_import_manifest_proof_passed_with_warnings`

## Installed Direct Dependencies

| Package | Requested | Resolved |
| --- | --- | --- |
| `animejs` | `^4.4.1` | `4.4.1` |
| `three` | `^0.184.0` | `0.184.0` |
| `pixi.js` | `^8.19.0` | `8.19.0` |
| `konva` | `^10.3.0` | `10.3.0` |
| `babylonjs` | `^9.12.0` | `9.12.0` |

## Package-Lock Change Summary

`package-lock.json` added 16 package entries attributable to the approved Batch 3 set and their npm-resolved transitives:

`@pixi/colord`, `@types/earcut`, `@webgpu/types`, `@xmldom/xmldom`, `animejs`, `babylonjs`, `eventemitter3`, `gifuct-js`, `ismobilejs`, `js-binary-schema-parser`, `konva`, `parse-svg-path`, `pixi.js`, `pixi.js/node_modules/earcut`, `three`, and `tiny-lru`.

No direct dependency outside `animejs`, `three`, `pixi.js`, `konva`, and `babylonjs` was added.

## Install Result

- `npm install animejs three pixi.js konva babylonjs`: passed.
- `npm ci`: passed after install.
- Existing npm warnings: `uuid` deprecation warnings, 13 audit findings, and allow-scripts review notices including `babylonjs@9.12.0`.

No browser runtime, WebGL runtime, canvas runtime, actual tool execution, route execution, worker execution, provider/model calls, Remotion render/export, resvg rasterization, map rendering, media/audio processing, Supabase mutation, SQL, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
