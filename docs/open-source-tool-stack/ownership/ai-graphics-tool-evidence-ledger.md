# AI Graphics Tool Evidence Ledger

Decision: `ai_graphics_implementation_state_scan_completed_ready_for_draft_proof_promotion_review`

The ledger separates merged canonical evidence from draft pending evidence. PR #416 remains canonical. PR #425, PR #433, PR #441, and PR #532 remain draft/pending evidence only.

| toolId | canonicalStatusFromPr416 | draftEvidencePrs | package evidence | worker evidence |
| --- | --- | --- | --- | --- |
| torch_torchvision | package_declared_smoke_only_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| transformers | package_declared_docs_only_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| sam2 | package_declared_smoke_only_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| birefnet | package_declared_smoke_only_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| real_esrgan | package_declared_smoke_only_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| kornia | package_declared_docs_only_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| rembg | docs_only_not_proven_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| transparent_background | docs_only_not_proven_from_pr416 | none | not_declared_on_owner_assignment_source_branch | future worker review only |
| d3 | canonical_ai_graphics_tool_from_pr416 | PR #425 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| echarts | canonical_ai_graphics_tool_from_pr416 | PR #425 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| vega_lite | canonical_ai_graphics_tool_from_pr416 | PR #425 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| vega | draft_pending_only_not_canonical_pr416_named | PR #425 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| satori | draft_pending_only_not_canonical_pr416_named | PR #433 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| svgdotjs_svg_js | draft_pending_only_not_canonical_pr416_named | PR #433 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| viz_js | draft_pending_only_not_canonical_pr416_named | PR #433 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| lottie_web | canonical_ai_graphics_tool_from_pr416 | PR #433 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| animejs | draft_pending_only_not_canonical_pr416_named | PR #441 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| three_js | canonical_ai_graphics_tool_from_pr416 | PR #441 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| pixi_js | canonical_ai_graphics_tool_from_pr416 | PR #441 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| konva | canonical_ai_graphics_tool_from_pr416 | PR #441 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |
| babylonjs | canonical_ai_graphics_tool_from_pr416 | PR #441 | not_declared_on_owner_assignment_source_branch | draft Worker metadata/static evidence through PR #532; no live worker execution |

Runtime-ready tools: `0`. Internal-beta-ready tools: `0`. E2E-proven tools: `0`.
