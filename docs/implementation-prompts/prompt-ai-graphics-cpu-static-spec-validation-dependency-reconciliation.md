# Implementation Prompt: AI Graphics CPU Static Spec Validation Dependency Reconciliation

Create the dependency-reconciliation lane from `origin/codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-execution`.

Decision: `ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution`

Required branch: `codex/rp-ai-graphics-cpu-static-spec-validation-dependency-reconciliation`

Required draft PR title: `[tools] AI graphics CPU static spec validation dependency reconciliation`

Created draft PR: pending creation.

This lane is docs/diagnostics-only. It reconciles PR #612's blocked dependency gate against the merged package-proof dependency lineage and concludes the next CPU/static execution can proceed from a dependency-bearing fresh base without new dependency mutation approval.

Recommended fresh base: `origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet`.

Alternate full package-proof base: `origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet`.

Validation record:

- `git diff --check`: passed.
- `npm run --silent ai-graphics:cpu-static-spec-validation-dependency-reconciliation:diagnostics`: passed.
- Inherited CPU/static execution, CPU/static approval, runtime-boundary owner-QA, owner-assignment, and central audit diagnostics: passed.
- Changed-file secret scan and generated artifact/path scan: passed with only expected textual guard-field false positives.
- `package-lock.json`: unchanged.
- `.local-artifacts/`: not staged.

Do not run `npm install`, `npm ci`, CPU/static validation, import smoke, synthetic fixtures, tools, workers, routes, providers/models, browser/WebGL/canvas runtime, GPU runtime, model downloads, media/Remotion/resvg runtime, Supabase/SQL/GCS, signed URLs, public artifacts, beta/production commands, PR merges, PR closes, or PR retargets.

Next prompt recommendation: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_REFRESHED_EXECUTION`.
