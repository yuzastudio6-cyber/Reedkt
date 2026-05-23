# Staging Cloud Run / Remotion Canary

This gate is for the real staging render infrastructure canary only. It must not be treated as passed until the guarded GitHub Actions workflow dispatches against a dedicated private staging Cloud Run canary service and succeeds.

Current readiness status: the repo contains the fail-closed workflow, strict validator, private canary service scaffold, and tiny Remotion fixture. Live dispatch remains blocked unless the staging Cloud Run target, GitHub OIDC authentication, and canary output bucket/prefix are configured.

## Required Configuration

Configure these as GitHub environment secrets or variables for the staging workflow:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `STAGING_CLOUD_RUN_RENDER_CANARY_URL`
- `STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE`
- `STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX`

Optional only if the Remotion target is separate from the Cloud Run service:

- `STAGING_REMOTION_CANARY_URL`
- `STAGING_REMOTION_CANARY_AUDIENCE`

The legacy names `STAGING_RENDER_CANARY_CLOUD_RUN_URL` and `STAGING_RENDER_CANARY_CLOUD_RUN_AUDIENCE` are still accepted by the CLI for compatibility, but new workflow configuration should use `STAGING_CLOUD_RUN_RENDER_CANARY_URL` and `STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE`.

The deployed Cloud Run canary service must also receive service-side env that matches the guarded staging target:

- `STAGING_RENDER_CANARY_MODE=staging_cloud_run_remotion_canary`
- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-east1`
- `GOOGLE_CLOUD_PROJECT=reeditpro`
- `STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX=gs://reeditpro-staging-render-canary-smoke/previews`
- `STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX=.run.app`
- bounded timeout and artifact settings

The neutral project id `reeditpro` is allowed only when those dedicated staging canary controls are present. Production-looking project, bucket, service account, URL, provider, Stripe, payment, or billing env still fails closed.

## Authentication And IAM

Use GitHub Actions OIDC / Workload Identity Federation. Do not add service account key JSON unless Workload Identity Federation is impossible and a separate security review approves it.

The workflow requires:

```yaml
permissions:
  contents: read
  id-token: write
```

The GitHub caller service account must have `roles/run.invoker` scoped only to the dedicated staging canary Cloud Run service. Do not grant project-wide or production Cloud Run invocation for this gate.

The Cloud Run runtime service account should have only the minimum storage access needed to create, read, and delete objects under the dedicated staging canary bucket/prefix.

## Guard Behavior

The guard fails closed for:

- missing Cloud Run URL or audience
- missing GitHub OIDC metadata or ID token
- non-HTTPS or localhost URLs in live mode
- production-looking project IDs, service accounts, URLs, audiences, or buckets
- configured Stripe, payment, billing, or provider-generation env
- `cleanup=false`
- missing `allow_writes`, `allow_render_execution`, `allow_cloud_run`, or `allow_remotion`
- unbounded wait, timeout, retry, resolution, frame count, or concurrency settings
- missing previous-smoke leftover checks in the strict live workflow

The canary payload is fixed to a tiny synthetic render: `tiny-muted-3s`, 160x90, 15 fps, cleanup required. It must not include user media, provider prompts, payment data, production IDs, broad queue modes, or existing job IDs.

## Preflight

Local disabled-mode preflight:

```powershell
npm.cmd run smoke:e2e:render-infrastructure-canary:preflight
```

Live preflight in Actions runs only after OIDC authentication has produced an ID token:

```bash
npm run smoke:e2e:render-infrastructure-canary:preflight -- --live
```

Preflight performs guard/config validation only. It does not invoke Cloud Run, does not run Remotion, does not create smoke DB records, and does not write storage artifacts.

## Live Dispatch Conditions

Dispatch `RP E2E Staging Cloud Run Remotion Render Infrastructure Canary` only when all of these are true:

- the dedicated private staging Cloud Run canary service exists
- the Cloud Run URL and audience are configured with staging/canary names
- GitHub OIDC / Workload Identity Federation is configured
- `roles/run.invoker` is scoped to the single staging canary service
- the output bucket/prefix is staging/canary/smoke scoped
- prior smoke run leftover checks are clean
- all required workflow inputs are explicitly true: `allow_writes`, `allow_render_execution`, `allow_cloud_run`, `allow_remotion`, and `cleanup`
- no provider, Stripe, payment, production, broad E2E, or queue-drain path is enabled

If any condition is false, do not dispatch the live workflow. Report the exact blocker instead.

## Cleanup Expectations

The strict live workflow must clean up all smoke-tagged staging DB records and the canary output artifact. It must then run exact leftover detection and fail if any record, storage object, or query error remains.
