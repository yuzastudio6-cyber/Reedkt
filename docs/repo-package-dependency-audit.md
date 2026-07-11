# Repo Package Dependency Audit

This report documents package/dependency state in `/Volumes/backup/REeditpro`.

## Package File Status

| File | Status | Meaning |
| --- | --- | --- |
| `package.json` | `MM` | staged changes plus additional unstaged changes |
| `package-lock.json` | ` M` | unstaged modified lockfile |

The RP-MERGE-AUDIT-00 package script addition should remain unstaged. The pre-existing staged package changes are unrelated to this audit.

## Script Changes Versus HEAD

Existing working-tree `package.json` already includes script additions versus HEAD, including:

```text
audit:moderate
audit:prod
check:frontend-boundary
qa:editor
qa:expanded
qa:screenshots
qa:viewport
qa:zoom
smoke:approved-snapshot
smoke:edit-level-api-client
smoke:edit-level-api-routes
smoke:edit-level-architecture
smoke:edit-level-repository
smoke:edit-level-surface-audit
smoke:edit-level-types
smoke:edit-level-ui
test:e2e
test:e2e:headed
test:e2e:report
```

RP-MERGE-AUDIT-00 adds only:

```text
smoke:repo-merge-integrity-audit
```

## Dependency Changes Versus HEAD

Existing working tree dependency changes:

- Dependencies: no added, removed, or version-changed package entries detected.
- Dev dependencies: `@playwright/test@^1.60.0` is added versus HEAD.

`package-lock.json` is already modified and should be reviewed with package changes. This audit does not modify the lockfile.

## Risk

Missing lock update risk is not introduced by the audit smoke script because it uses existing `tsx` and Node built-ins. However, the existing `@playwright/test` dev dependency and modified `package-lock.json` remain a package/dependency review item before any PR staging.
