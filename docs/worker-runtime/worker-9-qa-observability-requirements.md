# WORKER-9 QA And Observability Requirements

requirementsState: `ready_with_warnings_for_worker_10`

## QA Requirements

- Confirm all seven worker fixture rows are present.
- Confirm each fixture preserves placeholder approved plan snapshot, scoped tool-call manifest, worker job, idempotency, private artifact, checksum, QA, observability, and cleanup refs.
- Confirm controlled claim/lease evidence is derived from fixture placeholders only.
- Confirm live worker execution, real job claim, worker lease mutation, queue execution, route execution, tool execution, provider/model runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, raw prompt execution, beta, and production remain blocked.
- Confirm the WORKER-10 output, if later approved, is local ignored evidence only.

## Observability Requirements

- Record deterministic fixture IDs and placeholder refs.
- Record claim/lease no-op validation counts.
- Record blocked-use validation counts.
- Record checksum/provenance summary for committed fixture input.
- Record cleanup evidence for ignored local outputs.
- Record no Supabase, SQL, GCP, Secret Manager, provider, model, route, tool, worker runtime, queue, media/audio, Docker/Cloud Run, storage, signed URL, public artifact, deployment, beta, or production action.

## Warning Conditions Carried Forward

- PR #410 is draft/open/mergeable clean with an empty check rollup.
- The route and worker stack remains draft-heavy.
- PR #366 remains historical conflict-risk context.
- WORKER-10 will still be a controlled no-op gate, not live worker execution.
