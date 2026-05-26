# ReeditPro Production GCP Foundation Scripts

These scripts are human-run templates for Milestone 3. Codex must not run them, and npm scripts must not call them.

## Safety

- Copy `.env.gcp.production.example` to a local, ignored env file and fill project values.
- Mutating scripts require `REEDITPRO_CONFIRM_PROD_SETUP=true`.
- Scripts print the project, region, Artifact Registry region, bucket location, environment, repository, and image tag before doing cloud-mutating work.
- Scripts avoid deletes, avoid owner/editor roles, and create placeholders only.
- Secret scripts create Secret Manager names only. They do not add secret versions or payloads.

## Human Execution Order

1. `00-print-config.sh`
2. `01-enable-apis.sh`
3. `02-create-artifact-registry.sh`
4. `03-create-gcs-buckets.sh`
5. `04-create-service-accounts.sh`
6. `05-create-secret-placeholders.sh`
7. `06-configure-iam.sh`
8. `07-build-image-commands.sh` in a later image milestone
9. `.example.sh` Cloud Run service/job templates in later deployment milestones

Milestone 3 does not deploy Cloud Run, build images, run media tools, call providers, create real secret values, or process customer media.
