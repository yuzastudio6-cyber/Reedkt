# Lint Baseline Notes

## Prompt 22 Server Activation Lint Failures

Date: 2026-06-17

Command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run lint
```

Original failures:

```text
server/activation/private-searxng-service/private-searxng-report-builder.ts
  20:9  error  'plan' is assigned a value but never used  @typescript-eslint/no-unused-vars

server/activation/private-searxng-service/private-searxng-service-runner.ts
   11:10   error  'buildPrivateSearxngIamPlan' is defined but never used  @typescript-eslint/no-unused-vars
  297:256  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
```

Resolution:

- Used Option A: fixed the project-owned private SearXNG activation source directly.
- Removed the unused report-builder `plan` local and its now-unused `buildPrivateSearxngServicePlan` import. `PrivateSearxngServiceReport` does not expose a `plan` field, so this keeps report output behavior unchanged.
- Removed the unused service-runner `buildPrivateSearxngIamPlan` import. The IAM plan remains available through the activation module index, CLI, and smoke coverage.
- Replaced the Cloud Run service JSON `Record<string, any>` cast with a narrow local `CloudRunServiceDescription` type using `unknown` optional fields.

No ESLint exceptions, broad ignore patterns, global rule changes, package changes, or editor UI changes were added. These failures were unrelated to the editor rail/composer alignment work; they lived only in `server/activation/private-searxng-service`.
