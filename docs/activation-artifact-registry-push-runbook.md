# Activation Artifact Registry Push Runbook

Phase 23B pushes only the five non-GPU staging images after Phase 22B verifies
the staging foundation. It does not deploy Cloud Run, run jobs, call providers,
download model weights, process media, create secret values, or unblock launch
gates.

Required environment:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_ARTIFACT_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_ARTIFACT_REPOSITORY=reeditpro-staging-workers`
- `REEDITPRO_IMAGE_TAG=staging-local-001`
- `REEDITPRO_CONFIRM_ARTIFACT_PUSH=true`

Human-run order:

1. Verify `gcloud` auth and active project are exactly `reeditpro`.
2. Verify Artifact Registry repo `reeditpro-staging-workers` exists.
3. Verify Docker CLI/daemon and the five local non-GPU source images exist.
4. Run `activation:artifact-push:plan` and review target image names.
5. Configure Docker auth for `us-central1-docker.pkg.dev`.
6. Tag and push API, tool-readiness, CPU, QA, and render images only.
7. Verify Artifact Registry digests and run `activation:artifact-push:report`.

GPU remains deferred. Phase 24B can start only after all five non-GPU images
have verified digests.
