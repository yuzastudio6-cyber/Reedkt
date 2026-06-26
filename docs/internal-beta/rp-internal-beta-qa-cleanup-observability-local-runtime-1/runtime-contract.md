# Runtime Contract

`server/services/internal-beta-qa-cleanup-observability-local-runtime.ts` creates deterministic local metadata for:

- QA checks over approved-snapshot, credit, job, artifact, private preview/export, safety, cleanup, observability, and rollback gates.
- Cleanup policies for private artifacts.
- Local observability events.
- Rollback readiness metadata.

The runtime requires:

- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `jobId`
- `artifactManifestId`
- `renderRequestId`
- `idempotencyKey`
- at least one QA check
- at least one cleanup policy
- at least one observability event

It rejects raw prompts, signed/public URL fields, service-role fields, token/secret fields, provider secret fields, media bytes, rendered bytes, and path-like cleanup file names.

Created status: `local_qa_cleanup_observability_validated_no_remote_execution`

Invalid input blocker: `blocked_invalid_qa_cleanup_observability_input`

This contract records local metadata only. It does not execute QA media inspection, cleanup, rollback, remote observability writes, storage reads/writes/deletes, routes, workers, providers, Remotion, FFmpeg, FFprobe, SQL, or Supabase.
