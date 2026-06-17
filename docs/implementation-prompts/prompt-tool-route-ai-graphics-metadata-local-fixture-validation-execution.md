# Implementation Prompt: TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_EXECUTION

## Preserved Prompt

Create a clean stacked branch from `origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-validation-approval` in `/private/tmp/reeditpro-tool-route-ai-graphics-metadata-local-fixture-validation-execution`, branch `codex/rp-tool-route-ai-graphics-metadata-local-fixture-validation-execution`, and open draft PR `[tool-route] AI graphics metadata local fixture validation execution`.

Expected decision: `tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings`.

The lane executes static metadata validation only. It must not run `npm install`, new dependency imports, new synthetic fixture generation, actual local fixture execution, routes, tools, workers, providers/models, browser/WebGL/canvas runtime, rasterization, Remotion render/export, Supabase/SQL, GCS, signed URLs, public artifacts, or beta/production commands.

## Implementation Record

- Base branch: `origin/codex/rp-tool-route-ai-graphics-metadata-local-fixture-validation-approval`.
- Base source: PR #462 at `333083ebe48e31b5ede94cf72e6810d2297e7d4b`.
- Branch: `codex/rp-tool-route-ai-graphics-metadata-local-fixture-validation-execution`.
- Run id: `ai-graphics-local-fixture-validation-local-static`.
- Future QA lane: `TOOL_ROUTE_AI_GRAPHICS_METADATA_LOCAL_FIXTURE_VALIDATION_QA_REVIEW`.
- Validation: dependency-backed diagnostics, inherited proof scripts, lint, typecheck, client build, server build, readiness summaries, changed-file secret scan, and whitespace checks passed before PR creation.
- Local artifact policy: `.local-artifacts/` is ignored; local evidence was generated but not committed.

## Safety Record

The validator reads committed PR #462/#458 docs and the three docs-only JSON templates. It writes ignored local evidence under `.local-artifacts/tool-route/ai-graphics-metadata-local-fixture-validation/ai-graphics-local-fixture-validation-local-static/` and commits sanitized summaries only.

Supabase remains `no write` / `docs_only`; environment touched: `none`; SQL executed: `none`; migration deployed: `no`; milestone sync: `not_performed`.

No local fixture execution, route execution, actual tool execution, worker execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.

PR link: https://github.com/yuzastudio6-cyber/Reedkt/pull/464

PR status after creation: open draft, mergeable clean, empty check rollup.
