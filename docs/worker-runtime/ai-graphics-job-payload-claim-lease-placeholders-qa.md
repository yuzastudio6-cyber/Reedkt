# AI Graphics Job Payload Claim Lease Placeholders QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

Claim/lease placeholders are accepted with warnings. The QA accepts placeholder
fields only and explicitly preserves the no-claim/no-lease boundary.

| Requirement | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Worker job ref placeholder | `accepted_with_warnings` | No real job claim is approved. | None |
| Claim placeholder ref | `accepted_with_warnings` | Claim refs are shape-only. | None |
| Lease placeholder ref | `accepted_with_warnings` | No lease mutation is approved. | None |

`workerJobClaimApprovedNow` remains `false` and
`workerLeaseMutationApprovedNow` remains `false`.
