# Integration Envelope

The guarded runner creates a sanitized local envelope that carries accepted generated-fixture runtime evidence toward a future route/worker integration milestone.

Required envelope fields:

- `routeSourceId`
- `sourceIdempotencyKey`
- `jobId`
- `workerLeaseReference`
- `queueItemReference`
- `sourceEnvelope`
- `artifact manifest`
- `QA report`
- `cleanup policy`

Accepted source class: `generated_fixture_only_narrow_controlled_worker_runtime_source`

Route-worker integration mode: `metadata_only_source_envelope_for_future_route_worker_runtime_integration`

Worker lease state: `not_claimed`

Queue state: `not_written`

Public artifacts: `false`

Signed URLs: `false`

Final render/export: `false`

Product-ready end-to-end local OSS tools: `0`
