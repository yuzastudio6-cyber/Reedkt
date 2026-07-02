# Beta Readiness API Staging Deploy - 184f

Decision: `beta_readiness_api_staging_deploy_current_source_passed_ready_for_current_source_api_preflight`

Source SHA: `184f8b225d01d5bb38c7d3a09d8461bcf8e325dc`

Workflow run: [28388776429](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28388776429)

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-184f8b225d01-20260629T1655Z`

Digest: `sha256:57ad5f03353ea9944b026c71ea35fbd9e478e98b7dd757df68e994a746c683ca`

Revision: `reeditpro-api-staging-00014-xdj`

Service URL: `https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app`

Canonical URL: `https://reeditpro-api-staging-390722338345.us-east1.run.app`

## Readback

The guarded staging deploy workflow passed for the exact tools branch source SHA. The workflow built and pushed the immutable image tag above, deployed Cloud Run revision `reeditpro-api-staging-00014-xdj`, and routed 100 percent of traffic to that revision.

The workflow log still reported the known Cloud Run IAM policy warning. This packet does not treat that warning as external beta readiness; operator readback remains required before external beta evidence collection.

## Boundary

This deploy refreshes private staging API source evidence only. It does not enable external beta, real-user-media beta, paid production, provider calls, worker dispatch, media processing, Supabase writes, SQL, GCS writes, public artifacts, or signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.

Next safe action: run source freshness and deployed evidence input manifest against the `184f` deploy evidence, then collect missing operator inputs before any external beta collector.
