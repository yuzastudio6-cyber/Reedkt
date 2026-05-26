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
## Milestone 12 Readiness Examples

Scripts `08-run-static-readiness.example.sh` through `13-run-all-container-readiness.example.sh` are human-run readiness examples. Container scripts require explicit image variables and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`; they do not build images, push images, deploy, mount user source media by default, download models, run inference, call providers, or process media.
