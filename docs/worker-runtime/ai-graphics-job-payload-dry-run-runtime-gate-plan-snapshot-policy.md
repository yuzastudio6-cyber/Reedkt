# AI Graphics Job Payload Dry-Run Runtime Gate Plan Snapshot Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_ready_with_warnings`

Plan snapshot policy result: `accepted_with_warnings`.

Future controlled/no-op worker gate evidence must require `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` and must reject raw prompt payloads, unapproved snapshots, missing snapshot ids, public URLs, signed URLs as source of truth, provider raw outputs, and real user media.
