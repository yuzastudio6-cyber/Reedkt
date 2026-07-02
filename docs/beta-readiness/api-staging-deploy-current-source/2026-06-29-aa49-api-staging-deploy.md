# Beta Readiness API Staging Deploy - aa49

Decision: `beta_readiness_api_staging_deploy_current_source_passed_ready_for_current_source_api_preflight`

Source SHA: `aa49cef9ed6dad971f0163ea80ebb34de0e65d67`

Workflow run: [28373860720](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28373860720)

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-aa49cef9ed6d-20260629T1300Z`

Digest: `sha256:509124705b31f169148f76161b9d5f3c6cd3ab77f703a7f66616eb649ae6117f`

Revision: `reeditpro-api-staging-00013-jv9`

Service URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`

Canonical URL: `https://reeditpro-api-staging-390722338345.us-east1.run.app`

## Readback

The guarded staging deploy workflow passed for the exact tools branch source SHA. The workflow built and pushed the immutable image tag above, deployed Cloud Run revision `reeditpro-api-staging-00013-jv9`, and routed 100 percent of traffic to that revision.

The workflow log still reported the known Cloud Run IAM policy warning. This packet does not treat that warning as external beta readiness; operator readback remains required before external beta evidence collection.

## Boundary

This deploy refreshes private staging API source evidence only. It does not enable external beta, real-user-media beta, paid production, provider calls, worker dispatch, media processing, Supabase writes, SQL, GCS writes, public artifacts, or signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.

Next safe action: run source freshness and deployed evidence input manifest against the `aa49` deploy evidence, then collect missing operator inputs before any external beta collector.
