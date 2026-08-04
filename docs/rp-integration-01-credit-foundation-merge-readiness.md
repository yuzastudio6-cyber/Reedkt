# RP-INTEGRATION-01 Credit Foundation Merge Readiness

Generated: 2026-06-27

## Decision

Status: `blocked_mixed_index`

Do not commit or open a PR from the current index. The mock-safe external-beta credit foundation is present in the worktree, but the repository is not immediately merge-ready because unrelated sound-runtime files are already staged, `package.json` is mixed, and `package-lock.json` is modified but excluded from this foundation.

No index cleanup was performed. No files were staged, unstaged, committed, deleted, moved, renamed, cleaned, stashed, reset, or pushed by this integration audit.

## Repository Snapshot

- Primary path: `/Volumes/backup/REeditpro`
- Branch: `codex/sound-music-audio-1abc-checkpoint`
- HEAD: `84a0eb46c93ca5a200b1e5c9bd7976d28210e0a0`
- Remote: `origin https://github.com/yuzastudio6-cyber/Reedkt.git`
- Pre-report short status count: 429 entries

## Existing Staged Items

The following files were already staged before this integration audit and are not part of the credit foundation:

- `docs/sound-runtime-media-gate-0-install-strategy.md`
- `docs/sound-runtime-media-gate-0-media-runtime-policy-plan.md`
- `docs/sound-runtime-media-gate-0-owner-handoff-map.md`
- `docs/sound-runtime-media-gate-0-runtime-tool-inventory.md`
- `docs/sound-runtime-media-gate-0-worker-gcp-readiness-plan.md`
- `docs/sound-runtime-media-gate-1-blocked-runtime-follow-up-register.md`
- `docs/sound-runtime-media-gate-1-cpu-proof-plan.md`
- `docs/sound-runtime-media-gate-1-cpu-requirements-manifest-strategy.md`
- `docs/sound-runtime-media-gate-1-cpu-worker-contract-plan.md`
- `docs/sound-runtime-media-gate-1-cpu-worker-install-plan.md`
- `package.json`
- `scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py`
- `server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt`

`package.json` is especially unsafe to commit as staged because its staged diff is unrelated script churn while the credit scripts are only in the unstaged diff.

## Credit Foundation File Groups

### RP-CREDITPOLICY-01

- `src/types/credit-policy.ts`
- `server/smoke/credit-policy-smoke.ts`
- `docs/credit-policy.md`
- Credit-policy status notes in `README.md`, `AGENTS.md`, `implementation-status.md`, `mock-vs-real-status.md`, and `credit-ledger-architecture.md`

### RP-CREDITDATA-01

- `src/types/credits.ts`
- `src/backend/contracts/credit-contracts.ts`
- `server/routes/credit-data-routes.ts`
- `server/services/mock-credit-data-store.ts`
- `server/validation/credit-data-schemas.ts`
- `server/smoke/credit-data-smoke.ts`
- Credit-data route mount hunks in `server/app.ts`

### RP-RATECARD-01

- `server/tool-cost-metering/*`
- `server/validation/tool-cost-schemas.ts`
- `server/smoke/rate-card-smoke.ts`
- `docs/rate-card-cost-math.md`
- Credit script hunks in `package.json` for `smoke:rate-card` and `smoke:tool-cost-metering`

### RP-TOOLCOST-01

- `server/tool-cost-metering/production-tool-cost.ts`
- `server/smoke/production-tool-cost-smoke.ts`
- `docs/production-tool-cost-owner-coverage.md`
- `docs/production-tool-cost-estimate-event-adapter.md`
- Precise RP-TOOLCOST boundary metadata hunks only in provider, render, and worker mock-safe files after manual verification that unrelated runtime changes are absent

### RP-ESTIMATE-01

- `server/routes/credit-estimate-routes.ts`
- `server/services/mock-credit-estimate-store.ts`
- `server/validation/credit-estimate-schemas.ts`
- `server/smoke/credit-estimate-smoke.ts`
- `docs/edit-credit-estimate-preview.md`
- Credit-estimate route mount hunks in `server/app.ts`
- Estimate preview additions in `src/types/credits.ts`
- Credit script hunk in `package.json` for `smoke:credit-estimate`

## Mixed Files Requiring Hunk-Level Review

These files must not be staged wholesale without review:

- `package.json`: staged unrelated changes plus unstaged credit scripts.
- `server/app.ts`: credit route mounts should be staged only if no unrelated app wiring is included.
- `README.md`, `AGENTS.md`, `implementation-status.md`, `mock-vs-real-status.md`, `credit-ledger-architecture.md`: stage credit-foundation status hunks only.
- `server/services/provider-gateway-service.ts`, `server/services/render-service.ts`, `server/routes/provider-gateway-routes.ts`, `server/routes/render-routes.ts`, `server/validation/render-schemas.ts`, and `server/workers/production/*`: may contain RP-TOOLCOST boundary metadata, but must be checked against unrelated runtime edits before inclusion.

