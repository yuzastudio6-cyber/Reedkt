# AI Graphics Job Payload Scoped Manifest Fields QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

Scoped manifest fields are accepted with warnings. Future Worker Runtime payloads
must require a scoped tool-call manifest reference such as
`<SCOPED_TOOL_CALL_MANIFEST_REF>` and must fail closed outside the approved AI
graphics metadata capabilities.

| Requirement | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Scoped tool-call manifest required | `accepted_with_warnings` | Future schema validation must enforce the placeholder field. | None |
| Capability-scoped intake | `accepted_with_warnings` | Actual tool execution remains blocked. | None |
| Route boundary preserved | `accepted_with_warnings` | No route execution is approved. | None |
