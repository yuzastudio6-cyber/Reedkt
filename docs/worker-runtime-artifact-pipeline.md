# Worker Runtime Artifact Pipeline

Milestone 6 connects approved tool calls to mock-safe worker runtime jobs and private output manifests that the editor can read.

## What It Adds

- worker runtime job records for gateway-dispatched tool calls;
- claim/lease lifecycle metadata for completed or failed worker runs;
- idempotent replay by stable worker idempotency key;
- private output artifact records derived from Track B adapter result manifests;
- project-level output manifest merge and dedupe;
- failure category and retry-policy recording;
- `GET /v1/projects/:projectId/tool-output-manifest?workspaceId=...` for editor readback.

## Boundary

The runtime artifact pipeline is still mock-safe. It does not run tools, process media, write Supabase, upload artifacts, issue signed URLs, call providers, deploy workers, enable external beta, or enable production.

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

They are not downloadable URLs and must not be treated as public delivery artifacts.

## Validation

Run:

```bash
npm run smoke:worker-runtime-artifact-pipeline
npm run smoke:trackb-adapter-pack
npm run smoke:tool-execution-gateway
```

The worker runtime artifact smoke verifies job creation, lease release, idempotent replay without duplicate output artifacts, private project manifest readback, signed URL blocking, and retry-policy classification for transient failures.
