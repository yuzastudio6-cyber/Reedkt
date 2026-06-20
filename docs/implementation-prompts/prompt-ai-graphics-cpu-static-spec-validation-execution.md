# Implementation Prompt: AI Graphics CPU Static Spec Validation Execution

Create the execution lane from `origin/codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-approval`.

Decision: `blocked_pending_cpu_static_dependency_install_from_lock`

Required branch: `codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-execution`

Required draft PR title: `[tools] AI graphics CPU static spec validation execution`

Created draft PR: pending creation.

Source PR #607: open/draft/MERGEABLE at `12cfc4f29e55db7a5b105ecfc3aba21480396435`.

Run id: `ai-graphics-cpu-static-spec-validation-local-static`

This lane was approved to validate only `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js`, but the execution must block because `d3`, `vega-lite`, `vega`, `satori`, `@svgdotjs/svg.js`, and `@viz-js/viz` are not declared in `package.json` or `package-lock.json` and dependency mutation is forbidden.

Validation record:

- `npm ci` was attempted with `DEVELOPER_DIR=/Library/Developer/CommandLineTools`; it entered the existing `duckdb` native fallback build for Node 26 and was interrupted after several minutes.
- `npm run --silent ai-graphics:cpu-static-spec-validation:execute` passed and produced ignored local evidence for the blocked decision.
- `npm run --silent ai-graphics:cpu-static-spec-validation:diagnostics` passed.
- Inherited CPU/static approval, runtime-boundary, canonical-promotion, owner-assignment, and central audit diagnostics passed.
- No-install readiness/build-family commands were blocked by missing local CLIs after the interrupted dependency install.
- `package-lock.json` stayed unchanged; `.local-artifacts/` stayed ignored and unstaged.

Do not install dependencies beyond the existing-lockfile `npm ci` attempt, mutate package-lock, run import smoke, run synthetic/static fixtures, execute tools/workers/routes/providers/models, run browser/WebGL/canvas/GPU/model/media/Remotion/resvg runtime, mutate Supabase/SQL/GCS, create signed URLs/public artifacts, unlock beta/production, merge PRs, close PRs, or retarget PRs.

Next prompt recommendation: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_DEPENDENCY_RECONCILIATION`.
