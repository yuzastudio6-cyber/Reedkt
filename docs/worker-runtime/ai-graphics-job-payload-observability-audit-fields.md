# AI Graphics Job Payload Observability Audit Fields

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must include `observabilityAuditRef`, `sourceEvidenceRefs`, `decisionState`, `createdByWorkstream`, `blockedUseRefs`, and `validationOnlyFixtureRefs`.

Audit refs must cite PR #480, PR #478, PR #476, and PR #464 evidence and preserve the docs-only/no-write Supabase classification.
