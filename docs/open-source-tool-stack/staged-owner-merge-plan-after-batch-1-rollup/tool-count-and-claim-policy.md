# tool Count And Claim Policy

Status: `accepted`
Accepted: `true`

## Warnings
- Do not claim 40+ tools are installed/proven end-to-end.

## Blockers
- none

## Details
```json
{
  "inventoryCandidateCount": 71,
  "batch1AcceptedTools": [
    "Sharp/libvips",
    "DuckDB",
    "Polars / nodejs-polars",
    "FFmpeg version-proven only for Track A container path at 5.1.9-0+deb12u1",
    "FFprobe version-proven only for Track A container path at 5.1.9-0+deb12u1"
  ],
  "batch1AcceptedValidationTargets": [
    "route/capability manifest validation",
    "fixture/report validation",
    "inventory/proof matrix validation"
  ],
  "aiGraphicsAcceptedWithWarningsCount": 13,
  "aiGraphicsAcceptedWithWarningsTools": [
    "d3",
    "echarts",
    "vega-lite",
    "vega",
    "satori",
    "@svgdotjs/svg.js",
    "@viz-js/viz",
    "lottie-web",
    "animejs",
    "three",
    "pixi.js",
    "konva",
    "babylonjs"
  ],
  "endToEndProductReadyTools": 0,
  "fortyPlusToolsInstalledProvenEndToEndClaimAllowed": false,
  "forbiddenClaim": "Do not claim 40+ tools are installed/proven end-to-end.",
  "conditionsBeforeEndToEndToolCounting": [
    "installed or source-integrated",
    "runtime path proven",
    "owner scope approved",
    "fail-closed behavior proven",
    "artifact policy proven",
    "route/worker/provider boundaries proven when relevant",
    "Supabase/GCS/public/signed URL policy proven when relevant",
    "internal beta scope approved when relevant"
  ]
}
```
