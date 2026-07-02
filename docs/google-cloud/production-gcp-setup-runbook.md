# Production GCP Setup Runbook

## Human-Run Order

1. Copy `.env.gcp.production.example` to a local ignored env file.
2. Fill `GCP_PROJECT_ID`, region values, service account IDs, repository, and image tag.
3. Authenticate `gcloud` with the intended production operator account.
4. Run `scripts/gcp/prod/00-print-config.sh`.
5. Review project, regions, buckets, service accounts, secrets, and image names.
6. Set `REEDITPRO_CONFIRM_PROD_SETUP=true` only after review.
7. Run `scripts/gcp/prod/01-enable-apis.sh`.
8. Run `scripts/gcp/prod/02-create-artifact-registry.sh`.
9. Run `scripts/gcp/prod/03-create-gcs-buckets.sh`.
10. Run `scripts/gcp/prod/04-create-service-accounts.sh`.
11. Run `scripts/gcp/prod/05-create-secret-placeholders.sh`.
12. Run `scripts/gcp/prod/06-configure-iam.sh`.
13. Use `scripts/gcp/prod/07-build-image-commands.sh` to print future Artifact Registry image names.
14. Use `scripts/docker/prod/00-print-image-config.sh` after Milestone 5 to review image names and tags.
15. Build and push Docker images with `scripts/docker/prod/*.example.sh` only after a human explicitly approves image builds.
16. Use Cloud Run `.example.sh` deploy/run scripts only in later deployment milestones.

## Stop Conditions

Stop if the printed project or region is wrong, `REEDITPRO_CONFIRM_PROD_SETUP` is not intentional, a script asks for a real secret value, or any command would grant owner/editor roles.

## Milestone 5 Container Image Note

Milestone 5 adds Dockerfile templates, build/push command templates, and dry-run readiness specs. It still does not build images, push images, deploy jobs, run `gcloud`, process media, call providers, download model weights, or create real secret versions.
## Milestone 12 Readiness Gate

Container/tool readiness should pass before any Cloud Run deployment. M12 provides static/dry-run readiness and human-run container readiness command plans only; it does not deploy GCP resources.
## Milestone 17 Hardening Gate

Do not deploy or run `gcloud` until the M17 hardening scorecard and human approvals pass. Required approvals include production readiness, model/license review, security review, cost controls, privacy/storage review, incident response ownership, and legal/licensing review.

M17 is static/dry-run only and does not create Google Cloud resources.
