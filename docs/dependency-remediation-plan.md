# Dependency Remediation Plan

## Prompt 14 Status

Current audit status as of May 29, 2026:

- `npm audit --audit-level=moderate` reports 5 moderate findings.
- The findings are all in the existing `@google-cloud/storage` dependency chain.
- The primary advisory is `GHSA-w5hq-g745-h8pq` for `uuid <11.1.1`.
- npm's force fix would install `@google-cloud/storage@5.20.4`, a semver-major downgrade from the current `@google-cloud/storage@^7.19.0` range.

No dependency remediation was applied in Prompt 14 because the available npm fix is breaking and this milestone is scoped to UI QA and audit triage.

## Runtime Exposure

- `@google-cloud/storage` is a direct production dependency.
- The only source import found is `server/storage/gcs-storage-adapter.ts`.
- The Vite frontend app does not import the GCS adapter or the affected transitive packages.
- Current browser QA runs with local/mocked storage and does not call GCS.
- Current `dist` frontend output does not include `@google-cloud/storage`, `gaxios`, `teeny-request`, or `retry-request`.
- `uuid` strings found in frontend chunks are schema metadata text, not the vulnerable package implementation.

Risk is currently bounded to dormant server/storage readiness code, not the active frontend UI bundle.

## Candidate Remediation Paths

1. Apply a safe non-breaking upgrade when upstream packages publish one.
2. Wait for `@google-cloud/storage` to move its transitive chain to patched `uuid` versions without a breaking downgrade.
3. Keep GCS isolated behind server-only storage adapter boundaries.
4. Split backend/server dependencies into a separate package or workspace before production backend launch.
5. Replace the dependency later if the GCS client chain remains unresolved and production storage needs require a cleaner supply-chain profile.
6. Use npm `overrides` only after explicit compatibility testing proves the forced transitive version does not break GCS runtime behavior.

## Decision Criteria

Apply a dependency fix only when all of the following are true:

- The fix does not require a forced downgrade or unreviewed major-version change.
- The fix preserves server storage adapter behavior.
- The fix does not import server/storage code into the frontend bundle.
- The fix does not add production dependencies unrelated to the storage boundary.
- The fix passes frontend and server validation.

## Required Validation

After any future dependency remediation, run:

```bash
npm audit --audit-level=moderate
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```

If server/runtime scripts are available at that milestone, also run storage adapter smoke tests with local/mock storage and a reviewed GCS-mode dry run using non-production credentials.

## Future Prompt Recommendation

Use a dedicated dependency/security milestone to decide whether to upgrade, override, isolate, or replace the GCS dependency chain. Do not bundle that decision into UI-only QA milestones.

## Prompt 15 Decision

Prompt 15 rechecked npm registry state and package ranges.

Decision:

- Do not update `@google-cloud/storage`; `7.19.0` is already the latest release and latest `7.x`.
- Do not add npm overrides; patched transitive options require major-version jumps outside `@google-cloud/storage@7.19.0` ranges.
- Do not run `npm audit fix --force`; npm still suggests a breaking downgrade to `@google-cloud/storage@5.20.4`.
- Add frontend/server dependency boundary enforcement now.
- Defer real dependency remediation to either an upstream fix, a backend package split, or a carefully tested backend-only override/replacement milestone.

Prompt 15 added validation guardrails:

- `npm run check:frontend-boundary`
- CI step for `check:frontend-boundary`
- report-only audit scripts:
  - `npm run audit:moderate`
  - `npm run audit:prod`

Future remediation should prioritize a backend package split before production GCS activation, because the current single-package root audit will continue to report server-only dependency findings even when the frontend bundle is clean.

Prompt 15 validation:

- `npm run check:frontend-boundary`: passed.
- `npm run audit:moderate`: reports the known 5 moderate findings and exits nonzero.
- `npm run audit:prod`: reports the same known 5 moderate findings and exits nonzero.
- `npm run typecheck:server`: passed.
- `npm run build:server`: passed.
- `npm run smoke:api`: passed in local/mock mode.
- `npm run smoke:upload`: passed in local storage mode.
