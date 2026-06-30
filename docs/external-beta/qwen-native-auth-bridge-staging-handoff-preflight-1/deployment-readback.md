# Deployment Readback

Service: `reeditpro-staging-api`

Region: `us-central1`

Project: `reeditpro`

Latest ready revision: `reeditpro-staging-api-00011-79q`

Traffic: `100_percent_reeditpro-staging-api-00011-79q`

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api:external-beta-qwen-auth-bridge-1-3618372`

Image digest: `sha256:0085e10c6cfadaebeb390bc1738ffba0d35477aa38f8da130158ec9e964e1eb7`

Configured public auth env:

- `SUPABASE_URL`: Secret Manager ref `SUPABASE_URL:latest`
- `SUPABASE_ANON_KEY`: Secret Manager ref `SUPABASE_ANON_KEY:latest`

Configured QWEN route gates:

- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF=true`
- `REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`

The service remains private behind Cloud Run IAM. The preflight used `X-Serverless-Authorization` for the Google identity token so the application `Authorization` header could carry the Supabase user JWT.
