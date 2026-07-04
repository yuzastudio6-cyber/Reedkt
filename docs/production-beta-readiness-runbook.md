# Production Beta Readiness Runbook

Internal dry-run testing may use static reports and generated mock artifacts. Local-dev fixture testing may use generated fixtures only when explicitly enabled and safe.

Internal break/fix testing is a separate stage from external beta and paid production. It may allow signed-in internal testers, repeated debugging, mock/test credits, approved-snapshot gate testing, bounded diagnostics, private artifact manifest validation, and operator readback without requiring paid users.

Real user media beta requires human approval for deployment, storage, security, cost controls, retention/deletion, model weights, licenses, monitoring, and support.

External beta and paid production remain blocked by default in M17. Those blockers protect external users, real user media, live billing, production wallet mutation, public artifact delivery, and production launch; they must not block safe internal break/fix testing.

See `docs/internal-testing-mode-readiness.md` for the internal testing ladder and guardrails.
