# Worker Artifact Scope Policy

WORKER-0 artifact scope status: `passed`

Private GCS refs only: `true`

Public artifacts allowed: `false`

Signed URLs source of truth: `false`

Generated prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-worker-runtime/worker0/worker0-20260612T191022/`

QA prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-worker-runtime/worker0/worker0-20260612T191022/`

Worker Runtime evidence must use private `gs://` refs and sanitized JSON. Signed URLs may not become source of truth, and public artifacts are not allowed in WORKER-0 or WORKER-1 dry-run scope.
