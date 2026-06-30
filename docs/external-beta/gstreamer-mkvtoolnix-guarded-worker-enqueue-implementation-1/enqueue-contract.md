# Guarded Worker Enqueue Contract

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1`

Decision: `completed_gstreamer_mkvtoolnix_guarded_worker_enqueue_contract_ready_for_worker_skeleton_plan`

Execution: `completed_mock_queue_contract_no_worker_dispatch_or_tool_execution`

Enqueue mode: `mock_queue_contract_only`

Enqueue status: `queued_mock_contract_only`

Next required gate: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1`

## Required Input

The enqueue input must consume a valid `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1` route request. The route request must already prove:

- backend-service-role-only route context;
- approved plan snapshot;
- approval record;
- credit/no-spend policy;
- job reference;
- disabled worker lease;
- route idempotency key;
- command-template allowlist;
- private input manifest;
- expected output manifest schema;
- expected QA report schema;
- cleanup, retention, failure, and audit references.

## Sanitized Queue Payload

The mock queue payload may contain only sanitized identifiers and booleans:

- route ID and path;
- workspace and project IDs;
- approved snapshot, approval record, credit policy, job, worker lease, idempotency, command-template, manifest, QA, cleanup, retention, failure, and audit IDs;
- `routeExecution: false`;
- `workerDispatchAttempted: false`;
- `workerExecution: false`;
- `gstreamerExecution: false`;
- `mkvtoolnixExecution: false`;
- `mediaProcessing: false`;
- `signedUrlCreation: false`;
- `publicArtifactCreation: false`;
- `finalRenderExport: false`.

No secret, token, password, service-role payload, raw command, raw chat, private media bytes, media file path, signed URL, public artifact URL, provider prompt, or model payload is allowed.

## Runtime Boundary

This milestone creates a mock queue item only. It does not dispatch the queue item to a worker and does not execute a route, worker, GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, Supabase, SQL, media processing, signed/public artifact flow, or final delivery/export.
