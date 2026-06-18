# AI Graphics Job Payload Plan Snapshot Fields QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

Plan snapshot fields are accepted with warnings. Future payloads must carry a
placeholder approved plan snapshot reference such as
`<APPROVED_PLAN_SNAPSHOT_FIXTURE>` and must not derive worker instructions from
raw prompts.

| Requirement | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Approved plan snapshot reference required | `accepted_with_warnings` | Later schema validation must enforce the field. | None |
| Raw prompt execution blocked | `accepted_with_warnings` | Worker payloads must not consume raw prompts. | None |
| Execution boundary preserved | `accepted_with_warnings` | No worker execution is approved by this QA. | None |
