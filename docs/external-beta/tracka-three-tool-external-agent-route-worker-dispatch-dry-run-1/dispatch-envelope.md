# Three-Tool Route-Worker Dispatch Envelope

Dispatch mode: `metadata_only_route_worker_dispatch_dry_run`

The dispatch dry run validates:
- approved snapshot references;
- approval and no-spend policy references;
- route idempotency keys;
- job and worker lease references;
- child route paths;
- command-template allowlists;
- output manifest and QA report schema references;
- cleanup, retention, and failure policy references.

Child route paths:
- `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- `/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute`

Raw command strings allowed: `false`.

Route handler invocation in this dispatch dry run: `false`.

Worker dispatch in this dispatch dry run: `false`.

Persistent job queue write in this dispatch dry run: `false`.

Tool execution in this dispatch dry run: `false`.
