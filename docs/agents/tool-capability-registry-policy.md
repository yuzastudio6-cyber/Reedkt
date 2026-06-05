# Tool Capability Registry Policy

Phase 52B stores capability metadata and private artifact references only.

Allowed:

- Build deterministic registry records from committed Phase 52A ownership architecture.
- Upload private JSON artifacts to staging GCS.
- Upsert milestone-registry metadata through the Phase 51B/51D server-only Supabase path.
- Read back the Phase 52B activation run, `tool_capabilities`, and readiness snapshot.

Blocked:

- Tool runtime execution.
- AI model inference.
- Media processing.
- Web search or browser capture.
- Map rendering or tile access.
- Provider calls.
- Docker, Cloud Run, migrations, schema/RLS changes, and historical backfill.
- Production, external beta, paid production, broad media, public artifacts, signed URLs as source of truth, and raw prompt execution.

Supabase stores structured metadata and private `gs://` references only. GCS remains the private artifact store.
