# AI Graphics CPU Static Spec Validation Execution Next Lane

Decision: `blocked_pending_cpu_static_dependency_install_from_lock`

Recommended next prompt: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_DEPENDENCY_RECONCILIATION`

Reason: the execution cannot validate the approved six CPU/static tools until the package/lock source branch intentionally reconciles `d3`, `vega-lite`, `vega`, `satori`, `@svgdotjs/svg.js`, and `@viz-js/viz` under a lane that is allowed to review or mutate dependencies.

Do not proceed to CPU/static execution QA while this blocked decision remains active.
