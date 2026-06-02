# Phase 49F Private SearXNG Service Runbook

Phase 49F validates a ReeditPro-controlled private SearXNG Cloud Run service and one bounded authenticated query.

Default report and IAM-plan commands are static. Execution requires `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_PRIVATE_SEARXNG_SERVICE_VALIDATION=true`.

Execution builds the dedicated CPU-only SearXNG image, deploys `reeditpro-staging-private-searxng` without unauthenticated access, grants only narrow authenticated invoker access if needed, runs the approved query `ReeditPro open source video editing planning`, normalizes at most five results, and uploads private JSON artifacts.

Do not use public SearXNG instances, paid providers, Playwright, screenshots, Readability extraction, browser capture, public artifacts, signed URLs, production, external beta, paid production, or broad media in this phase.
