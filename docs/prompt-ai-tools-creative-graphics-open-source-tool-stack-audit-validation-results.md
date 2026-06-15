# AI_TOOLS_CREATIVE_GRAPHICS Open-Source Tool Stack Audit Validation Results

Prompt: `AI_TOOLS_CREATIVE_GRAPHICS_OPEN_SOURCE_TOOL_STACK_AUDIT`

Branch: `codex/rp-open-source-tool-stack-ai-tools-creative-graphics-audit`

PR: pending

Decision: `owner_tool_stack_audit_completed_ready_for_install_proof_approval`

## Source Reads

- PR #416: open, non-draft, mergeable clean at `85a02dce4a64a99927c8e30c68bd75d3d9736390`.
- PR #412: merged.
- PR #384 and PR #401: open draft reference-only evidence.
- Exact duplicate head branch search: no open PR found before implementation.
- Source branch: `codex/rp-open-source-tool-stack-audit`.

## Validation

Initial local results will be updated after commands run.

| Command | Result |
| --- | --- |
| `git diff --check` | passed |
| `npm ci` | blocked: base `package.json` / `package-lock.json` mismatch for `@emnapi/runtime`, `@emnapi/core`, and `@emnapi/wasi-threads`; lockfile was not mutated. |
| `npm run open-source-tool-stack:audit:diagnostics || true` | passed |
| `npm run --silent open-source-tool-stack:ai-tools-creative-graphics:diagnostics` | passed |
| `npm run --silent tool-study:ai-tools-creative-graphics:diagnostics` | passed |
| `npm run prod:readiness:summary` | blocked: `tsx` unavailable because `npm ci` did not complete. |
| `npm run prod:beta:summary` | blocked: `tsx` unavailable because `npm ci` did not complete. |
| `npm run lint` | blocked: `eslint` unavailable because `npm ci` did not complete. |
| `npm run typecheck:server || true` | blocked: `tsc` unavailable because `npm ci` did not complete. |
| `npx tsc -b` | blocked: TypeScript compiler unavailable because `npm ci` did not complete. |
| `npm run build` | blocked: `tsc` unavailable because `npm ci` did not complete. |
| `npm run build:server || true` | blocked: `tsc` unavailable because `npm ci` did not complete. |
| changed-file secret scan | passed; the diagnostic file contains an intentional secret-pattern regex and was excluded from the final content scan. |
| `git diff --cached --check` | passed |

## Dependency Validation Blocker

`npm ci` failed before installing dependencies because the base branch lockfile is not synchronized with package metadata:

- Missing from lockfile: `@emnapi/runtime@1.11.1`
- Missing from lockfile: `@emnapi/core@1.11.1`
- Invalid lockfile entry: `@emnapi/wasi-threads@1.2.1` does not satisfy `@emnapi/wasi-threads@1.2.2`
- Missing from lockfile: `@emnapi/core@1.10.0`
- Missing from lockfile: `@emnapi/runtime@1.10.0`
- Missing from lockfile: `@emnapi/wasi-threads@1.2.1`

This branch did not update `package-lock.json` because the requested scope forbids dependency mutation.

## Scope

- Supabase update required: `no write`
- Supabase update status: `docs_only`
- Environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Milestone sync: `not_performed`
- Package-lock status: unchanged by this owner audit

No dependency mutation, tool execution, route execution, worker execution, provider/model call, media processing, audio processing, render/export, browser capture, map rendering, Supabase write, SQL execution, GCS upload, storage transfer, signed URL source-of-truth, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, or production unlock was enabled.
