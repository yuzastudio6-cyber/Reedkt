# Qwen Implementation Blockers

RP-QWEN-00 records blockers before any Qwen 3.7 Max runtime implementation can begin.

Common audit boundary: Qwen 3.7 Max, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Blockers

- Owner approval for Qwen runtime scope.
- Secret Manager access gate.
- Qwen provider config approval.
- Backend-only route decision and auth/workspace policy.
- Structured output schema approval.
- Timeout and retry policy.
- Rate-limit policy.
- Usage/cost policy.
- Logging and redaction policy.
- Privacy/security review.
- Fallback behavior approval.
- Fake-adapter design and smoke coverage.
- Production gate status.

## Production Status

Production ready: false. Qwen runtime, DeepSeek runtime, workers, render, media processing, Supabase persistence, credits, and production route execution remain blocked.

## RP-QWEN-01 Blocker Update

RP-QWEN-01 adds the server-only disabled runtime boundary, but it removes no production blocker. Symbolic secret references, disabled resolver behavior, redaction helpers, provider readiness blocking, and validation are now documented and smoke-tested. Real Secret Manager value/metadata access, `gcloud`, provider clients, Qwen calls, Marker Chat runtime wiring, production routes, workers, render/export/progress, credits, Supabase commands, staging, commits, and cleanup remain blocked. Verification passed `smoke:qwen-runtime-boundary`, `check:qwen-runtime-boundary`, build, lint, frontend-boundary, QA wrappers, and focused Playwright baseline with migration count 26.

## RP-QWEN-BETA-01 Blocker Update

Beta backend Qwen calls are now possible only behind explicit runtime gates. This does not remove production blockers: production auth/effect policy, monitoring, usage/cost limits, Secret Manager rollout review, provider incident handling, broader route access, Supabase persistence, workers, render/export/progress, credits, privacy/security review, and owner production approval remain blocked.
