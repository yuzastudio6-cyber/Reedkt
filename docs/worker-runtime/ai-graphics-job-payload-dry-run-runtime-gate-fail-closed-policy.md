# AI Graphics Job Payload Dry-Run Runtime Gate Fail-Closed Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_ready_with_warnings`

Fail-closed policy result: `accepted_with_warnings`.

Future controlled/no-op worker gate evidence must block on missing plan snapshot refs, missing scoped manifest refs, missing private artifact/checksum refs, unsafe artifact scope, public URLs, signed URL source truth, raw prompts, provider raw output, real user media, true runtime booleans, executable instructions, or generic pass claims.
