# AI Graphics Job Payload No-Execution Fields QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

No-execution fields are accepted with warnings. The payload shape must keep all
runtime approvals false and must make the no-execution boundary explicit.

| Boundary | QA result | Required value |
| --- | --- | --- |
| worker execution | `accepted_with_warnings` | `false` |
| job claim | `accepted_with_warnings` | `false` |
| lease mutation | `accepted_with_warnings` | `false` |
| queue execution | `accepted_with_warnings` | `false` |
| route execution | `accepted_with_warnings` | `false` |
| actual tool execution | `accepted_with_warnings` | `false` |
| provider runtime | `accepted_with_warnings` | `false` |
| browser/WebGL/canvas runtime | `accepted_with_warnings` | `false` |
| Supabase/GCS/public/signed URL/beta/production | `accepted_with_warnings` | `false` |

The QA confirms that gate-status readiness does not set `dryRunPassedClaimed`
or `generatedLocalFixturePassedClaimed`.
