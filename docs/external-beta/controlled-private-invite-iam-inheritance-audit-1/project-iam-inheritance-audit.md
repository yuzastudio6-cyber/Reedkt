# Project IAM Inheritance Audit

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-INHERITANCE-AUDIT-1`

Decision: `completed_readonly_project_iam_inheritance_audit_no_access_mutation`

Execution: `completed_readonly_project_iam_policy_analysis_no_iam_mutation`

Target:

- Project: `reeditpro`
- Cloud Run service: `reeditpro-staging-api`
- Region: `us-central1`
- Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Prior service-level IAM evidence:

- service-level binding count: `0`
- service-level `allUsers` invoker binding: `false`
- service-level `allAuthenticatedUsers` invoker binding: `false`
- service-level access grant mutation: `not_run`

Read-only project IAM evidence:

- project-level IAM readback: `completed`
- project-level `roles/run.invoker` binding count: `1`
- project-level `roles/run.invoker` member count: `1`
- project-level `roles/run.invoker` member classes: `serviceAccount`
- project-level `roles/run.invoker` user member count: `0`
- project-level `roles/run.invoker` group member count: `0`
- project-level `roles/run.invoker` domain member count: `0`
- project-level `roles/run.invoker` `allUsers` member count: `0`
- project-level `roles/run.invoker` `allAuthenticatedUsers` member count: `0`
- broad inherited Cloud Run invoker access: `false`

Interpretation:

The current authenticated staging smoke can be compatible with authenticated operator/project context while still preserving a private service surface. The read-only project IAM policy does not show a broad project-level Cloud Run invoker binding for `allUsers`, `allAuthenticatedUsers`, users, groups, or domains. It shows only a service-account principal class for project-level `roles/run.invoker`.

External beta readiness remains `blocked_pending_explicit_invite_identity_for_controlled_private_access_grant` because no explicit invited user identity or approved Google Group has been recorded for beta tester access.
