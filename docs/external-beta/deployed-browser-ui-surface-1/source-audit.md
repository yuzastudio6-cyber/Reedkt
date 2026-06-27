# RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1 Source Audit

Packet: `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1`

Decision: `completed_external_beta_deployed_browser_ui_surface_source_smoke`

Execution: `completed_local_browser_ui_static_surface_smoke_no_remote_mutation`

## Source Chain

- Integration base: `bb685e84bebe96ce62d9194cdf7f97bd7d7f727c`.
- `RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1` recorded blocker `blocked_deployed_browser_ui_surface_not_present`.
- `RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1` remains `completed_external_beta_controlled_tester_product_flow_smoke`.
- Owner-approved controlled tester: `aiediting@reeditpro.com`.
- Staging API service: `reeditpro-staging-api`.
- Staging invoker boundary: `group:external-beta-testers@reeditpro.com`.
- PR #577 remains `open_draft_blocked_excluded`.

## Source Changes

- `src/server/server-router.ts` now serves the built browser UI from `REEDITPRO_WEB_DIST_DIR` or `dist` for safe browser routes.
- API and health paths remain excluded from static fallback: `/api/*`, `/v1/*`, `/health`, and `/ready`.
- `Dockerfile.backend` now runs `npm run build && npm run build:server` and copies `/app/dist` into the runtime image.
- The local proof runner starts the compiled `dist-server/server.js` in mock mode and probes only local HTTP paths.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
