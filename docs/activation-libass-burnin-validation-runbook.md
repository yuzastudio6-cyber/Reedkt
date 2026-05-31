# Phase 45A Libass Burn-In Validation Runbook

Phase 45A validates FFmpeg/libass caption burn-in on a bounded private preview
sample. It uses only the approved Phase 32 private export and the existing Phase
28 ASS caption sidecar.

Execution requires:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION=true`

Run:

```sh
npm run smoke:activation-libass-burnin-validation
npm run activation:libass-burnin-validation:report
npm run activation:libass-burnin-validation:iam-plan
GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION=true npm run activation:libass-burnin-validation -- --execute
```

The runner builds and pushes the dedicated CPU validation image, deploys
`reeditpro-staging-libass-burnin-validation-job`, executes one bounded preview,
and fetches the private report.

Do not create final delivery, public URLs, Revideo output, provider calls, Track
B tool output, production unlocks, or broad-media access.
