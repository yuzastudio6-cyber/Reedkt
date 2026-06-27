# IAM Readback

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`

Readback command class: `readonly_cloud_run_iam_policy_and_service_status`

Service: `reeditpro-staging-api`

Region: `us-central1`

Project: `reeditpro`

Read-only evidence:

- `gcloud run services get-iam-policy reeditpro-staging-api --region=us-central1 --project=reeditpro --format=json`
- service-level IAM policy binding count: `0`
- service-level `allUsers` invoker binding: `false`
- service-level `allAuthenticatedUsers` invoker binding: `false`
- IAM policy mutation: `not_run`
- access grant mutation: `not_run`

Service status readback:

- latest ready revision: `reeditpro-staging-api-00005-7gs`
- traffic: `100_percent_latest_revision`
- `Ready`: `True`
- `ConfigurationsReady`: `True`
- `RoutesReady`: `True`
- ingress: `all`

Interpretation:

Ingress is network-reachable, but access is still controlled by Cloud Run authentication. The accepted smoke evidence records unauthenticated HTTP access as `blocked_403` and authenticated health/readiness/runtime-status GETs as passing. This packet does not change IAM and does not broaden the audience.

Sanitization:

- service creator/modifier identities were not recorded;
- no tokens were printed;
- no Secret Manager payload was accessed;
- no service URL is treated as a public artifact source-of-truth.
