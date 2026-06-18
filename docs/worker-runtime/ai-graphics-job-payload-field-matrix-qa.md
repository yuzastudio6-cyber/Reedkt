# AI Graphics Job Payload Field Matrix QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

| Field group | Required status | QA result | Warning | Blocker |
| --- | --- | --- | --- | --- |
| Job payload envelope | Placeholder-only metadata shape | `accepted_with_warnings` | No worker execution is approved. | None |
| Approved plan snapshot fields | Required | `accepted_with_warnings` | Must be validated by a later schema-validation lane. | None |
| Scoped manifest fields | Required | `accepted_with_warnings` | Manifest intake remains metadata-only. | None |
| Private artifact fields | Required | `accepted_with_warnings` | Public artifacts and signed URLs are not source of truth. | None |
| Claim/lease placeholders | Placeholder only | `accepted_with_warnings` | No job claim or lease mutation is approved. | None |
| Queue placeholders | Placeholder only | `accepted_with_warnings` | No queue execution is approved. | None |
| No-execution fields | Required | `accepted_with_warnings` | Must remain false for runtime approvals. | None |
| Observability/audit fields | Required | `accepted_with_warnings` | Audit shape is metadata-only. | None |
| Fail-closed fields | Required | `accepted_with_warnings` | Later validation must reject out-of-scope payloads. | None |

The field matrix QA accepts PR #482 field coverage with warnings and recommends
schema-validation approval next.
