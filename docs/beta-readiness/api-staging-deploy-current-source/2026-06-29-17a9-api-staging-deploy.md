# API Staging Deploy Current Source - 17a9

Decision: `beta_readiness_api_staging_deploy_current_source_passed_ready_for_current_source_api_preflight`

This packet records the guarded staging API deployment for `codex/sound-music-audio-1abc-checkpoint` at `17a9a2d2b015ab325cf13ce5135d083af070ab00`. It refreshes the older `d997d567d40853f59741763c8e9ca8b2c361148a` staging API deploy evidence and clears the stale-source blocker recorded in `docs/beta-readiness/source-freshness-preflight/2026-06-29-e6fa-source-freshness-blocked.md`.

## GitHub Actions Evidence

- Workflow: `Beta Readiness API Staging Deploy`
- Run: [28341446109](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28341446109)
- Trigger branch: `codex/reeditpro-web-ui-shell`
- Workflow head SHA: `c2c99bb1d3da714d382e9016dda29d22d46b5bdd`
- Requested source SHA: `17a9a2d2b015ab325cf13ce5135d083af070ab00`
- Conclusion: `success`
- Jobs: `Guarded staging API deploy preflight` and `Build and deploy private staging API service` both succeeded.

## Deployed Service

- Service: `reeditpro-api-staging`
- Region: `us-east1`
- Revision: `reeditpro-api-staging-00011-cts`
- Runtime service account: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`
- Service URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`
- Canonical Cloud Run URL: `https://reeditpro-api-staging-390722338345.us-east1.run.app`
- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-17a9a2d2b015-20260629T0034Z`
- Digest: `sha256:35fcf6401f15baab8206fc7b3bf5436416c6ef24419f545f8e813504a7c1ab4c`

## Public Access Readback

Unauthenticated `GET /health` returned HTTP `403` for both URLs:

- `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app/health`
- `https://reeditpro-api-staging-390722338345.us-east1.run.app/health`

That confirms the deployed staging API remains private and is not publicly callable without authentication.

## Limitations

Authenticated health and platform technical probes were not rerun from this local machine because local cloud CLI authentication is expired and cannot refresh non-interactively. Owner approvals, owner evidence notes, deployed evidence collection, and final operator readback remain required before external beta can be claimed.

## Boundary

This packet did not run providers, dispatch workers, process media, write Supabase, run SQL, write GCS, create public artifacts, create signed URLs, enable external beta, enable real-user-media beta, or enable paid production.

Supabase classification: no write / environment none / SQL none / migration no.
