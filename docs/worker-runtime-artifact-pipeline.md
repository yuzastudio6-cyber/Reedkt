# Worker Runtime Artifact Pipeline

Milestone 6 connected approved tool calls to worker runtime jobs and private output manifests that the editor can read. Milestone 10 adds a production persistence path for the same contract.

## What It Adds

- worker runtime job records for gateway-dispatched tool calls;
- claim/lease lifecycle metadata for completed or failed worker runs;
- idempotent replay by stable worker idempotency key;
- private output artifact records derived from Track B adapter result manifests;
- project-level output manifest merge and dedupe;
- service-role-only production persistence for worker runtime jobs and private output manifest rows;
- failure category and retry-policy recording;
- `GET /v1/projects/:projectId/tool-output-manifest?workspaceId=...` for editor readback.

## Boundary

The runtime artifact pipeline has two storage modes:

- Local/mock mode records job and manifest state in memory for deterministic smoke coverage.
- Non-mock production mode records job and manifest state through backend-owned Supabase tables: `production_worker_runtime_jobs` and `production_worker_runtime_artifacts`.

The pipeline still does not run tools, process media, upload artifacts, issue signed URLs, call providers, deploy workers, enable external beta, or enable production by itself.

The pipeline stores only private source-of-truth storage references. Signed URLs, public URLs, raw prompt fields, provider keys, service-role keys, and secret-like payloads remain blocked by the gateway, worker gates, artifact policy, and pipeline validation.

## Output Manifest Contract

Gateway dispatch returns:

- `gateway`: approved dispatch status and blockers;
- `trackBAdapterResult`: the adapter contract result when a Track B adapter is selected;
- `workerRuntimeArtifactPipeline`: the job, lease, retry decision, output artifacts, merged project manifest, and replay status;
- `workerResult`: the mock-safe worker dispatcher result.

The editor should read durable private outputs through the project manifest route. The returned artifact records are private references under:

```text
workspaces/<workspaceId>/projects/<projectId>/...
```

They are not downloadable URLs and must not be treated as public delivery artifacts. Production rows are backend/service-role only and are blocked if artifact paths look like signed URLs, raw URLs, tokens, secrets, API keys, or service-role material.

## Validation

Run:

```bash
npm run smoke:worker-runtime-artifact-pipeline
npm run smoke:production-worker-artifact-manifest-persistence:sql
npm run smoke:trackb-adapter-pack
npm run smoke:tool-execution-gateway
```

The worker runtime artifact smoke verifies job creation, lease release, idempotent replay without duplicate output artifacts, private project manifest readback, signed URL blocking, and retry-policy classification for transient failures. The SQL smoke verifies the production manifest migration, service-role-only grants, RLS, private path constraints, and signed/public artifact rejection without touching remote Supabase.
