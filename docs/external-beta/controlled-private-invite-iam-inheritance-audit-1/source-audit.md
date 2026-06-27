# Source Audit

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-INHERITANCE-AUDIT-1`

Decision: `completed_readonly_project_iam_inheritance_audit_no_access_mutation`

Execution: `completed_readonly_project_iam_policy_analysis_no_iam_mutation`

Base integration head: `c0788dd622a89b0070371bc0e5daa0bb03f62419`

Source chain:

- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1`
- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`
- `RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1`
- `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH`
- `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

Read-only command class:

- `gcloud projects get-iam-policy reeditpro --format=json`

Sanitization:

- individual user emails were not recorded;
- service account names were not recorded in the source packet;
- no token, key, URL, DB URL, Secret Manager payload, or provider credential was recorded;
- only role names, principal classes, and counts required for access-surface reasoning were recorded.

#577 remains open/draft/blocked and excluded as source-of-truth.

This audit explains why service-level IAM readback alone is not the whole access story: Cloud Run IAM can also be inherited from project-level IAM. The project-level readback was read-only and did not grant access.
