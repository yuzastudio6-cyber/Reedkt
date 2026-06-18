# AI Graphics Job Payload Observability Audit Fields QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

Observability and audit fields are accepted with warnings as metadata-only
payload shape requirements.

| Requirement | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Source PR evidence refs | `accepted_with_warnings` | Later schema validation must enforce required refs. | None |
| Owner/capability/tool ids | `accepted_with_warnings` | IDs remain metadata-only. | None |
| Audit status fields | `accepted_with_warnings` | No service-role handler is approved. | None |
| Supabase docs-only classification | `accepted_with_warnings` | No Supabase mutation or SQL is approved. | None |

Supabase classification: `no write` / `docs_only`; environment touched: `none`; SQL executed: `none`; migration deployed: `no`; milestone sync: `not_performed`.
