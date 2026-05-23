# Staging Cloud Run / Remotion Canary

This gate is for the real staging render infrastructure canary only. It is now passed for the recorded staging workflow run below. Future reruns must still use the same guarded manual workflow and fail-closed controls.

Current readiness status: passed as a staging-only infrastructure gate. This does not enable production rendering, provider execution, Stripe/payment flows, customer media, broad E2E suites, or queue draining.

## Passed Gate Record

- Workflow: `RP E2E Staging Cloud Run Remotion Render Infrastructure Canary`
- Run ID: `26321096931`
- Head SHA: `915b110548cac27cdaffdbffb17bdfa54a724a01`
- Smoke run ID: `rp-e2e-smoke-299243de-9589-4f4a-9d02-5d1ca5fd4b35`
- Result: `PASS`
- Render status: `preview_ready`
- Cloud Run path: `/canary/render`
- Remotion path: `renderMedia / bundle / selectComposition`
- Output artifact: `video/mp4`, `22,708` bytes, `3s`, `160x90`, `15fps`, `45` frames
- Cleanup deleted count: `26`
- Cleanup errors: `[]`
- Leftover records: `[]`
- Leftover query errors: `[]`

## Next Gate

The next safe manual gate is the staging provider sandbox gate. It must remain disabled by default and limited to a single provider and a single smoke-tagged job only.

Required next-gate boundaries:

- explicit manual allow flags before any provider sandbox execution
- staging-only configuration and smoke-tagged staging data
- one bounded provider request path, not a broad provider suite
- no Stripe, payment, billing, production, customer media, broad E2E, queue drain, or existing user job processing
- cleanup and strict leftover detection required before the gate can pass

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
- `STAGING_RENDER_CANARY_TIMEOUT_SECONDS=300`
- `STAGING_RENDER_CANARY_MEMORY=2Gi`
- `STAGING_RENDER_CANARY_CPU=2`
- `STAGING_RENDER_CANARY_CONCURRENCY=1`
- `NODE_OPTIONS=--max-old-space-size=1536`
- bounded artifact settings

The neutral project id `reeditpro` is allowed only when those dedicated staging canary controls are present. Production-looking project, bucket, service account, URL, provider, Stripe, payment, or billing env still fails closed.

The 2Gi/2CPU profile is used only because the tiny Remotion canary needs enough Node heap for bundling/render runtime inside Cloud Run. It is not production renderer sizing, and the guard still rejects broad queue processing, customer media, provider calls, Stripe/payment flows, and production-looking resources.

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
- missing or non-bounded Cloud Run canary resource settings: memory must be `2Gi`, CPU `2`, concurrency `1`, and Node heap `--max-old-space-size=1536`
- missing previous-smoke leftover checks in the strict live workflow

The canary payload is fixed to a tiny synthetic render: `tiny-muted-3s`, 160x90, 15 fps, cleanup required. It must not include user media, provider prompts, payment data, production IDs, broad queue modes, or existing job IDs.

The deployed service also exposes `GET /canary/health` for a sanitized runtime summary. It reports only non-secret resource and mode fields and must not be used to execute rendering.

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

## Manual Authenticated Probe

After redeploying the canary image, run a single authenticated probe before dispatching the GitHub workflow. Use a JSON payload file, not inline shell JSON:

```bash
CANARY_AUDIENCE="https://reeditpro-staging-render-canary-4wkjiqvdqa-ue.a.run.app"
CANARY_URL="${CANARY_AUDIENCE}/canary/render"
TOKEN="$(gcloud auth print-identity-token --audiences="${CANARY_AUDIENCE}")"

curl -sS \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @scripts/render/staging-cloud-run-remotion-canary/payloads/tiny-muted-3s-canary.json \
  "${CANARY_URL}"
```

Copy the payload file and replace only the copy's `smokeRunId` with a fresh smoke id for a real probe. Do not print the token, use service account JSON keys, include provider prompts, include Stripe/payment fields, include user media, or process existing queues.

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
