# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Install/Proof Execution

Decision: `ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings`

## Source Evidence

- PR #416: merged central open-source tool stack audit, decision `open_source_tool_stack_audit_completed_install_proof_backlog_ready`.
- PR #417: draft/open owner-lane audit for AI_TOOLS_CREATIVE_GRAPHICS, source for the Batch 1 backlog.
- PR #420: draft/open approval packet selecting `d3`, `echarts`, and `vega_lite`, blocked until package-lock repair.
- PR #423: draft/open package-lock base fix, decision `package_lock_base_fix_passed_ready_for_ai_graphics_batch_1_execution_approval`, with `npm ci` passing.

## Approved Batch 1 Scope

Batch 1 installed and proved only lightweight deterministic JavaScript/spec packages:

| Package | Locked version | Scope |
| --- | --- | --- |
| `d3` | `7.9.0` | deterministic scale and path metadata proof only |
| `echarts` | `6.1.0` | package/API surface and synthetic option JSON only |
| `vega-lite` | `6.4.3` | synthetic Vega-Lite compile path only |
| `vega` | `6.2.0` | peer package required by `vega-lite` compile/parse proof |

## Execution Boundary

The proof is limited to dependency install, Node import smoke, and committed synthetic fixture validation. ECharts chart initialization, DOM/canvas/WebGL runtime, browser rendering, route/tool/worker/provider runtime, Supabase mutation, GCS upload, signed URL creation, public artifact creation, media/audio processing, render/export, beta, and production remain blocked.

## Result

The Batch 1 install/import/synthetic proof passed with warnings because this does not establish E2E production proof, tool-route runtime readiness, browser chart behavior, render/export readiness, or any live execution approval.

No browser/WebGL runtime, ECharts chart initialization, route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, media/audio processing, Remotion render/export, resvg rasterization, raw prompt execution, beta unlock, production unlock, actual tool execution, final render/export, or broad service-role handler was enabled.
