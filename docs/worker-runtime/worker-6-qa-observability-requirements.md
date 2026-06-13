# WORKER-6 QA And Observability Requirements

requirementsState: `ready_with_warnings_for_worker_7`

## Required WORKER-7 Evidence

- controlled no-op evidence for all seven worker fixture rows
- no worker runtime import proof
- no route handler import proof
- no tool runtime import proof
- no job claim proof
- no worker lease mutation proof
- no queue execution proof
- no route/tool runtime proof
- no provider runtime proof
- no Supabase mutation proof
- no storage transfer proof
- no signed URL proof
- no public artifact proof
- checksum/provenance summary
- QA evidence summary
- observability/audit evidence summary
- cleanup evidence summary
- warning/blocker evidence

## Logging And Redaction

WORKER-7 evidence must use synthetic placeholder identifiers only. Logs must not include raw prompts, secret payloads, private URLs, signed URLs, real user media, provider responses, Supabase credentials, or service-role tokens.

Correlation IDs may use `<WORKER_7_RUN_ID>`, fixture IDs, approved plan snapshot fixture refs, scoped tool-call manifest refs, and worker job payload fixture refs.
