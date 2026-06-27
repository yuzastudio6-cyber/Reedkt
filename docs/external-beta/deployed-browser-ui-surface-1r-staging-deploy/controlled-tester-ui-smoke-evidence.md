# Controlled Tester UI Smoke Evidence

Packet: `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY`

Runner: `RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1`

Decision: `completed_external_beta_controlled_tester_ui_flow_smoke`

Execution: `completed_guarded_authenticated_ui_surface_probe_no_runtime_mutation`

Tester: `aiediting@reeditpro.com`

Tester classification: `owner_approved_primary_real_tester_account`

Run ID: `2026-06-27T17-15-34-003Z-a728f2ff`

Output directory: `/tmp/reeditpro-rp-external-beta-controlled-tester-ui-flow-smoke-1/2026-06-27T17-15-34-003Z-a728f2ff`

Report: `controlled-tester-ui-flow-smoke-report.json`, bytes `7870`, SHA-256 `63f1730ebcfc018141e9ebd8a29b1104363cab6f75c9a2ccfb7c850dc7d311fb`

Manifest: `artifact-manifest.json`, bytes `432`, SHA-256 `a1f89539506674d0c2877b437b39d6cf0c9592eeb08a2978f52970f35b666ffe`

## Probe Matrix

| Probe | Result |
| --- | --- |
| unauthenticated `/` | `blocked_403` |
| authenticated `/` | `passed_200_html` |
| authenticated `/dashboard` | `passed_200_html` |
| authenticated `/projects` | `passed_200_html` |
| authenticated `/editor` | `passed_200_html` |

Identity token printed: `false`

Identity token persisted: `false`

Deployed browser UI surface present: `true`
