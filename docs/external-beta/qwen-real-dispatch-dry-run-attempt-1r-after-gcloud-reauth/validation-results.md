# QWEN Real Dispatch Dry-Run Attempt 1R Validation Results

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1R-AFTER-GCLOUD-REAUTH`

Decision: `completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback`

Execution: `completed_authenticated_transport_metadata_readback_no_runtime_invocation`

Run ID: `2026-06-30T02-20-45-545Z-8324b215`

Output directory: `/tmp/reeditpro-rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/2026-06-30T02-20-45-545Z-8324b215`

## Local Evidence

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-report.json` | 4708 | `36822f5f6a9561f0335ef0c0d2d45811f190b61869d6949953bed8a2315d56fd` |
| `qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-manifest.json` | 768 | `bdbdd324bcb7370974fe6851e3e53f1b394a66056f7a74428defdeb190cba206` |
| `qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-checksums.json` | 1190 | `aebb80d3c1128be503cad1cf84673bd90f0f97b63be8498d5c55920ef51ebac5` |

## Validation Commands

- `REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH=true npm run rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth`
- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-qwen-real-dispatch-dry-run-attempt-1:diagnostics`
- `npm run --silent rp-external-beta-qwen-transport-dependency-preflight-current-1:diagnostics`
- `npm run --silent rp-external-beta-single-tester-real-usage-qa-1:diagnostics`
- `npm run --silent rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
