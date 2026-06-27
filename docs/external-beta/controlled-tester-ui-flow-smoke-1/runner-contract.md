# Runner Contract

Runner: `scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1.mjs`

Package script: `rp-external-beta-controlled-tester-ui-flow-smoke-1`

Confirmation gate:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_UI_FLOW_SMOKE=true
```

Tester gate:

```bash
REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL=aiediting@reeditpro.com
```

The runner is bounded to:

- read Google Group membership for `external-beta-testers@reeditpro.com`;
- read Cloud Run service IAM for `reeditpro-staging-api`;
- read Cloud Run service status and service list for project `reeditpro`;
- require active auth account `aiediting@reeditpro.com`;
- print no identity token and persist no identity token;
- run authenticated and unauthenticated `GET` probes for browser-visible HTML surfaces only;
- write sanitized local report and manifest JSON under `/tmp/reeditpro-rp-external-beta-controlled-tester-ui-flow-smoke-1/<runId>/`.

The runner is not allowed to mutate group membership, mutate IAM, update Cloud Run, deploy, run Supabase, run SQL, access Secret Manager payloads, call providers/models, dispatch workers, process media, render, create signed/public artifacts, process payments, or unlock broad beta/production/final delivery.

Approved blocked decisions:

- `blocked_pending_external_beta_controlled_tester_ui_flow_smoke_confirmation`
- `blocked_tester_email_not_owner_approved_primary_account`
- `blocked_pending_owner_approved_tester_group_membership`
- `blocked_cloud_run_service_discovery_failed`
- `blocked_cloud_run_iam_readback_failed`
- `blocked_cloud_run_group_invoker_binding_missing`
- `blocked_broad_cloud_run_invoker_binding_present`
- `blocked_cloud_run_service_readback_failed`
- `blocked_cloud_run_service_not_ready`
- `blocked_gcloud_auth_readback_failed`
- `blocked_tester_auth_context_not_active`
- `blocked_tester_identity_token_unavailable`
- `blocked_tester_ui_surface_probe_failed`
- `blocked_deployed_browser_ui_surface_not_present`
- `blocked_deployed_browser_ui_surface_not_verified`

Successful completion would require an authenticated browser-visible HTML surface for the controlled staging product UI. This run did not find one.
