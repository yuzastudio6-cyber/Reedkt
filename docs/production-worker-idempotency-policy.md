# Production Worker Idempotency Policy

## Stable Source

Worker idempotency keys are derived from stable IDs:

- workspace ID;
- project ID;
- approved snapshot ID;
- tool execution plan ID;
- worker type;
- requested tool IDs;
- requested recipe IDs;
- storage reference IDs;
- render mode and required QA gate references where applicable.

Raw chat, raw prompts, signed URLs, provider payloads, and secret values must never participate in idempotency keys.

## Behavior

The Milestone 4 helper can build a stable key, assert a payload key matches, and detect duplicate keys in a mock-safe map. Real persistence will use `production_worker_idempotency_keys` after migration review.
