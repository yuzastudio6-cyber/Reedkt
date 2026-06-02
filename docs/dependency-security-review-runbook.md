# Dependency and Security Review Runbook

Prompt 16 is record-only. It may inspect `package.json`, `package-lock.json`, and `npm audit` output, but must not mutate dependencies.

## Review Steps

1. Confirm `package.json` direct dependencies and dev dependencies.
2. Confirm `package-lock.json` is present and unchanged by the review.
3. Run `npm audit --audit-level=moderate --json` only for evidence.
4. Record severity, affected package chain, suggested fix, and whether the fix is breaking.
5. Do not run `npm audit fix` or `npm audit fix --force`.
6. Open a separate dependency-remediation prompt for version changes.

## Approval Rules

- Dev approval requires human dependency/security review and exact package/lockfile evidence.
- Staging approval requires vulnerability disposition, runtime isolation review, and rollback plan.
- Production approval requires human legal/security review, audit evidence, and approved runtime scope.

No secrets, provider calls, tool execution, worker execution, media processing, deployment, or package installation beyond `npm ci` is allowed in this runbook.
