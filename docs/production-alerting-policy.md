# Production Alerting Policy

M17 defines alert templates only. No alert is deployed in this milestone.

Templates cover high worker failure rate, stale worker leases, runaway retries, GPU cost spikes, render/export failure spikes, readiness blocker regression, secret or signed URL safety violations, final delivery QA failures, storage growth spikes, and provider-call attempts while providers are blocked.

Human operators must review thresholds and destinations before any deployment.
