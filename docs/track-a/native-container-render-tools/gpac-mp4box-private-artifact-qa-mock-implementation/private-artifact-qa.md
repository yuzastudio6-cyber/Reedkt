# Private Artifact QA

QA id: `qa.gpacMp4box.privateArtifact.mock`.

QA mode: `private_artifact_qa_metadata_only`.

Required checks:
- `manifest_integrity`
- `checksum_references`
- `private_artifact_boundary`
- `cleanup_reference`
- `audit_reference`

The QA mock reviews metadata only. It does not read storage objects, create artifacts, run media tools, or execute workers/routes.
