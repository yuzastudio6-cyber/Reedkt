# AI Graphics Job Payload Worker Intake Validation QA

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings`

Every accepted AI graphics tool is reviewed as `accepted_with_warnings` for schema validation QA only. Each row remains metadata/static evidence and does not approve worker execution.

| Tool | Proof batch/status | Worker handoff QA | Shape QA | Schema approval | Execution | QA | Required placeholders | Runtime boundary | Warning | Blocker | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `d3` | Batch 1 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no route/tool/worker runtime | static metadata only | none | `accepted_with_warnings` |
| `echarts` | Batch 1 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no chart/browser runtime | static metadata only | none | `accepted_with_warnings` |
| `vega-lite` | Batch 1 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no render runtime | static metadata only | none | `accepted_with_warnings` |
| `vega` | Batch 1 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no render runtime | static metadata only | none | `accepted_with_warnings` |
| `satori` | Batch 2 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no rasterization | static metadata only | none | `accepted_with_warnings` |
| `@svgdotjs/svg.js` | Batch 2 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no DOM/browser runtime | static metadata only | none | `accepted_with_warnings` |
| `@viz-js/viz` | Batch 2 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no public artifact output | static metadata only | none | `accepted_with_warnings` |
| `lottie-web` | Batch 2 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no player/browser runtime | static metadata only | none | `accepted_with_warnings` |
| `animejs` | Batch 3 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no motion runtime | static metadata only | none | `accepted_with_warnings` |
| `three` | Batch 3 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no WebGL/canvas runtime | static metadata only | none | `accepted_with_warnings` |
| `pixi.js` | Batch 3 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no renderer/canvas runtime | static metadata only | none | `accepted_with_warnings` |
| `konva` | Batch 3 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no browser canvas runtime | static metadata only | none | `accepted_with_warnings` |
| `babylonjs` | Batch 3 `passed_with_warnings` | accepted | accepted | approved | passed | accepted | plan snapshot, scoped manifest, private artifact, checksum, owner, capability, tool, claim/lease, queue | no engine/WebGL runtime | static metadata only | none | `accepted_with_warnings` |

workerIntakeValidationAccepted: `true`
