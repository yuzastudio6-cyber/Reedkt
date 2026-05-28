# Activation GCP Staging Setup Runbook

Phase 22 prepares the staging Google Cloud foundation. Codex does not run `gcloud`, create resources, deploy services/jobs, push images, run Docker, call providers, download models, add secret payloads, or process media.

## Purpose

Use this phase to review staging config, resource names, buckets, service accounts, IAM, Secret Manager placeholder names, and command text before a human runs any setup.

## Human-Run Order Later

1. Review Phase 19 local baseline, Phase 20 build reporting, and Phase 21 container readiness reports.
2. Copy `.env.gcp.staging.example` to a local ignored env file.
3. Fill `GCP_PROJECT_ID`, region values, and reviewed image tag when known.
4. Run `activation:gcp-staging:plan` to print the command plan.
5. Review project, regions, buckets, service accounts, IAM, and secret placeholder names.
6. Set `REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true` only when a human is ready to run setup outside Codex.
7. Run the reviewed GCP setup commands manually.

## Commands

```bash
npm.cmd run activation:gcp-staging:plan -- --project reeditpro-staging-test --image-tag staging-test-001
npm.cmd run activation:gcp-staging:report -- --project reeditpro-staging-test --image-tag staging-test-001
```

These commands are static/report-only. Phase 23 image push comes after staging resources exist. Phase 24 runtime rollout comes later and is not part of Phase 22.
