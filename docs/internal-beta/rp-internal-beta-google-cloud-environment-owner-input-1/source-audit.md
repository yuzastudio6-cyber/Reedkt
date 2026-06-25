# RP-INTERNAL-BETA Google Cloud Environment Owner Input 1 Source Audit

Packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1`

Decision: `completed_source_derived_google_cloud_environment_names_for_internal_beta_planning`

Execution: `completed_docs_only_source_derived_environment_owner_input_no_runtime_execution`

Source owner direction: current chat owner instructed Codex to use repository/local source evidence available in this session instead of waiting for hand-entered environment names.

Source merge: `d33a1c81b851ebb9042352a375d3ce7dc822e2a6`

Prior packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-BOUNDARY-1`

Approved runtime target: `google_cloud_managed_runtime_target`

Environment class: `google_cloud_managed_internal_beta`

#577 remains open/draft/blocked and excluded as source-of-truth.

## Checked Source Records

- `docs/google-cloud/RP-GCP-02-live-resource-map.md`
- `docs/google-cloud/RP-GCP-02-production-resource-map.md`
- `docs/google-cloud/RP-GCP-02-secret-and-env-plan.md`
- `docs/google-cloud/RP-GCP-01-resource-plan.md`
- `docs/google-cloud/production-gcp-resource-map.md`
- `server/config/gcp-production-config.ts`
- `server/activation/private-searxng-service/private-searxng-service-policy.ts`
- `server/activation/supabase-milestone-sync/supabase-milestone-sync-policy.ts`

## Result

The missing-name blocker from the prior packet is closed for source-derived planning because checked-in source records name the Google Cloud project, runtime regions, production resource map, Secret Manager reference names, regional private buckets, service accounts, topics, queues, and an existing staging/private service boundary.

This packet does not prove that every resource is deployed, healthy, reachable, IAM-correct, or ready for internal beta execution. It records non-secret source identifiers only.

## Non-Secret Evidence

- Google Cloud project ID: `reeditpro`
- Primary internal/default region: `us-east1`
- Secondary/EU region: `europe-west1`
- Staging activation region found in source: `us-central1`
- Existing staging activation environment: `staging`
- Existing staging private Cloud Run service target: `reeditpro-staging-private-searxng`
- Existing staging service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Existing staging private buckets: `reeditpro-staging-reeditpro-generated-assets`, `reeditpro-staging-reeditpro-qa-artifacts`

## Boundary

Source-derived names are accepted for the next docs/code contract step only. They do not authorize deployment, Cloud Run creation, Cloud Run job creation, GCS access, Secret Manager payload access, remote Supabase mutation, SQL execution, service-role routes, provider/model calls, worker execution, Remotion execution, credit mutation, signed URL creation, public artifact creation, or internal beta unlock.
