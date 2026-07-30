# Canonical Living Frame preapproval reasoning attempt reservation

## Status

This boundary reserves the exact first Living Frame reasoning attempt after the
server has prepared and persisted the complete semantic request. It is a
private, server-owned, single-host restart-safety record. It does not create a
provider request, issue one-use submission authority, read credentials, call a
provider, meter an attempt, or release a reasoning result.

## Why reservation is separate from execution

The prepared run already binds the current Living Frame input, source-visual
and source-speech evidence, complete provider-neutral payload, strict output
schema, route-data assurance, Kimi/Terra/DeepSeek route, rate card, and internal
budget. A transport worker must not infer an attempt from that packet or
silently treat its idempotency digest as submission permission.

The reservation therefore creates an explicit control-plane record for exactly
one first-route candidate:

- route `kimi_k3_primary`;
- model `kimi-k3`;
- attempt ordinal `1`;
- the prepared run and provider-envelope digests;
- the complete provider-neutral payload digest;
- the route-data assurance and decision-set digests;
- the strict output-schema digest;
- the workload and internal-budget digests; and
- the existing submission idempotency digest.

The caller cannot choose or supply any of those values. The strict request
contains only the server-owned prepared-run locator and the existing semantic
admission request. The service rereads the prepared run, rebuilds the current
semantic admission, writes the reservation, rereads it twice, then repeats the
source reads and rejects any race.

## Deliberately withheld state

The reservation records all of the following literally:

- submission authority is `not_issued`;
- provider submission count is `0`;
- no provider-request record or provider-request ID exists;
- a provider call cannot have occurred;
- no provider observation or checkback exists;
- fallback is not authorized;
- no attempt cost has been incurred or recorded;
- automatic retry has not started; and
- raw request, raw response, credentials, signed URLs, and local paths are not
  persisted.

This distinction matters: the record has controlled attempt-reservation
authority, but it has no provider-request reservation, execution-attempt,
transport, credential, observation, checkback, fallback, cost, result, or
promotion authority.

## Persistence boundary

The private repository uses a tenant-scoped cooperative lock, create-only
content-addressed versions, and a checksum-protected atomic current pointer.
Every read revalidates the record digest, locator, owner, workspace, run,
attempt, revision, and envelope checksum.

This is restart-safe for one backend host. It is not a distributed database
transaction, multi-replica lease, queue, checkback system, webhook receiver, or
unknown-provider-outcome reconciliation authority. The later distributed
lifecycle must preserve one-use submission, exact durable-response replay,
append-only observations, terminal attempt-and-cost atomicity, and fail-closed
unknown-outcome reconciliation before transport can be enabled.

## Closed authorities

The reservation cannot create customer price or credits, an approval,
immutable snapshot, work graph, queue entry, tool route, provider request,
artifact, selected scene, MasterTiming or SoundSync decision, renderer,
private review, export, runtime, or production authority.

GPU-heavy model work remains restricted to qualified Google Cloud Run GPU
workers. This reservation performs no inference and provides no CPU fallback
for a future heavy-model route.

## Verification

The focused lifecycle smoke proves:

- exact prepared-run, payload, evidence, assurance, route, schema, workload,
  and budget lineage;
- create-only persistence, restart reread, and exact idempotent replay;
- cross-owner repository isolation;
- checksum-corrupted pointer rejection;
- strict rejection of caller-selected attempt, route, provider, credential,
  submission, checkback, fallback, cost, work, queue, and runtime fields;
- rejection of a correctly re-digested detached payload;
- rejection of the old Kimi-to-GPT route;
- rejection of forged submission, provider-request, and cost state; and
- rejection of an all-green promotion packet.
