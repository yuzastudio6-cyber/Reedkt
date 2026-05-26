# Production GCP Artifact Registry Plan

## Repository

Milestone 3 defines one Docker repository:

```text
${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}
```

Default repository name:

```text
reeditpro-workers
```

## Image Names

Planned image names:

- `reeditpro-api`
- `reeditpro-cpu-worker`
- `reeditpro-gpu-worker`
- `reeditpro-render-worker`
- `reeditpro-qa-worker`
- `reeditpro-tool-readiness-worker`

Image tags come from `REEDITPRO_IMAGE_TAG`. The example value is `manual-not-set` so no accidental production tag is implied.

## Milestone 3 Boundary

`scripts/gcp/prod/07-build-image-commands.sh` prints future `gcloud builds submit` commands only. It does not build or push images.
