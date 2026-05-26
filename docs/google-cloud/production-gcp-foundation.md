# Production GCP Foundation

## Purpose

Milestone 3 prepares Google Cloud foundation scripts and documentation for ReeditPro's future production tool runtime. It does not create resources, run `gcloud`, build images, deploy Cloud Run, upload secrets, process media, call providers, or install packages.

The authoritative script templates live in `scripts/gcp/prod/`. They are human-run only and must not be called from npm scripts.

## Locked Runtime Rules

- Workers execute approved plan snapshots, not raw chat.
- Frontend code never runs heavy media, AI, provider, render, service-role, or storage operations.
- Canonical artifact records use private bucket purpose plus object path, not persistent signed URLs.
- Revideo remains evaluation-only and is not deployed.
- Core render stack remains Hyperframe, Remotion, FFmpeg, libass, and OpenTimelineIO.

## Safe Execution Order

1. Copy `.env.gcp.production.example` to a local ignored env file.
2. Fill project, region, service account, repository, and image tag values.
3. Authenticate `gcloud` as a human operator.
4. Run `scripts/gcp/prod/00-print-config.sh`.
5. Review every printed resource name.
6. Set `REEDITPRO_CONFIRM_PROD_SETUP=true` only when ready.
7. Run numbered setup scripts one by one.

Deployment and image build scripts remain examples for later milestones.

## Non-Goals

- No automatic deployment.
- No broad IAM owner/editor grants.
- No real secret values or secret versions.
- No media processing or provider calls.
- No GPU runtime activation beyond template metadata.
