# Browser Walkthrough Evidence

Packet: `RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1`

Decision: `completed_external_beta_controlled_owner_browser_walkthrough`

Execution: `completed_guarded_authenticated_browser_surface_walkthrough_no_runtime_mutation`

Owner account: `aiediting@reeditpro.com`

Run ID: `2026-06-27T17-44-11-103Z-d5f1043a`

Output directory: `/tmp/reeditpro-rp-external-beta-controlled-owner-browser-walkthrough-1/2026-06-27T17-44-11-103Z-d5f1043a`

Cloud Run revision: `reeditpro-staging-api-00006-6gw`

Service URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`

## Auth Boundary

- Active gcloud account: `aiediting@reeditpro.com`
- Identity token mode: `user_account_default_audience`
- Identity token printed: `false`
- Identity token persisted: `false`
- Cloud Run invoker member: `group:external-beta-testers@reeditpro.com`
- `allUsers` invoker grant: `false`
- `allAuthenticatedUsers` invoker grant: `false`

## Route Matrix

| Route | Mode | Status | Content type | Body bytes | Result |
| --- | --- | ---: | --- | ---: | --- |
| `/` | unauthenticated | `403` | `text/html; charset=UTF-8` | `295` | `blocked_403` |
| `/` | authenticated | `200` | `text/html; charset=utf-8` | `455` | `passed_200_html` |
| `/dashboard` | authenticated | `200` | `text/html; charset=utf-8` | `455` | `passed_200_html` |
| `/projects` | authenticated | `200` | `text/html; charset=utf-8` | `455` | `passed_200_html` |
| `/editor` | authenticated | `200` | `text/html; charset=utf-8` | `455` | `passed_200_html` |

## Asset Matrix

| Asset | Status | Content type | Body bytes |
| --- | ---: | --- | ---: |
| `/assets/index-BNzAkO71.js` | `200` | `text/javascript; charset=utf-8` | `2195193` |
| `/assets/index-B2pxQajw.css` | `200` | `text/css; charset=utf-8` | `151867` |

Browser-visible shell: `true`

Root element present: `true`

Module script present: `true`

Stylesheet present: `true`

Asset fetches: `passed`

## Artifacts

- `controlled-owner-browser-walkthrough-report.json`: `6928` bytes, SHA-256 `3b59add023f0e66fa29e028239563b8fe6b27c62efd2bbe7acc82bbbb6b52423`
- `artifact-manifest.json`: `442` bytes, SHA-256 `53cca53c7a2198768836c0d4510993d2aaf98e9bba3304715f4a8ef94acc4896`

Generated artifacts committed: `none`
