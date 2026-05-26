# Production Worker Concurrency Policy

Worker concurrency limits are defined per worker type: API, CPU analysis, GPU AI, render, QA, and tool-readiness. Production overrides require human approval.

Concurrency limits must work with idempotency keys, worker leases, retry policy, rate limits, and kill switches. They are not a substitute for QA gates or readiness blockers.
