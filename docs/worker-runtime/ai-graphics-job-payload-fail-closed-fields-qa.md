# AI Graphics Job Payload Fail-Closed Fields QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

Fail-closed fields are accepted with warnings. Future validation must reject
payloads that omit approved plan snapshot refs, scoped manifest refs, private
artifact refs, checksum refs, owner/capability/tool ids, placeholder
claim/lease refs, placeholder queue refs, no-execution assertions, or
observability/audit fields.

| Fail-closed condition | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Missing approved plan snapshot | `accepted_with_warnings` | Later schema validation must fail closed. | None |
| Missing scoped manifest | `accepted_with_warnings` | Later schema validation must fail closed. | None |
| Missing private artifact/checksum refs | `accepted_with_warnings` | Later schema validation must fail closed. | None |
| Runtime approval set true | `accepted_with_warnings` | Later schema validation must fail closed. | None |
| Unsafe artifact or signed URL source | `accepted_with_warnings` | Later schema validation must fail closed. | None |
