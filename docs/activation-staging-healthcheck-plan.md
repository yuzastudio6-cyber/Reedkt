# Activation Staging Healthcheck Plan

Phase 24B health checks are limited to deployment readiness.

When deployment succeeds:

- verify the API service exists and the latest revision is ready;
- use authenticated health checks if the service remains private;
- verify each non-GPU Cloud Run job exists;
- execute only the tool-readiness job if its command is documented safe;
- do not execute CPU, QA, render, or GPU jobs during Phase 24B.

When deployment is blocked, healthcheck summaries must remain report-only and
record the blocker.
