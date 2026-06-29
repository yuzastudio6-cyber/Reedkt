# Private Artifact Manifest

Manifest id: `artifactManifest.gpacMp4box.private.mock`.

Manifest mode: `private_artifact_manifest_metadata_only`.

The manifest models future GPAC/MP4Box worker-temp private outputs without creating those outputs. It records only metadata expectations for generated private fixture output metadata.

Required entry fields:
- `entryId`
- `fileName`
- `artifactKind`
- `byteCount`
- `checksumSha256`
- `storageDisposition: worker_temp_private_only`
- `publicArtifact: false`
- `signedUrl: false`
- `committedToRepo: false`
- `mediaArtifact: false`

The manifest must include QA, cleanup, and audit references before any future QA mock can pass.
