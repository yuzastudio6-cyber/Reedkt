# ReeditPro Production Docker Build Templates

These scripts are examples for a later human-run image milestone. Codex must not run them in Milestone 5.

## Required Environment

- `GCP_PROJECT_ID`
- `GCP_ARTIFACT_REGION`
- `REEDITPRO_ARTIFACT_REPOSITORY`
- `REEDITPRO_IMAGE_TAG`

`REEDITPRO_IMAGE_TAG` must not be `manual-not-set`.

## Boundary

- No script deploys Cloud Run.
- No script calls `gcloud run`.
- No script contains secrets.
- Push script prints `docker push` commands only.
## Readiness Candidate Examples

Scripts `08-run-static-readiness.example.sh` through `13-run-all-container-readiness.example.sh` are human-run readiness examples. Container scripts require immutable `name@sha256:digest` image references, exact `REEDITPRO_SOURCE_COMMIT_SHA` and `REEDITPRO_SOURCE_TREE_HASH` values, and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`. They run with no network, a read-only root, no capabilities, no-new-privileges, a non-root identity, and no volume mounts.

The output is a non-promotable container-runtime candidate receipt. It does not qualify an image until an independent same-source/image verifier and separate license/model gates pass. The scripts do not build images, push images, deploy, mount user source media, download models, run inference, call providers, or process media.
