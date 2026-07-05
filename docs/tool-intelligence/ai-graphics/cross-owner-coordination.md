# AI Graphics Cross-Owner Coordination

Decision: `ai_graphics_cross_owner_coordination_verified_without_duplicate_owner_claims`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

This packet verifies the 21 AI graphics tool-call records against the shared production tool registry and owner-exclusion evidence. It answers the coordination question: these AI graphics records are mapped, unique, and do not claim Track A render/export tools or Track B media owner scope.

## Result

- Canonical AI graphics tools covered: 21.
- Tool-call readiness records covered: 21.
- Production tool mappings present: 21.
- Unique AI graphics production tool IDs: 21.
- Production registry profiles present: 56.
- Production registry duplicate tool IDs: 0.
- Missing AI graphics production profiles: 0.
- Duplicate canonical AI graphics tool IDs: 0.
- Duplicate AI graphics production tool IDs: 0.
- Track A render/export overlaps: 0.
- Reserved non-AI graphics owner overlaps: 0.
- Product-facing capability IDs: 12.

## Owner Boundaries

AI graphics owns the 21 canonical planning/tool-call records only:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`
- `d3`
- `echarts`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`
- `lottie_web`
- `animejs`
- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

Track A render/export remains excluded through PR #544. This packet verifies AI graphics does not claim `remotion`, `revideo`, or `@remotion/renderer`.

Track B remains under `TRACK_B_MEDIA_OSS_STEWARD` through PR #542 and PR #543 evidence. Track B labels remain evidence-only context, not product-facing AI graphics capability categories.

## Production Mapping

Direct mappings remain direct for most tools. Intentional aliases remain:

- `lottie_web -> lottie`
- `pixi_js -> pixijs`
- `babylonjs -> babylon_js`

Every mapped production ID exists in `server/tool-registry/production-tool-profiles.ts`, and the production registry has no duplicate profile IDs.

## Execution Gates

- Agent can select tools for planning/study metadata: true.
- Agent can execute tools now: false.
- Tool Route execution approved now: false.
- Worker execution approved now: false.
- Tool execution approved now: false.
- Browser/WebGL/canvas runtime approved now: false.
- GPU runtime approved now: false.
- Runtime-ready now: false.
- Internal beta-ready now: false.
- External beta-ready now: false.
- Production-ready now: false.

## No-Scope

This packet does not run `npm install`, run `npm ci`, mutate `package-lock.json`, execute tools, execute workers, execute routes, call providers/models, run browser/WebGL/canvas runtime, run GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock internal beta, unlock external beta, unlock production, merge PRs, close PRs, or retarget PRs.
