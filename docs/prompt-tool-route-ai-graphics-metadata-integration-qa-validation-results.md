# TOOL_ROUTE_AI_GRAPHICS_METADATA_INTEGRATION_QA_REVIEW Validation Results

Decision: `tool_route_ai_graphics_metadata_integration_qa_passed_with_warnings`

## Source Reads

- PR #456: open draft, mergeable clean, head `36efdcd678fc6bd69fe7569268af9bb4a81a6aa8`.
- PR #454: open draft, mergeable clean, head `03ad9b668e22f69c347cb0874d754453f44b9404`.
- PR #451: open draft, mergeable clean, head `f497302fc5f80bf891cc3d17336627ffcb0132b0`.
- PR #449, #445, #437, #428: open draft, mergeable clean, batch QA source evidence.
- PR #404 and PR #398: merged Tool Route context.
- PR #164: open non-draft, mergeable clean, Track B policy context only.
- Duplicate search: no exact PR for `codex/rp-tool-route-ai-graphics-metadata-integration-qa-review`.

## Validation Status

Local validation status: `passed_with_warnings`.

Passed commands:

- `git diff --check`
- `npm ci`
- `npm run --silent tool-route:ai-graphics-metadata-integration-qa:diagnostics`
- `npm run --silent tool-route:ai-graphics-metadata-integration-approval:diagnostics`
- `npm run --silent open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-qa:diagnostics`
- `npm run --silent open-source-tool-stack:ai-tools-creative-graphics:route-manifest-integration-approval:diagnostics`
- inherited Batch 4, Batch 3, Batch 2, Batch 1, package-lock, owner audit, central open-source audit, and AI tool-study diagnostics
- Batch 3, Batch 2, and Batch 1 import/synthetic proof scripts
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run typecheck:server`
- `npx tsc -b`
- `npm run build`
- `npm run build:server`

Validation warnings:

- `npm ci` passed with existing audit findings: 13 vulnerabilities reported by npm audit output.
- `npm ci` passed with existing allow-scripts review warnings for `babylonjs`, `esbuild`, `fsevents`, `protobufjs`, and `sharp`.
- `npm run prod:readiness:summary` remains globally `blocked` by existing launch/tool/model-weight readiness blockers.
- `npm run prod:beta:summary` keeps external beta, real user media beta, paid production, and production blocked.
- Running the grouped validation under `/bin/bash` found a local PATH issue where `node` resolved to `/usr/local/bin/node` with `Bad CPU type in executable`; validation was run under the default shell path resolving to `/opt/homebrew/bin/node`.

Final local checks before staging:

- changed-file secret scan: `passed_after_false_positive_review`
- package-lock status: `unchanged`
- `.local-artifacts/` staged: `false`
- media/render/browser/canvas/WebGL/public artifacts staged: `false`
- staged diff check: `passed`

Secret scan notes:

- Reviewed expected false positives from the new diagnostic's secret-pattern regex literals.
- Reviewed existing `mask-*` package script names that match naive `sk-` token scanning.
- No committed secret payload, provider key, signed URL, public artifact URL, private URL, or credential-like value was found.

## Supabase Classification

- update required: `no write`
- update status: `docs_only`
- environment touched: `none`
- SQL executed: `none`
- migration deployed: `no`
- milestone sync: `not_performed`

## PR Status

- Branch: `codex/rp-tool-route-ai-graphics-metadata-integration-qa-review`
- PR: `pending`
- Draft state: `pending`
- Check rollup: `pending`

No dependency install, package-lock mutation, import smoke execution, synthetic fixture execution, resvg rasterization, Remotion render/export, browser runtime, WebGL runtime, canvas runtime, actual tool execution, route execution, worker execution, provider/model calls, Supabase mutation, SQL, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