## Unstaged And Untracked Credit Files

Observed credit-foundation files include:

- Modified: `src/types/credits.ts`, `src/backend/contracts/credit-contracts.ts`, `server/app.ts`, root/status docs, and `package.json` unstaged credit scripts.
- Untracked: `docs/credit-policy.md`, `docs/edit-credit-estimate-preview.md`, `docs/edit-level-credit-policy.md`, `docs/production-tool-cost-estimate-event-adapter.md`, `docs/production-tool-cost-owner-coverage.md`, `docs/rate-card-cost-math.md`, credit routes, credit services, credit validation schemas, credit smokes, `server/tool-cost-metering/`, and `src/types/credit-policy.ts`.

## Files And Categories To Exclude

Exclude these from the credit foundation PR unless separately reviewed:

- Existing staged sound runtime/media gate files.
- `package-lock.json`.
- Activation/private search/Supabase activation work.
- UI/UX screenshot and QA artifacts.
- Edit Level estimate, QA, source, and tool-router work outside targeted credit-foundation status notes.
- Supabase migrations and test SQL.
- Frontend/editor/page styling and component churn unrelated to the credit foundation.
- Any runtime behavior change outside the mock-safe credit foundation.

## Package Status

- `package.json`: `MM`. The staged part is unrelated to the credit foundation; the unstaged part contains credit smoke script additions. It requires surgical hunk-level staging after owner-approved index cleanup.
- `package-lock.json`: modified and excluded. No RP-INTEGRATION-01 credit-foundation change requires a dependency or lockfile update.

## Validation Results

Required checks:

- `npm run smoke:credit-policy`: passed.
- `npm run smoke:credit-data`: passed.
- `npm run smoke:rate-card`: passed.
- `npm run smoke:tool-cost-metering`: passed; aliases the rate-card smoke.
- `npm run smoke:production-tool-cost`: passed; production registry count 49 and metering profile count 49.
- `npm run smoke:credit-estimate`: passed.
- `npm run build`: passed on retry. The first run was interrupted after a long quiet TypeScript phase; the retry completed successfully.
- `npm run lint`: passed on retry. The first run was interrupted after a long quiet lint phase; the retry completed successfully.
- `npm run check:frontend-boundary`: passed for 634 files.

Optional checks that were present:

- `npm run smoke:prod-cost-controls`: passed.
- `npm run smoke:prod-tool-registry`: passed; registry count 49.
- `npm run smoke:prod-runtime-contracts`: passed.
- `npm run smoke:worker`: passed and reported no provider calls attempted.
- `npm run smoke:edit-level-types`: passed.
- `npm run smoke:edit-level-architecture`: passed.
- `npm run smoke:edit-level-surface-audit`: passed.
- `npm run smoke:edit-level-ui`: passed.
- `npm run qa:editor`: failed 1 of 7. The default editor shell test could not find `getByTestId('editor-page')` in `tests/e2e/editor.spec.ts`; 6 tests passed. This appears unrelated to the credit foundation unless later hunk review proves otherwise.
- `npm run qa:viewport`: passed, 45 of 45.
- `npx playwright test tests/e2e/edit-level-ui.spec.ts`: passed, 2 of 2.

## Known Unrelated Blockers

Known server typecheck blockers observed during the credit-foundation work but outside the clean merge package include activation/private-search imports, Supabase milestone sync imports and nullable typing, activation smoke implicit `any`, sound music planner nullable match handling, and Edit Level duplicate `creditRecordCreated` declarations. These should be handled separately unless a specific error is traced to the staged credit hunks during final PR preparation.

The current `qa:editor` failure is also treated as unrelated until proven otherwise because RP-INTEGRATION-01 did not modify the default editor shell route.

## Mock-Safe Boundary Confirmation

This integration audit did not wire:

- live billing
- Stripe or payment behavior
- Supabase migrations or Supabase CLI
- provider calls
- real wallet mutation
- reservation spend, release, or refund
- ledger writes
- render or export execution
- export lock or unlock
- checkout or top-up behavior

The credit foundation remains a mock-safe external-beta data, estimate, settlement-preview, rate-card, and production-tool-cost coverage package.

## Required Next Step

Owner approval is required before index cleanup. After approval, rebuild the index by unstaging unrelated existing staged work, then stage only the credit foundation files or precise credit hunks listed above. If any mixed file cannot be safely hunk-staged, do not commit; split or manually resolve the mixed file first.

Only after that cleanup should the branch `codex/rp-integration-01-credit-foundation` be created or selected, the credit package committed with `Add mock-safe external-beta credit foundation`, and a PR opened with the mock-safe boundaries and known unrelated blockers clearly documented.
