# Production Observability Plan

M17 defines observability templates only. Metrics include worker job count, duration, failures, retries, blocked jobs, QA failures, render duration, GPU duration, estimated GPU cost, readiness blockers, artifact storage bytes, private exports, deletion requests, signed URL generation, and secret safety violations.

Worker events must include correlation IDs for workspace, project, media asset, approved snapshot, tool execution plan, job, and idempotency key where available. Traces must not include secrets, signed URLs, raw prompts, auth headers, cookies, or sensitive local paths.

Dashboards and alerts are future human-run operations work; M17 does not deploy monitoring.

Milestone 10 deployed evidence now requires catalog coverage when a platform evidence packet claims monitoring deployment passed. Operators must provide non-secret `monitoringDeploymentEvidence` with deployed dashboard IDs, alert rule IDs, metric names, alert routing destinations, and billing-QA alert rule IDs. The verifier compares those IDs with `server/observability/alert-rule-catalog.ts` and `server/observability/production-metrics-catalog.ts`, so a generic monitoring note cannot clear the production observability blocker.
