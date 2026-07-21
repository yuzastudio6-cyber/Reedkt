# Production Worker Image Build Runbook

Milestone 5 provides human-run image build templates only. Codex does not build, push, deploy, run Docker, run `gcloud`, download model weights, or process media.

## Human-Run Order

1. Copy `.env.gcp.production.example` to a local ignored env file.
2. Set `GCP_PROJECT_ID`, `GCP_ARTIFACT_REGION`, `REEDITPRO_ARTIFACT_REPOSITORY`, and a real `REEDITPRO_IMAGE_TAG`.
3. Start from an exactly clean checkout at the reviewed release commit. The build scripts reject tracked or untracked changes, derive `HEAD` and `HEAD^{tree}`, and label the image with those identities.
4. Run `scripts/docker/prod/00-print-image-config.sh` and verify every image name.
5. Build images with the `.example.sh` scripts only after the container/tool-readiness milestone is approved for human execution. Worker `dist-server` artifacts are built inside the Docker build from the same source; do not inject prebuilt host artifacts.
6. Run future local or Cloud Run tool-readiness checks after images exist.
7. Push images with `scripts/docker/prod/07-push-images.example.sh` only after review.
8. Resolve and retain an immutable repository digest, run the confined candidate probe, then run the independent local host verifier described in `production-container-independent-source-image-verification.md`.
9. Deploy Cloud Run services/jobs only in a later deployment milestone.

## Required Safety Checks

The image scripts fail when `REEDITPRO_IMAGE_TAG=manual-not-set`, when the checkout is dirty, or when a supplied source identity differs from the inspected commit/tree. They print image and source identities before build commands and do not contain secrets or Cloud Run deploy commands. The print-only Cloud Build command passes the same exact commit/tree/clean substitutions into the shared Dockerfile contract; it does not infer a different cloud-side identity.

No npm script builds or pushes production images.

## Image Names

Images follow the Artifact Registry pattern:

`$GCP_ARTIFACT_REGION-docker.pkg.dev/$GCP_PROJECT_ID/$REEDITPRO_ARTIFACT_REPOSITORY/<image>:$REEDITPRO_IMAGE_TAG`

Expected image names:

- `reeditpro-api`
- `reeditpro-cpu-worker`
- `reeditpro-gpu-worker`
- `reeditpro-render-worker`
- `reeditpro-qa-worker`
- `reeditpro-tool-readiness-worker`

## Milestone Boundary

Building an image does not authorize worker execution. Future workers still need approved snapshots, private storage references, credit gates, idempotency, registry policy, license/model-weight review, QA gates, and deployment approval.
