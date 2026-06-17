# AI Graphics Job Payload Private Artifact Fields

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must include `privateArtifactManifestRef`, `privateArtifactScope`, `privateArtifactPathPlaceholder`, and `checksumRef`.

The artifact source of truth is a private manifest and checksum placeholder. Public artifacts and signed URLs are not source of truth and remain unapproved.
