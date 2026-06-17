# AI Graphics Job Payload Plan Snapshot Fields

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must include `planSnapshotId`, `planSnapshotStatus`, `planSnapshotChecksumRef`, and `planSnapshotSourceRef` as placeholders that point to an approved plan snapshot.

Workers must execute approved snapshots, not raw chat. If `planSnapshotStatus` is not approved, the future payload must fail closed before worker execution, job claim, lease mutation, queue execution, route execution, or actual tool execution.
