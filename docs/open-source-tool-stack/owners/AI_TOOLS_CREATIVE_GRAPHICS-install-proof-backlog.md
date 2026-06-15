# AI_TOOLS_CREATIVE_GRAPHICS Install/Proof Backlog

Decision: `owner_tool_stack_audit_completed_ready_for_install_proof_approval`

This backlog does not approve package installation, import probes, tool execution, model execution, media processing, route execution, worker execution, or provider calls.

| Classification | Tools | Next action |
| --- | --- | --- |
| `needs_smoke_test` | `torch_torchvision`, `kornia` | Future approved import/package-resolution proof only; no model or GPU execution. |
| `needs_model_weight_review` | `transformers`, `sam2`, `birefnet`, `real_esrgan` | Define model-weight, download, cache, and execution blockers before import-only proof. |
| `needs_dependency_declaration` | `d3`, `echarts`, `vega_lite` | Select package route and plan deterministic spec/metadata fixtures. |
| `needs_synthetic_fixture` | `pixijs`, `three_js`, `babylon_js`, `lottie`, `konva` | Keep runtime-gated until canvas/browser/WebGL/player boundaries are separately approved. |
| `blocked_until_other_owner` | `rembg`, `transparent_background` | Alternate background-removal review only unless the owner reopens them. |

Package-lock must remain unchanged in this owner-lane audit.
