# Validation Command Plan

No-runtime validation:

- `npm run reeditpro:deployment-rollback-readiness-plan:diagnostics`
- `npm run reeditpro:external-beta-production-readiness-remediation-plan:diagnostics`
- `npm run trackb-media-oss:external-beta-production-readiness-gap-review:diagnostics`
- `npm run trackb-media-oss:product-beta-tools-call-lane-ready-handoff:diagnostics`
- `npm run trackb-media-oss:product-beta-runtime-product-ready-closeout:diagnostics`
- `npm run trackb-media-oss:final-rollup:diagnostics`
- `git diff --check`
- `git diff --cached --check`

No install, Docker, deployment, rollback, `gcloud`, Supabase/GCS, external beta, or production command is authorized.
