# UI Surface Evidence

Confirmed command:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_UI_FLOW_SMOKE=true REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL=aiediting@reeditpro.com npm run rp-external-beta-controlled-tester-ui-flow-smoke-1
```

Observed result:

- decision: `blocked_external_beta_controlled_tester_ui_flow_smoke`
- blocker: `blocked_deployed_browser_ui_surface_not_present`
- execution: `completed_guarded_authenticated_ui_surface_probe_no_runtime_mutation`
- run ID: `2026-06-27T16-07-23-427Z-7e136bc9`
- output directory: `/tmp/reeditpro-rp-external-beta-controlled-tester-ui-flow-smoke-1/2026-06-27T16-07-23-427Z-7e136bc9`
- report: `controlled-tester-ui-flow-smoke-report.json`, bytes `6576`, SHA-256 `0bf0f4a53c435b3e8e1c62412d7f2cef7b7633de821eee36f62ace16f068b2e3`
- manifest: `artifact-manifest.json`, bytes `432`, SHA-256 `5672d630490da26bfc5b0ef37d66b5da5bbcb041f83ebdcbf0dfa1d328dc3dae`

Readback:

- Cloud Run service: `reeditpro-staging-api`
- region: `us-central1`
- latest ready revision: `reeditpro-staging-api-00005-7gs`
- traffic: `100_percent_reeditpro-staging-api-00005-7gs`
- active auth account: `aiediting@reeditpro.com`
- Cloud Run invoker member: `group:external-beta-testers@reeditpro.com`
- service-level `allUsers` invoker: `false`
- service-level `allAuthenticatedUsers` invoker: `false`
- deployed UI service candidates: `0`

Authenticated HTML probes:

| Path | Status | Content type | HTML-like | Evidence |
| --- | ---: | --- | --- | --- |
| `/` | `404` | `application/json; charset=utf-8` | `false` | `Route not found: /` |
| `/dashboard` | `404` | `application/json; charset=utf-8` | `false` | `Route not found: /dashboard` |
| `/projects` | `404` | `application/json; charset=utf-8` | `false` | `Route not found: /projects` |
| `/editor` | `404` | `application/json; charset=utf-8` | `false` | `Route not found: /editor` |

Unauthenticated `/` remained blocked as `403`.

The controlled tester API product flow remains source-closed by `RP-EXTERNAL-BETA-CONTROLLED-TESTER-PRODUCT-FLOW-SMOKE-1`; the browser-visible deployed product UI flow remains blocked until a deployed browser UI surface exists.
