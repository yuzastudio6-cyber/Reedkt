# Production Observability Plan

M17 defines observability templates only. Metrics include worker job count, duration, failures, retries, blocked jobs, QA failures, render duration, GPU duration, estimated GPU cost, readiness blockers, artifact storage bytes, private exports, deletion requests, signed URL generation, and secret safety violations.

Worker events must include correlation IDs for workspace, project, media asset, approved snapshot, tool execution plan, job, and idempotency key where available. Traces must not include secrets, signed URLs, raw prompts, auth headers, cookies, or sensitive local paths.

Dashboards and alerts are future human-run operations work; M17 does not deploy monitoring.
