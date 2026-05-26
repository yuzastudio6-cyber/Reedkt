# Production Incident Response Runbook

Incident categories include secret exposure, signed URL leakage, public media exposure, runaway GPU/render cost, provider call attempts, failed final delivery QA, storage growth spike, worker retry storms, stale leases, and readiness blocker regressions.

Response steps:

1. Activate the relevant kill switch.
2. Stop new affected jobs.
3. Preserve sanitized audit summaries.
4. Remove exposed artifacts or links if applicable.
5. Notify the accountable owner.
6. Run a post-incident review before re-enabling the path.

This runbook is a static M17 draft and must be operationally reviewed before launch.
