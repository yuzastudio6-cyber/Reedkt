# Qwen Reasoning Agent Surface Audit

RP-QWEN-00 audits the existing reasoning-agent surface for future Qwen 3.7 runtime integration. Current implementation is mock/local and backend-only.

Common audit boundary: Qwen 3.7, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Existing Surface

- `src/types/reasoning-agent.ts` defines prompt packages, structured outputs, validation results, usage estimates, runtime summaries, and no-provider rules.
- `src/backend/reasoning-agent/reasoning-agent-prompt-package-service.ts` creates structured prompt packages for Edit Preference, Preference Video DNA, QA, revision learning, and related reasoning tasks.
- `src/backend/reasoning-agent/mock-reasoning-agent-adapter.ts` returns deterministic mock structured outputs.
- `src/backend/reasoning-agent/qwen-reasoning-adapter-skeleton.ts` returns configured-later summaries and blocked responses.
- Usage estimates are estimate-only and billable false.

## Current Guarantees

- `providerCallMade` is false.
- Qwen skeleton reports `secretAccessed: false`.
- Raw media/binary input and secret-like prompt values are rejected by validation.
- Frontend direct reasoning access is blocked.

## Missing Runtime Work

- Real Qwen transport.
- Qwen response validator wired to task-specific schemas.
- Runtime retry/timeout/rate-limit policy.
- Redacted observability and usage-cost tracking.
