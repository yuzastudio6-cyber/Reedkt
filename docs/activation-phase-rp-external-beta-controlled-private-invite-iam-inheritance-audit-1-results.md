# Activation Phase: RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-INHERITANCE-AUDIT-1 Results

Decision: `completed_readonly_project_iam_inheritance_audit_no_access_mutation`

Execution: `completed_readonly_project_iam_policy_analysis_no_iam_mutation`

External beta readiness: `blocked_pending_explicit_invite_identity_for_controlled_private_access_grant`

Project IAM inheritance: `completed_readonly_project_iam_inheritance_audit_no_broad_invoker`

Project-level `roles/run.invoker` binding count: `1`

Project-level `roles/run.invoker` member count: `1`

Project-level `roles/run.invoker` member classes: `serviceAccount`

Project-level `roles/run.invoker` user member count: `0`

Project-level `roles/run.invoker` group member count: `0`

Project-level `roles/run.invoker` domain member count: `0`

Project-level `roles/run.invoker` `allUsers` member count: `0`

Project-level `roles/run.invoker` `allAuthenticatedUsers` member count: `0`

Broad inherited Cloud Run invoker access: `false`

Private invite IAM grant remains: `not_run_missing_explicit_identity_list`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Validation: `full_validation_passed_after_project_iam_inheritance_audit`

## Result

Read-only project IAM policy analysis confirms that service-level IAM is not hiding a broad inherited Cloud Run invoker audience. The project-level `roles/run.invoker` binding exists only for a service-account principal class in sanitized evidence; there are no project-level user, group, domain, `allUsers`, or `allAuthenticatedUsers` members for `roles/run.invoker`.

The external beta access gate remains blocked until an exact invited user identity or approved Google Group is recorded and a later guarded IAM grant packet explicitly authorizes the access mutation.

Next milestone: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST`.

## Safety

No Cloud Run IAM mutation, Cloud Run service update, deployment, invite grant, invite email sending, app user creation, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled. This phase was limited to docs/status/diagnostics plus read-only project IAM policy analysis.
