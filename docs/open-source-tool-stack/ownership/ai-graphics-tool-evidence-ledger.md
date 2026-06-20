# AI Graphics Tool Evidence Ledger

Decision: `ai_graphics_implementation_state_scan_completed_ready_for_draft_proof_promotion_review`

The ledger separates merged canonical evidence from draft pending evidence. PR #416 remains central canonical audit evidence. PR #425, PR #433, and PR #441 are now reconciled as canonical merged package/import/static-fixture proof for the 13 AI graphics package-proof tools. Canonical promotion QA accepts that package proof with warnings only, runtime boundary review classifies future lanes, and runtime boundary QA accepts planning/study metadata selection only. PR #532 and Worker metadata remain draft/static evidence only.

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
| d3 | canonical_merged_package_import_static_fixture_proof | PR #425 merged `a055ef045db2a6ce127a044bee6219d5933532c3` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| echarts | canonical_merged_package_import_static_fixture_proof | PR #425 merged `a055ef045db2a6ce127a044bee6219d5933532c3` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| vega_lite | canonical_merged_package_import_static_fixture_proof | PR #425 merged `a055ef045db2a6ce127a044bee6219d5933532c3` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| vega | canonical_merged_package_import_static_fixture_proof | PR #425 merged `a055ef045db2a6ce127a044bee6219d5933532c3` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| satori | canonical_merged_package_import_static_fixture_proof | PR #433 merged `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| svgdotjs_svg_js | canonical_merged_package_import_static_fixture_proof | PR #433 merged `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| viz_js | canonical_merged_package_import_static_fixture_proof | PR #433 merged `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| lottie_web | canonical_merged_package_import_static_fixture_proof | PR #433 merged `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| animejs | canonical_merged_package_import_static_fixture_proof | PR #441 merged `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| three_js | canonical_merged_package_import_static_fixture_proof | PR #441 merged `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| pixi_js | canonical_merged_package_import_static_fixture_proof | PR #441 merged `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| konva | canonical_merged_package_import_static_fixture_proof | PR #441 merged `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |
| babylonjs | canonical_merged_package_import_static_fixture_proof | PR #441 merged `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | package/import/static-fixture proof canonicalized | draft Worker metadata/static evidence through PR #532; no live worker execution |

Runtime-boundary QA status: `ai_graphics_draft_package_proof_runtime_boundary_qa_passed_with_warnings`; agent planning/study metadata accepted only, agent execution rejected now.

Runtime-ready tools: `0`. Internal-beta-ready tools: `0`. E2E-proven tools: `0`.
