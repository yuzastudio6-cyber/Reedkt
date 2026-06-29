# Runner Contract

Packet: `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1`

Runner: `npm run rp-external-beta-single-tester-real-usage-qa-1`

Confirmation gate: `REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA=true`

## Allowed Runtime Scope

The runner may perform only bounded authenticated staging readback for the approved tester account `aiediting@reeditpro.com`:

- read active gcloud account;
- read Cloud Run service status for `reeditpro-staging-api`;
- read an identity token without printing or persisting it;
- verify unauthenticated `/` remains `403`;
- perform authenticated safe `GET` readback for `/`, `/dashboard`, `/projects`, `/editor`, `/api/runtime/status`, and `/api/routes`;
- fetch static JS/CSS assets discovered from the authenticated root HTML.

The runner must not use POST, upload media, mutate Google Group membership, mutate IAM, update Cloud Run, deploy, run Supabase, run SQL, call providers/models, dispatch workers, process media, create signed URLs, create public artifacts, spend credits, unlock production, or write generated evidence outside `/tmp/reeditpro-rp-external-beta-single-tester-real-usage-qa-1/<runId>/`.

## Failure Blockers

- `blocked_pending_single_tester_real_usage_qa_confirmation`
- `blocked_gcloud_active_account_not_approved_tester`
- `blocked_cloud_run_service_readback_failed`
- `blocked_cloud_run_service_not_ready`
- `blocked_identity_token_readback_failed`
- `blocked_unauthenticated_root_not_403`
- `blocked_authenticated_html_route_readback_failed`
- `blocked_authenticated_json_route_readback_failed`
- `blocked_required_product_routes_missing`
- `blocked_authenticated_static_asset_readback_failed`
