# GPAC/MP4Box Worker Contract Review

The future GPAC/MP4Box worker lane may be planned only as an approved-snapshot worker contract. It must not execute raw chat, frontend requests, arbitrary paths, public URLs, signed URLs as source-of-truth, or unbounded media.

Required future worker inputs:
- `approvedSnapshotRef`
- `approvalRecordRef`
- `jobRef`
- `workerLeaseRef`
- `routeIdempotencyKey`
- `sourceSequenceMapRef`
- `compiledIntentRef`
- `modelRoutingPolicyRef`
- `qaPolicyRef`
- `privateInputManifestRef`
- `privateArtifactManifestRef`
- `privateArtifactChecksumRef`
- `toolRuntimePolicyRef`
- `gpacMp4boxWorkerContractRef`

Required future command scope:
- Generated or explicitly approved bounded fixture input only.
- Exact command templates declared before execution.
- Network disabled unless a later packet proves a specific approved private storage read path.
- No FFmpeg/FFprobe helper expansion in this Track A lane.
- No final render/export, delivery, or public artifact write.

Allowed future worker outputs:
- Sanitized manifest JSON.
- File names, byte counts, SHA-256 checksums, command exit codes, and bounded stdout/stderr snippets.
- QA report with pass/fail reasons and cleanup status.

Required future failure categories:
- `blocked_missing_approved_snapshot`
- `blocked_missing_private_input_manifest`
- `blocked_unapproved_media_source`
- `blocked_unapproved_command_template`
- `blocked_mp4box_runtime_failure`
- `blocked_artifact_manifest_mismatch`
- `blocked_cleanup_failure`
- `blocked_public_or_signed_artifact_attempt`

Current status: `worker_contract_review_passed_no_worker_execution`.
