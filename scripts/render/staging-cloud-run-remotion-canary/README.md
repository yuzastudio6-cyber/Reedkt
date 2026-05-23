# Staging Cloud Run Remotion Canary Service

This folder contains the deployment scaffold for the dedicated staging-only render infrastructure canary service.

The service exposes only `POST /canary/render`. It is meant to be private Cloud Run, invoked by GitHub Actions through Workload Identity Federation and a Google-signed ID token. The caller service account should have `roles/run.invoker` only on this staging canary service.

The canary renders a synthetic 3 second, 160x90, 15 fps, muted Remotion composition, uploads the tiny artifact to a staging canary bucket/prefix, verifies it, deletes it, verifies deletion, and returns a sanitized summary. It does not call Stripe, payment flows, external providers, production URLs, broad queues, or user media.

## Build

```bash
npm run build:staging-render-canary
docker build -f scripts/render/staging-cloud-run-remotion-canary/Dockerfile -t REGION-docker.pkg.dev/STAGING_PROJECT/REPO/reeditpro-staging-render-canary:TAG .
```

## Deploy

Use `deploy-staging-cloud-run-service.example.sh` only from an authenticated staging GCP context:

```bash
ALLOW_STAGING_CANARY_DEPLOY=true \
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-east1 \
GOOGLE_CLOUD_PROJECT=reeditpro \
STAGING_RENDER_CANARY_SERVICE_NAME=reeditpro-staging-render-canary \
STAGING_RENDER_CANARY_IMAGE=REGION-docker.pkg.dev/reeditpro/REPO/reeditpro-staging-render-canary:TAG \
STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX=gs://reeditpro-staging-render-canary-smoke/previews \
STAGING_RENDER_CANARY_RUNTIME_SERVICE_ACCOUNT=sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com \
STAGING_RENDER_CANARY_MEMORY=2Gi \
STAGING_RENDER_CANARY_CPU=2 \
STAGING_RENDER_CANARY_CONCURRENCY=1 \
STAGING_RENDER_CANARY_NODE_OPTIONS=--max-old-space-size=1536 \
bash scripts/render/staging-cloud-run-remotion-canary/deploy-staging-cloud-run-service.example.sh
```

The script deploys only the service definition. It does not execute the canary workflow.
The neutral staging project id `reeditpro` is accepted only with the dedicated staging canary service name, `us-east1` region, matching `GOOGLE_CLOUD_PROJECT`, `.run.app` host suffix, and the staging canary smoke bucket/prefix.

The canary service is intentionally pinned to a small Remotion-safe resource profile: 2Gi memory, 2 CPU, concurrency 1, max instances 1, Cloud Run timeout 300 seconds, and `NODE_OPTIONS=--max-old-space-size=1536`. This is staging-only canary sizing for Remotion bundling/render execution, not production renderer sizing. The script rejects larger, broader, or production-looking settings.

After deploy, `GET /canary/health` returns a sanitized runtime summary with the canary mode, resource profile, timeout, and whether `NODE_OPTIONS` is present. It does not report secrets.

## Manual Authenticated Canary Probe

Use a JSON payload file rather than inline shell JSON so the request stays inspectable and shell quoting cannot mutate the safety flags. The checked-in example payload is `payloads/tiny-muted-3s-canary.json`; copy it and replace only the copy's `smokeRunId` with a fresh smoke id before a live probe.

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

Do not print the token, do not use service account JSON keys, and do not add provider, Stripe, production, queue, user-media, or customer-job fields to this payload.
