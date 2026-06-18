# AI Graphics Job Payload Schema Fixture QA

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

The docs-only JSON fixtures from PR #482 are accepted with warnings as inputs
for a later schema-validation approval lane:

- `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-shape.schema.json`
- `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json`
- `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.blocked.json`

The fixture QA requires placeholders only. The examples must contain no URLs, no
signed URLs, no public artifact refs, no raw prompt text, no secrets, no real
user data, no provider raw output, and no executable route/tool/worker/provider
instructions.

| Fixture area | QA result | Warning | Blocker |
| --- | --- | --- | --- |
| Schema fixture | `accepted_with_warnings` | Docs-only; schema validation not executed here. | None |
| Valid example | `accepted_with_warnings` | Placeholder-only example. | None |
| Blocked example | `accepted_with_warnings` | Placeholder-only blocked example. | None |
