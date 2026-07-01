# Work Graph And Manifest Plan

The future integration packet must model worker execution as a bounded work-graph handoff, not as raw chat, broad route execution, or ad hoc shell execution.

Required future work item fields:

- `workItemId`
- `jobId`
- `idempotencyKey`
- `approvedSnapshotRef` or `generatedFixtureSourceEnvelope`
- `sourceRouteId`
- `sourceIdempotencyKey`
- `workerKind`
- `toolCommands`
- `expectedInputs`
- `expectedOutputs`
- `artifactManifestPath`
- `qaReportPath`
- `cleanupPolicy`
- `failureCategory`
- `retryPolicy`

Required future artifact manifest fields:

- report file name, byte count, and SHA-256
- manifest file name, byte count, and SHA-256
- generated fixture file names, byte counts, and SHA-256
- local-only artifact root
- no public URL
- no signed URL
- no GCS/private artifact access unless separately approved

The only accepted tool evidence for this planning packet is generated-fixture evidence from #2044/#2047. The future integration packet must preserve that boundary unless a later owner-approved private fixture packet expands it.

Product-ready end-to-end local OSS tools: `0`
