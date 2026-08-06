# UI QA CI

## Purpose

The UI QA workflow runs ReeditPro's safe browser regression checks on pull requests and selected branch pushes. It is designed for mocked/local browser QA only.

## Workflow

Workflow file:

- `.github/workflows/ui-qa.yml`

It runs on:

- pull requests
- pushes to `main`
- pushes to `master`
- pushes to `codex/**`
- pushes to `feature/**`

## CI Steps

The workflow uses Node 22 and npm cache, then runs:

```bash
npm ci
npm run check:frontend-boundary
npm run audit:moderate # report-only in CI while the accepted GCS chain finding is tracked
npx playwright install --with-deps chromium
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Playwright reports, test output, and UI screenshot artifacts are uploaded on every run:

- `playwright-report`
- `playwright-test-results`
- `ui-ux-screenshots`

The workflow also writes a GitHub step summary titled `ReeditPro UI QA` with:

- validation steps run
- frontend/server dependency boundary check
- report-only npm audit status
- viewport coverage
- approval-failure flag note
- screenshot artifact path
- Vite warning review note

## Local Equivalent

Use the arm64 Node runtime locally when needed:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run lint
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npx tsc --noEmit
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run test:e2e
```

## Protected UI Behavior

The CI browser suite protects:

- desktop route smoke and no-horizontal-overflow checks
- frontend boundary protection against server-only cloud dependency imports
- floating editor composer
- minimal editor header
- mocked approval success and failure
- no progress before approval
- preview only after approved mock progress
- source sequence interactions
- reference controls
- utility expansion
- advanced timeline drawer
- SFX expanded flow
- Music/SoundSync expanded flow
- practical zoom checks

## Not Covered

The UI QA workflow does not test:

- real backend execution
- Supabase mutations
- provider calls
- payment behavior
- real media uploads or rendering
- native mobile app flows
- pixel-perfect visual diffs
- deployment

## Prompt 15 Dependency Boundary Update

Prompt 15 adds a required frontend/server import boundary check:

```bash
npm run check:frontend-boundary
```

The check prevents frontend-facing code from importing server-only cloud packages such as `@google-cloud/storage`, `google-auth-library`, `gaxios`, `teeny-request`, and `retry-request`.

The CI workflow also runs:

```bash
npm run audit:moderate
```

That audit step is report-only with `continue-on-error: true` because the known GCS chain remains accepted and documented until a safe dependency remediation or backend package split is approved.

## Debugging

For a failed run:

1. Open the uploaded `playwright-report` artifact.
2. Review failure screenshots and traces under `test-results/e2e`.
3. Review `ui-ux-screenshots` if the failure is visual or layout-related.
4. Reproduce locally with the focused script, such as `npm run qa:editor`.
5. Prefer stable roles, labels, and existing `data-testid` surfaces over CSS selectors when repairing tests.

## Screenshot Artifacts

Screenshot tests save docs history images under:

- `docs/ui-ux-screenshots/prompt-12-e2e/`

CI uploads that folder as `ui-ux-screenshots`. The workflow does not upload `node_modules`, `dist`, or other large build outputs.

## Prompt 14 First-Run Checklist

- Confirm the GitHub-hosted Chromium install completes.
- Confirm `npm run test:e2e` writes Playwright report output.
- Confirm `ui-ux-screenshots` appears even when no test fails.
- Confirm the step summary appears on the Actions run summary page.
- Confirm the build step still has no Vite `>500 kB` chunk warning.

Prompt 14 local parity results:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed with no Vite `>500 kB` warning.
- `npm run test:e2e`: 60 passed.
- Focused scripts: `qa:editor` 7 passed, `qa:viewport` 45 passed, `qa:expanded` 3 passed, `qa:zoom` 2 passed.

Prompt 15 local parity additions:

- `npm run check:frontend-boundary`: passed.
- `npm run audit:moderate`: report-only; still reports the known 5 moderate GCS-chain findings.
- `npm run audit:prod`: report-only; same known 5 moderate findings.
- `npm run typecheck:server`: passed.
- `npm run build:server`: passed.

Future CI slices can add visual diffing if the project accepts snapshot maintenance. Prompt 14 keeps the workflow invariant-based and artifact-oriented.
