# Creative Graphics Package License And Security Notes

Prompt: `GD-8`

Status: `package_runtime_probe_mostly_passed_with_native_blocker`

GD-8 records package metadata and local audit status for the creative graphics package runtime enablement milestone. These notes are not a legal approval, not a production approval, and not a runtime execution approval.

| Package | Version | License metadata | GD-8 note |
| --- | --- | --- | --- |
| `remotion` | `4.0.474` | `SEE LICENSE IN LICENSE.md` | Import-only package availability; no `@remotion/renderer` added. |
| `d3` | `7.9.0` | `ISC` | Import-only package availability. |
| `three` | `0.184.0` | `MIT` | Import-only package availability; Group C remains blocked. |
| `pixi.js` | `8.19.0` | `MIT` | Import-only package availability; Group C remains blocked. |
| `animejs` | `4.4.1` | `MIT` | Import-only package availability. |
| `lottie-web` | `5.13.0` | `MIT` | Import-only package availability; browser/runtime behavior needs later review. |
| `@svgdotjs/svg.js` | `3.2.5` | `MIT` | Import-only package availability. |
| `echarts` | `6.1.0` | `Apache-2.0` | Import-only package availability. |
| `vega` | `6.2.0` | `BSD-3-Clause` | Import-only package availability. |
| `vega-lite` | `6.4.3` | `BSD-3-Clause` | Import-only package availability; Node engine metadata requires modern Node. |
| `@viz-js/viz` | `3.28.0` | `MIT` | Import-only package availability. |
| `satori` | `0.26.0` | `MPL-2.0` | Import-only package availability; license/security review remains required before production use. |
| `@resvg/resvg-js` | `2.6.2` | `MPL-2.0` | Package added, but local native import is `package_runtime_blocked` with `ERR_DLOPEN_FAILED`. |

## Audit Summary

The GD-8 install step reported five moderate audit findings. No dependency remediation or package replacement was applied in GD-8. A later package security review should decide whether the findings are acceptable, need override documentation, or need package changes.

## Security Boundaries

- Fixture generation: `none`
- Generated artifacts: `none`
- Tool execution: `none`
- Worker execution: `none`
- Provider/model calls: `none`
- Render/export: `none`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Google Cloud access: none
- Secret Manager access: none
- Public artifacts: none
- Signed URLs: none
- Production/beta unlock: none

Recommended next prompt: `Prompt GD-8A - Package Runtime Fixes`.

## GD-8A resvg Native Runtime Note

GD-8A keeps `@resvg/resvg-js@2.6.2` under runtime review. The package metadata remains `MPL-2.0`; no dependency replacement, dependency addition, or license approval is added by GD-8A.

- Local platform: `darwin/arm64`; Node: `24.14.0`
- Local native package present: `node_modules/@resvg/resvg-js-darwin-arm64`
- Lockfile optional native metadata present for Android, Darwin, Linux, and Windows packages
- Current local import error: `ERR_DLOPEN_FAILED`
- Current error class: `darwin_code_signature_native_binding_load_failure`
- Current classification after focused CI import evidence: `local_darwin_native_blocker`
- GD-8A production capability enabled: `none; AI Tools creative graphics resvg runtime review only`
- Generated/local fixture status: `generated_local_fixture_not_executed`
- Rasterization executed: none
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
