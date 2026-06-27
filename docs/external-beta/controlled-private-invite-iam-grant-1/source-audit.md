# Source Audit

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1`

Decision: `blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant`

Execution: `completed_docs_only_iam_grant_blocker_review_no_access_mutation`

Base integration head: `ba739fa799e4f9fd57b64d94f2fbcf647acbeb85`

Source chain:

- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`
- `RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1`
- `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH`
- `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1`
- `RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1`
- `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

Staging API:

- Service: `reeditpro-staging-api`
- Region: `us-central1`
- Project: `reeditpro`
- Latest ready revision: `reeditpro-staging-api-00005-7gs`
- Traffic: `100_percent_latest_revision`
- Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- External beta scope: `controlled_private_preview`

Accepted prior evidence:

- unauthenticated access: `blocked_403`
- authenticated `/health`: `200`
- authenticated `/ready`: `200`
- authenticated `/api/runtime/status`: `200`
- runtime mode: `mock`
- mock only: `true`
- provider real calls enabled: `false`
- service-level Cloud Run IAM binding count: `0`
- service-level `allUsers` invoker binding: `false`
- service-level `allAuthenticatedUsers` invoker binding: `false`
- prior access grant mutation: `not_run`

Source scan result:

- exact invited identity list: `not_present_in_source`
- approved Google Group: `not_present_in_source`
- allowed future principal class: `explicit_user_identity_or_explicit_google_group_only`
- blocked principal classes: `allUsers`, `allAuthenticatedUsers`

#577 remains open/draft/blocked and excluded as source-of-truth.

This packet records the missing invite-principal blocker only. It does not grant IAM access, add users, mutate Cloud Run, run providers, run workers, mutate Supabase, run SQL, process media, create signed/public artifacts, enable paid billing, unlock production, or run final delivery/export.
