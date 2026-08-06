# Dependency Audit Notes

## July 24, 2026 brace-expansion Security Upgrade

The clean-SHA internal pipeline passed all 63 phases, but the post-run
dependency audit then incorporated
[`GHSA-mh99-v99m-4gvg`](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
against `brace-expansion@5.0.7`. The advisory covers versions `<=5.0.7` and
describes an unbounded expansion-length denial of service that can terminate a
Node process through memory exhaustion.

The affected installed path is development-only:

```text
eslint -> minimatch -> brace-expansion
```

The accepted source remediation updates the existing root override to the
first patched release, `brace-expansion@5.0.8`, and regenerates the package
lock without changing the direct dependency set. Verification requires a
clean `npm ci`, zero findings from both full and production-only audits,
application/server typechecks, lint, production build, frontend-boundary and
secret checks, canonical V3 manifest verification, and focused mounted
browser acceptance.

This dependency remediation does not authorize provider, Secret Manager,
Supabase, cloud, billing, deployment, or public-delivery actions.

## July 24, 2026 React Router Security Upgrade

The exact clean-SHA internal pipeline passed 63/63 phases, but the
post-aggregate dependency audit then reported
[`GHSA-qwww-vcr4-c8h2`](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)
against `react-router@7.18.1`. The advisory affects React Router versions
`>=7.12.0 <8.3.0`; the upstream description limits the vulnerable behavior to
unstable RSC APIs, which ReeditPro does not use.

Downgrading to `7.11.0` was tested and rejected because it reopened older
high-severity React Router advisories. The accepted source remediation:

- replaces `react-router-dom@7.18.1` with the unified
  `react-router@8.3.0` package;
- moves existing library-mode imports from `react-router-dom` to
  `react-router` without adding framework-mode, RSC, action, loader, or
  server-rendering behavior;
- pins `react@19.2.7` and `react-dom@19.2.7`, satisfying the router's exact
  peer baseline;
- preserves the existing component routes, `RouterProvider`, navigation
  guards, search parameters, links, named-edit route identity, Motion Studio
  route separation, and Edit Preferences route semantics.

Security verification:

```bash
npm audit --json
npm audit --omit=dev --json
npm run typecheck:api
npm run typecheck:server
npm run lint
npm run build
npm run check:frontend-boundary
npm run check:secrets
```

Both dependency audits report zero vulnerabilities. This source dependency
remediation does not qualify deployed infrastructure or authorize provider,
Secret Manager, Supabase, cloud, billing, deployment, or public-delivery
actions.

## July 10, 2026 Security Maintenance

Actions applied:

- Updated `@google-cloud/storage` from `7.19.0` to `7.21.0` within its current major.
- Updated `react-router-dom`/`react-router` from `7.15.0` to `7.18.1`, removing the reported low router advisory.
- Added a narrow `form-data@2.5.6` override, replacing vulnerable `2.5.5` in the legacy request type chain and removing the high CRLF-injection advisory.
- Added `npm run audit:prod:high`; CI now blocks high/critical production dependency findings.

Current production audit result:

- 0 critical
- 0 high
- 5 moderate
- 0 low

The five remaining moderate records are the upstream GCS chain around
`uuid <11.1.1` through `gaxios`, `teeny-request`, and `retry-request`. npm's
automated forced suggestion is a breaking downgrade to
`@google-cloud/storage@5.18.3`; it was rejected. Forcing `uuid@11` across
dependencies that declare `uuid@8/9` would also violate their supported
contracts. The chain remains server-only, excluded from frontend bundles, and
must be revisited when Google publishes compatible dependencies.

Evidence:

```bash
npm run audit:prod:high
npm run check:frontend-boundary
```

The high/critical gate passes. The moderate report remains visible through
`npm run audit:prod` and is intentionally not represented as fully remediated.

## Prompt 13 Audit

Command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit --audit-level=moderate
```

Result:

- 5 moderate severity findings.
- The findings are in the existing `@google-cloud/storage` dependency chain.
- Affected packages reported by npm:
  - `uuid`
  - `gaxios`
  - `teeny-request`
  - `retry-request`
  - `@google-cloud/storage`

Primary advisory:

- `uuid <11.1.1`
- Missing buffer bounds check in v3/v5/v6 when `buf` is provided.

Fix status:

- `npm audit fix --force` would install `@google-cloud/storage@5.20.4`.
- That is a breaking dependency change from the current `@google-cloud/storage@^7.19.0` range.
- Prompt 13 is a UI QA milestone, so no force fix was applied.

Current recommendation:

- Do not run `npm audit fix --force` as part of UI QA.
- Review the `@google-cloud/storage` chain in a dependency/security maintenance milestone.
- Keep Playwright as dev-only; the audit finding is not introduced by Playwright.

## Prompt 14 Audit Triage

Audit date: May 29, 2026.

Commands used:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit --json
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit --audit-level=moderate
```

Result:

- Total vulnerabilities: 5.
- Severity: 5 moderate, 0 low, 0 high, 0 critical.
- Primary advisory: `GHSA-w5hq-g745-h8pq`.
- Advisory package: `uuid <11.1.1`.
- Advisory title: `uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided`.
- Reported CWE values: `CWE-787`, `CWE-1285`.

Dependency chain:

- Direct production dependency: `@google-cloud/storage@7.19.0`.
- `@google-cloud/storage` reports moderate exposure through `retry-request`, `teeny-request`, and `uuid`.
- `retry-request@7.0.2` depends on vulnerable `teeny-request`.
- `teeny-request@9.0.0` depends on vulnerable `uuid`.
- `gaxios@6.7.1` also depends on vulnerable `uuid`.
- `google-auth-library@9.15.1` depends on `gaxios`, but npm reports the vulnerability records against `gaxios` and the GCS chain.

Frontend exposure review:

- Source import search found `@google-cloud/storage` only in `server/storage/gcs-storage-adapter.ts`.
- No frontend `src/**` file imports `@google-cloud/storage`, `gaxios`, `teeny-request`, `retry-request`, or runtime `uuid`.
- `src/**` matches for `uuid` are schema/type strings for planned Supabase table columns, not package imports.
- Current `dist` frontend chunk search does not include `@google-cloud/storage`, `gaxios`, `teeny-request`, or `retry-request`.
- `uuid` text in current frontend chunks is emitted as Supabase schema metadata strings, not as the vulnerable package implementation.
- The affected dependency chain is not bundled into the Vite frontend app and does not run in current UI-only Playwright workflows.

Runtime classification:

- `@google-cloud/storage` is a production dependency because it supports server/storage adapter readiness.
- The currently affected import is server/backend only.
- The adapter is dormant in the UI QA path and is not loaded by browser routes.
- Existing E2E runs use local/mocked storage mode and do not call GCS.
- The finding does not come from Playwright, which remains dev-only.

Fix status:

- npm reports a fix path that installs `@google-cloud/storage@5.20.4`.
- That is a semver-major downgrade from the current `@google-cloud/storage@^7.19.0` dependency range.
- `npm audit fix --force` was not run because it would apply a breaking dependency change during a UI QA hardening milestone.
- No safe non-breaking npm audit fix is currently presented by npm.

Recommendation:

- Do not apply the forced downgrade.
- Monitor upstream `@google-cloud/storage`, `gaxios`, `teeny-request`, and `retry-request` releases for a non-breaking chain update.
- Keep the dependency isolated to server/storage code and out of frontend imports.
- Consider splitting backend/server dependencies into a separate package or workspace before production backend launch.
- Consider a carefully tested override only if upstream does not resolve the chain and server runtime exposure becomes active.
- Re-run typecheck, lint, build, browser E2E, and server/storage smoke tests after any future dependency remediation.

## Prompt 15 GCS Chain Deep Audit

Audit date: May 29, 2026.

Commands used:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit --json
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm audit --audit-level=moderate
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm outdated @google-cloud/storage gaxios retry-request teeny-request uuid
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm view @google-cloud/storage version
```

Direct dependency:

- `@google-cloud/storage@7.19.0`.
- Declared in root `dependencies` as `^7.19.0`.
- npm registry latest: `7.19.0`.
- Latest `7.x`: `7.19.0`.
- No direct same-major upgrade is available.

Vulnerable chain and installed versions:

- `@google-cloud/storage@7.19.0`
  - depends on `gaxios@^6.0.2`; installed `gaxios@6.7.1`
  - depends on `retry-request@^7.0.0`; installed `retry-request@7.0.2`
  - depends on `teeny-request@^9.0.0`; installed `teeny-request@9.0.0`
  - depends on `uuid@^8.0.0`; installed root `uuid@8.3.2`
- `gaxios@6.7.1`
  - depends on `uuid@^9.0.1`; installed nested `uuid@9.0.1`
- `teeny-request@9.0.0`
  - depends on `uuid@^9.0.0`; installed nested `uuid@9.0.1`
- `retry-request@7.0.2`
  - depends on `teeny-request@^9.0.0`

Advisory:

- `GHSA-w5hq-g745-h8pq`
- `uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided`
- Vulnerable range: `uuid <11.1.1`
- Patched minimum from audit advisory: `uuid@11.1.1`

Registry status:

- `@google-cloud/storage` latest: `7.19.0`
- `gaxios` latest: `7.1.4`
- `retry-request` latest: `8.0.2`
- `teeny-request` latest: `10.1.2`
- `uuid` latest: `14.0.0`

Safe update / override evaluation:

- A direct `@google-cloud/storage` upgrade cannot resolve the audit because the project is already on the latest `7.x` and latest overall release.
- A package-lock-only update cannot resolve the audit because the dependency ranges still select vulnerable major ranges.
- npm's suggested fix remains `npm audit fix --force`, which would install `@google-cloud/storage@5.20.4`; this is a breaking downgrade and was not applied.
- Overriding `uuid` to `11.1.1` or newer would violate `@google-cloud/storage`'s `uuid@^8.0.0` range and the nested `uuid@^9` ranges used by `gaxios@6` and `teeny-request@9`.
- Overriding `gaxios`, `retry-request`, or `teeny-request` to their latest patched majors would violate `@google-cloud/storage@7.19.0` dependency ranges.
- No safe non-breaking override was identified.

Exposure and runtime assessment:

- Frontend runtime risk: low. The GCS chain is not imported by frontend-facing source and is not present in current Vite frontend chunks.
- Server runtime risk: bounded but present in the shared root dependency graph. `server/storage/storage-adapter.ts` statically imports the GCS adapter, so server builds can load the module graph even when local storage mode is used.
- Mock/local storage mode risk: low for behavior. Current local/mock upload flows use `LocalStorageAdapter`; they do not call GCS APIs or create signed GCS URLs.
- Future production GCS mode risk: medium until the dependency chain is remediated, because `GcsStorageAdapter` would actively use the GCS client for signed URLs and metadata checks.
- Current CI/E2E exposure: low. Browser E2E runs local/mocked frontend state and does not call the server GCS adapter.
- Current deployment exposure: not confirmed as active; docs and smoke setup treat GCS as future/backend-readiness code.

Prompt 15 action:

- No package update was applied.
- No npm overrides were added.
- Added `scripts/check-frontend-server-boundary.mjs` and `npm run check:frontend-boundary` to prevent cloud/server-only dependencies from entering frontend-facing code.
- Added CI enforcement for `check:frontend-boundary`.
- Added report-only audit scripts so the known finding remains visible without permanently failing UI QA.

Recommendation:

- Defer dependency remediation until upstream publishes a safe `@google-cloud/storage` release, or until a backend package split isolates server dependencies from frontend/UI audit scope.
- Do not force the npm downgrade.
- Do not use transitive overrides unless a future backend security milestone validates GCS compatibility with the overridden major versions.
