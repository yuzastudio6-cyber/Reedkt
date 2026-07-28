# Canonical Cloud Dispatch HTTP Receiver Boundary — 2026-07-27

Status:
`process_capability_mounted_http_adapter_verified_live_distribution_blocked`

## Outcome

ReEditPro now has the bounded HTTP adapter that was missing between the
canonical Cloud Tasks/Cloud Run identity verifier and the existing canonical
dispatch receiver state machine. The exact controller path already frozen in
every dispatch attempt plan is mounted:

- `POST /internal/v1/canonical-cloud-dispatch`

The same adapter also defines strict worker callbacks for:

- worker identity acceptance;
- durable attempt start;
- successful completion;
- pre-commit failure; and
- controller-authenticated timeout reconciliation.

The routes are absent unless `createReeditProApiApp` receives a genuine
process-created `CanonicalCloudDispatchHttpReceiverPort`. A JSON-shaped or
structured-cloned object cannot substitute for that capability.

## Security And Authority Boundary

Each request:

1. must fit a bounded strict schema with no unknown keys;
2. exposes only an opaque dispatch-intent ID to a server-injected resolver;
3. passes its `Authorization` header only to the resolved process-bound
   controller or worker identity verifier;
4. passes only the resulting non-serializable verified identity to the existing
   receiver service; and
5. returns a digest-bound acknowledgement containing receipt hashes, never the
   bearer token, media, prompt, path, signed URL, credential, or Cloud Run
   request body.

The adapter performs no Cloud Tasks creation, Cloud Run Jobs invocation, tool
execution, media processing, automatic retry, customer charging, or production
promotion. The default API application does not mount these routes.

## Focused Evidence

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` now proves:

- the exact controller URL from the immutable attempt plan reaches the existing
  receiver through HTTP;
- controller and worker redelivery return the same canonical receipt hashes;
- terminal completion replays through HTTP without a second queue result;
- unknown fields, wrong worker identity, and an unmetered attempt-start request
  fail closed;
- the failure and timeout paths enforce their strict request envelopes;
- acknowledgements contain no raw bearer token or operational material; and
- the route returns `404` when no process-created receiver capability was
  injected.

The same smoke continues to prove crash-consistent local queue/outbox terminal
reconciliation. The live Google verifier smoke remains zero-network because it
stubs the supported Google Auth Library method.

## Remaining Gates

This closes a source-level HTTP wiring gap. It does not prove:

- a live Google token, key-cache rotation, IAM, or deployed private audience;
- a distributed database transaction for queue, outbox, attempt-start, and
  terminal state;
- Cloud Tasks creation or Cloud Run Jobs execution;
- deployed worker-death observation;
- private object transport in deployed infrastructure;
- same-source production-image qualification; or
- external-beta or paid-production readiness.
