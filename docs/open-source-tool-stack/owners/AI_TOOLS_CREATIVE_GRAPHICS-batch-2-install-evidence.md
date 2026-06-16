# AI_TOOLS_CREATIVE_GRAPHICS Batch 2 Install Evidence

Decision: `ai_graphics_batch_2_install_import_synthetic_proof_passed_with_warnings`

## Direct Dependencies Added

| Package | Resolved version |
| --- | --- |
| `satori` | `0.26.0` |
| `@svgdotjs/svg.js` | `3.2.5` |
| `@viz-js/viz` | `3.28.0` |
| `lottie-web` | `5.13.0` |

## Package-Lock Summary

`package-lock.json` added 23 package entries and changed only the root lock metadata needed to reference the four approved direct dependencies.

Added lock entries:

- `node_modules/@shuding/opentype.js`
- `node_modules/@svgdotjs/svg.js`
- `node_modules/@viz-js/viz`
- `node_modules/camelize`
- `node_modules/css-background-parser`
- `node_modules/css-box-shadow`
- `node_modules/css-color-keywords`
- `node_modules/css-gradient-parser`
- `node_modules/css-to-react-native`
- `node_modules/emoji-regex-xs`
- `node_modules/fflate`
- `node_modules/hex-rgb`
- `node_modules/linebreak`
- `node_modules/linebreak/node_modules/base64-js`
- `node_modules/lottie-web`
- `node_modules/parse-css-color`
- `node_modules/postcss-value-parser`
- `node_modules/satori`
- `node_modules/string.prototype.codepointat`
- `node_modules/tiny-inflate`
- `node_modules/unicode-trie`
- `node_modules/unicode-trie/node_modules/pako`
- `node_modules/yoga-layout`

## npm Results

- `npm install satori @svgdotjs/svg.js @viz-js/viz lottie-web`: passed with existing `uuid` deprecation, audit, and allow-scripts warnings.
- `npm ci`: passed with existing `uuid` deprecation, 13 audit findings, and allow-scripts warnings for `esbuild`, `fsevents`, `protobufjs`, and `sharp`.

No blocked direct dependency was added: `animejs`, `@resvg/resvg-js`, Remotion packages, browser/WebGL/canvas packages, and provider SDKs remain absent.

No route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, browser runtime, WebGL runtime, Remotion render/export, resvg rasterization, media/audio processing, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
