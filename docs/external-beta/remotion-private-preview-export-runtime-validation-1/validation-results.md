# Validation Results

Packet: `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`

Decision: `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`

Execution: `completed_confirmation_gated_external_beta_generated_local_remotion_render`

Run status: `passed_external_beta_generated_local_private_preview_fixture`

Run ID: `2026-06-27T02-41-01-252Z-7ce79dc6`

Output directory: `/tmp/reeditpro-rp-external-beta-remotion-private-preview-export-runtime-validation-1/2026-06-27T02-41-01-252Z-7ce79dc6`

## Confirmed Run

- Confirmation: `REEDITPRO_CONFIRM_EXTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_RUNTIME_VALIDATION=true`
- Composition ID: `ReeditProExternalBetaGeneratedLocalPreview`
- Output file: `reeditpro-external-beta-generated-local-preview.mp4`
- Output bytes: `64855`
- Output SHA-256: `ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b`
- Manifest file: `manifest.json`
- Manifest bytes: `8357`
- Manifest SHA-256: `24675b34cb0bd3b1ff255dd29343ffce2e12d7d045070bf59fba3404db15356c`
- QA report file: `qa-report.json`
- QA report bytes: `884`
- QA report SHA-256: `847efc9202c556f394d17df16a6a9250513f4106c6b3ebe884a453caaa8e5879`
- Source file: `source/index.jsx`
- Source file bytes: `1398`
- Source file SHA-256: `883d9d335be350952f5e980781a025a7f6df3e9649868cb057f009ca7a790b29`

## Safety Readback

- Generated local fixture only: `true`
- User media input: `none`
- Private media input: `none`
- Storage object creation: `false`
- Storage object read: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Worker execution: `false`
- Route execution: `false`
- Provider/model call: `false`
- Remotion execution: `true`
- Remotion renderer media encoding: `true`
- Direct FFmpeg command execution by runner: `false`
- FFprobe execution: `false`
- Internal beta unlock: `false`
- External beta unlock: `false`
- Production unlock: `false`
- External product beta ready: `false`
- Product-ready end-to-end local OSS tools: `0`

## Validation Commands

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `REEDITPRO_CONFIRM_EXTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_RUNTIME_VALIDATION=true npm run rp-external-beta-remotion-private-preview-export-runtime-validation-1-confirmed`: `passed`
- `git diff --check`: `passed`
- `npm run --silent rp-external-beta-remotion-private-preview-export-runtime-validation-1:diagnostics`: `passed`
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file and staged safety scans: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`
