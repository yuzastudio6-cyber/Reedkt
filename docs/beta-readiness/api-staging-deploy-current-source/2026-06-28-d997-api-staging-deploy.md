# API Staging Deploy Current Source - d997

Decision: `beta_readiness_api_staging_deploy_current_source_passed_ready_for_current_source_api_preflight`

This packet records the current-source staging API deployment for `codex/sound-music-audio-1abc-checkpoint` at `d997d567d40853f59741763c8e9ca8b2c361148a`. It updates source truth for the normal staging API only. It does not rerun the platform technical probe, grant owner approvals, enable external beta, process media, or approve production.

## GitHub Actions Evidence

- Workflow: `Beta Readiness API Staging Deploy`
- Run: [28335776268](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28335776268)
- Trigger branch: `codex/reeditpro-web-ui-shell`
- Workflow head SHA: `c2c99bb1d3da714d382e9016dda29d22d46b5bdd`
- Requested source SHA: `d997d567d40853f59741763c8e9ca8b2c361148a`
- Conclusion: `success`
- Jobs: `Guarded staging API deploy preflight` and `Build and deploy private staging API service` both succeeded.

## Deployed Service

- Service: `reeditpro-api-staging`
- Region: `us-east1`
- Revision: `reeditpro-api-staging-00010-c6h`
- Runtime service account: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`
- Service URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`
- Canonical Cloud Run URL: `https://reeditpro-api-staging-390722338345.us-east1.run.app`
- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-d997d567d408-20260628T2058Z`
- Digest: `sha256:b3c5a028ad5385683c9beed7ef8b8fc96a0c2b7342849864ceb843db60f323bf`

## Public Access Readback

Unauthenticated `GET /health` returned HTTP `403` from Google Frontend for both URLs:

- `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app/health`
- `https://reeditpro-api-staging-390722338345.us-east1.run.app/health`

That readback confirms the current deployed service is not publicly callable without authentication. The deploy step also used the guarded workflow path with `--no-allow-unauthenticated`; its IAM policy cleanup warning did not make the endpoint public in the post-deploy unauthenticated readback.

## Limitations

Authenticated health and platform technical probes were not rerun from this local machine because local cloud CLI authentication is expired and cannot refresh non-interactively. The latest platform technical probe remains `docs/beta-readiness/platform-technical-probe-current-state/2026-06-28-a735-platform-technical-probe.json`, which passed 8 of 9 technical checks at source `a735228445fc267784fa561188cd4721b4d12fff`.

The next safe step is still owner approval collection through `npm run beta:readiness:owner-approval-packet`, followed by current-source API preflight and platform probe only after authenticated access and owner approvals are available.

## Boundaries

This packet did not run providers, dispatch workers, process media, write Supabase, run SQL, write GCS, create public artifacts, create signed URLs, enable external beta, enable real-user-media beta, or enable paid production.

Supabase classification: no write / environment none / SQL none / migration no.
