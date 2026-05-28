# Activation Artifact Image Manifest Policy

The Phase 23B manifest maps Phase 20B local non-GPU images to staging Artifact
Registry names.

Required target repository:

`us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers`

Required non-GPU targets:

- `reeditpro-staging-api`
- `reeditpro-staging-tool-readiness-worker`
- `reeditpro-staging-cpu-worker`
- `reeditpro-staging-qa-worker`
- `reeditpro-staging-render-worker`

`reeditpro-staging-gpu-worker` is deferred and must not be pushed in Phase 23B.

Image tags must be explicit and must not be empty, `latest`, `prod`,
`production`, `manual-not-set`, or contain shell metacharacters.
