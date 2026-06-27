# RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1 Results

Decision: `completed_external_beta_deployed_browser_ui_surface_source_smoke`

Execution: `completed_local_browser_ui_static_surface_smoke_no_remote_mutation`

The backend server now has a bounded static browser surface for the built ReEditPro UI. `Dockerfile.backend` builds the frontend bundle and copies `dist` into the runtime image, while `src/server/server-router.ts` serves browser routes from `REEDITPRO_WEB_DIST_DIR` or `dist` and keeps `/api/*`, `/v1/*`, `/health`, and `/ready` out of the static fallback.

Run ID: `2026-06-27T16-48-29-652Z-16d76e70`

Output directory: `/tmp/reeditpro-rp-external-beta-deployed-browser-ui-surface-1/2026-06-27T16-48-29-652Z-16d76e70`

Artifacts:

- `deployed-browser-ui-surface-report.json`: `6755` bytes, SHA-256 `2b136a7bf99ef7f7154c6ba2c9c53631704c50a2c844e39bd8f6875c59262e91`
- `artifact-manifest.json`: `308` bytes, SHA-256 `cfe609820f0b13ae25a5cbd208b5039140a1971d36eb93ab7ecffccde0cd1257`

Local probes passed for `/`, `/dashboard`, `/projects`, `/editor`, `/assets/index-BNzAkO71.js`, and `/api/routes`.

External product beta readiness: `blocked_pending_controlled_staging_browser_ui_deploy_and_resmoke`

Source readiness: `ready_for_controlled_staging_browser_ui_deploy_and_ui_flow_resmoke`

Next milestone: `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, persistent credit mutation, persistent credit reservation creation, Stripe checkout/webhook/payment processing, Cloud Run IAM mutation, Cloud Run service update, deployment, broad public invoker grant, internal beta broad unlock, external beta broad audience unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, Docker execution, package installation beyond `npm ci`, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
