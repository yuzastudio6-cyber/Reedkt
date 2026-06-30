# QWEN Staging API Route Deployment Alignment Result

Packet: `RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1`

Decision: `completed_qwen_staging_api_route_deployment_alignment_current_source_bridge`

Execution: `completed_confirmed_staging_api_image_alignment_and_route_preflight_no_provider_execution`

## Confirmed Actions

- Cloud Build #1: `abd118e3-6593-41e7-8809-1bf6337aadc5`
- Image #1: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api:external-beta-qwen-route-align-1-5cf82e6`
- Image #1 digest: `sha256:282ef97d3bc024155f83640fae9969128922c1a051fd56c2a200b8bc1cf96f3c`
- Cloud Run revision #1: `reeditpro-staging-api-00007-xbc`
- Route preflight #1 run ID: `2026-06-30T03-42-37-137Z-bd4b3772`
- Route preflight #1 result: HTTP `404` / `not_found`; route still not exposed in the deployed native server-router path.

- Cloud Build #2: `ef61e232-f563-4e16-bf3e-50b5878d1658`
- Image #2: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api:external-beta-qwen-route-align-1b-5cf82e6`
- Image #2 digest: `sha256:f3deaee047e8f5b9dda7835d1140900c7f4e1f33dc240ddc2743e820be27cf55`
- Cloud Run revision #2: `reeditpro-staging-api-00008-4ct`
- Traffic: `100%` to `reeditpro-staging-api-00008-4ct`
- Service account preserved: `reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com`
- Staging target preserved: `wmyyttnynmteqgcdishd`
- Route preflight #2 run ID: `2026-06-30T03-49-20-516Z-10d064e3`
- Route preflight #2 result: HTTP `424`; route reached fail-closed before provider/model/worker execution.

## Service Scope

Only `reeditpro-staging-api` was updated. The update was image-only and preserved the existing staging service account, target ref, mock runtime settings, local storage mode, Stripe secret references, and 100% traffic routing to latest revision.

No other Cloud Run service was deployed or updated in this phase.

Generated artifacts committed: `none`.

Package-lock: `unchanged`.
