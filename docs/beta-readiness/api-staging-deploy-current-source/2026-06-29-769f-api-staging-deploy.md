# Beta Readiness API Staging Deploy - 769f

Decision: `beta_readiness_api_staging_deploy_current_source_passed_ready_for_current_source_api_preflight`

Source SHA: `769fc2d922b37a9eebb8b0ca29fa2447a6f8f127`

Workflow run: [28343028750](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28343028750)

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-769fc2d922b3-20260629T0129Z-retry1`

Digest: `sha256:9a5bcb232c17b5a0eba14158063d5d2828d56be06d56fb7bdf66caf9d1a042d5`

Revision: `reeditpro-api-staging-00012-ncd`

Service URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`

Canonical URL: `https://reeditpro-api-staging-390722338345.us-east1.run.app`

## Readback

- `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app/health`: unauthenticated `403`
- `https://reeditpro-api-staging-390722338345.us-east1.run.app/health`: unauthenticated `403`

The workflow log reported an IAM policy-setting warning, but the service deployed and public unauthenticated health readback remained forbidden.

## Failed Attempt

Run [28342982883](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28342982883) used the wrong deployer service-account input and failed before a successful registry push/deploy. It is superseded by the successful run above using the previously recorded owner-approved deployer `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com`.

## Boundary

This deploy refreshes private staging API source evidence only. It does not enable external beta, real-user-media beta, paid production, provider calls, worker dispatch, media processing, Supabase writes, SQL, GCS writes, public artifacts, or signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.

Next safe action: run the API deployment preflight and source freshness preflight against the `769f` deploy evidence, then collect owner approvals before any evidence collector.
