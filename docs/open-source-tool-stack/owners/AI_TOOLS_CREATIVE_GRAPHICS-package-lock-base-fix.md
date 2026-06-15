# AI_TOOLS_CREATIVE_GRAPHICS Package-Lock Base Fix

Decision: `package_lock_base_fix_passed_ready_for_ai_graphics_batch_1_execution_approval`

This packet repairs the inherited `@emnapi/*` package-lock metadata mismatch that blocked `npm ci` on the AI_TOOLS_CREATIVE_GRAPHICS Batch 1 approval stack.

## Source Evidence

- PR #416: merged, `open_source_tool_stack_audit_completed_install_proof_backlog_ready`
- PR #417: draft/open/mergeable clean, `owner_tool_stack_audit_completed_ready_for_install_proof_approval`
- PR #420: draft/open/mergeable clean, `blocked_pending_package_lock_base_fix`
- PR #420 selected future Batch 1 tools: `d3`, `echarts`, `vega_lite`

## Repair

The original blocker was reproduced with `npm ci`. The accepted repair updates only `package-lock.json` metadata for existing optional/transitive `@emnapi/*` consumers:

- Adds top-level `@emnapi/core@1.11.1`
- Adds top-level `@emnapi/runtime@1.11.1`
- Updates top-level `@emnapi/wasi-threads` from `1.2.1` to `1.2.2`
- Adds nested Rolldown wasm entries for `@emnapi/core@1.10.0`, `@emnapi/runtime@1.10.0`, and `@emnapi/wasi-threads@1.2.1`

`package.json` was changed only to register the new diagnostics script. No dependency metadata was added or changed.

## Scope Boundary

Batch 1 execution remains blocked until a later approval/execution prompt. This packet does not install or prove `d3`, `echarts`, `vega`, or `vega_lite`, and it does not run imports, probes, fixtures, tools, routes, workers, providers, Supabase, GCS, render/export, beta, or production paths.
