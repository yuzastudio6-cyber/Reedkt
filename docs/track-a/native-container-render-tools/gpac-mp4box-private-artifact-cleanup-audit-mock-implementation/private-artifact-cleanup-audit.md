# Private Artifact Cleanup/Audit

Cleanup/audit id: `cleanupAudit.gpacMp4box.privateArtifact.mock`.

Cleanup/audit mode: `private_artifact_cleanup_audit_metadata_only`.

The cleanup/audit mock reviews metadata from the QA mock only. It requires a private-temp cleanup policy, metadata-only audit reference, ephemeral retention policy, and planned residue check policy.

Required checks:
- `private_artifact_qa_valid`
- `cleanup_reference_present`
- `cleanup_policy_worker_temp_private_only`
- `audit_reference_present`
- `retention_policy_ephemeral_worker_temp_only`
- `residue_policy_storage_residue_not_allowed`

The cleanup/audit mock does not read storage objects, delete storage objects, create artifacts, run media tools, or execute workers/routes.
