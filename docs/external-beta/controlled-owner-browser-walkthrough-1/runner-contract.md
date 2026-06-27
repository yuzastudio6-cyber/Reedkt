# Runner Contract

Packet: `RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1`

Runner:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_OWNER_BROWSER_WALKTHROUGH=true REEDITPRO_EXTERNAL_BETA_OWNER_EMAIL=aiediting@reeditpro.com npm run rp-external-beta-controlled-owner-browser-walkthrough-1
```

## Confirmation Gate

The runner fails closed unless `REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_OWNER_BROWSER_WALKTHROUGH=true`.

The owner email must be `aiediting@reeditpro.com`. Any other account is rejected with `blocked_owner_email_not_reeditpro_account`.

## Allowed Readbacks

- Read Google Group membership for `external-beta-testers@reeditpro.com`.
- Read Cloud Run IAM for `reeditpro-staging-api`.
- Read Cloud Run service status for `reeditpro-staging-api`.
- Read local gcloud active account.
- Obtain an ephemeral identity token for authenticated HTTP requests without printing or persisting the token.
- Fetch unauthenticated `/` and authenticated `/`, `/dashboard`, `/projects`, `/editor`, plus root SPA JS/CSS assets.

## Forbidden Actions

The runner must not mutate Google Group membership, mutate Cloud Run IAM, deploy or update Cloud Run, access Secret Manager payloads, mutate Supabase, run SQL, call providers/models, dispatch workers, process media, create signed/public artifacts, charge or mutate credits, capture a browser, run Docker, run Remotion, run FFmpeg/FFprobe, or unlock broad external beta, paid production, production, or final delivery/export.

## Blockers

- `blocked_pending_external_beta_controlled_owner_browser_walkthrough_confirmation`
- `blocked_owner_email_not_reeditpro_account`
- `blocked_owner_account_not_in_external_beta_testers_group`
- `blocked_cloud_run_group_invoker_binding_missing`
- `blocked_broad_cloud_run_invoker_binding_present`
- `blocked_cloud_run_service_not_ready`
- `blocked_unexpected_cloud_run_revision_for_owner_walkthrough`
- `blocked_owner_auth_context_not_active`
- `blocked_owner_identity_token_unavailable`
- `blocked_unauthenticated_root_not_403`
- `blocked_authenticated_browser_route_failed`
- `blocked_browser_shell_asset_contract_missing`
- `blocked_browser_asset_fetch_failed`
- `blocked_owner_browser_walkthrough_request_failed`
