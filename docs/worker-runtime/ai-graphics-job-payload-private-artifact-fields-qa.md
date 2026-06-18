# AI Graphics Job Payload Private Artifact Fields QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

Private artifact fields are accepted with warnings. Future payloads must use
private artifact manifest refs and checksum refs such as
`<PRIVATE_ARTIFACT_MANIFEST_REF>` and `<CHECKSUM_REF>`.

| Requirement | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Private artifact manifest ref required | `accepted_with_warnings` | Public artifacts are not source of truth. | None |
| Checksum ref required | `accepted_with_warnings` | Future validation must enforce checksum placeholders. | None |
| Signed URL boundary preserved | `accepted_with_warnings` | Signed URLs remain blocked. | None |
