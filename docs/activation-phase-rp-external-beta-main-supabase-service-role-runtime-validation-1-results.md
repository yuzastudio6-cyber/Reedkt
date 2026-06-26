# RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1 Results

Decision: `completed_main_supabase_service_role_runtime_grant_boundary_validation`

Execution: `completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Grant hardening migration: `20260626233000_external_beta_public_grant_hardening.sql`

Run ID: `2026-06-26T23-41-52-998Z-818c6ba1`

Output directory: `/tmp/reeditpro-rp-external-beta-main-supabase-service-role-runtime-validation-1/2026-06-26T23-41-52-998Z-818c6ba1`

## Validation

- Final dry-run: `Remote database is up to date.`
- Public/worker runtime lint: `passed_no_warnings`
- Storage lint readback: `completed_with_managed_storage_warnings_allowed`
- Unsafe public mutation grants: `0`
- Unsafe public sequence grants: `0`
- Protected runtime table service-role write capability: `passed`
- Protected runtime table public mutation absence: `passed`

## Source Validation

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run --silent rp-external-beta-main-supabase-service-role-runtime-validation-1:diagnostics`: `passed`
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- changed-file and staged safety scans: `passed`

## Artifact Checksums

- Report: `b0de58258882c2bbe0a7296c58ab3fc44b2f8eb645befe91bdd38adde55a83de`
- Manifest: `cc7e3b894c2c0fb13fcb2dd0a23da27cccfeab952dc6b2ffcecd0d75b7ed5647`
- Grant validation: `0b418d7e2943fcb0ae2665571f552a41b240e898f402e19e1f201e85cd543b36`

## Status

Product-ready end-to-end local OSS tools: `0`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Next milestone: `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-GUARDED-REMOTE-WRITE-1`

## Safety

No Supabase production mutation, service-role HTTP route execution, service-role secret payload access, frontend service-role credential exposure, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, storage object creation, storage object read, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled. Remote Supabase mutation was limited to guarded public grant hardening migration apply on the single main Reeditpro staging project `wmyyttnynmteqgcdishd`.
