# Canonical Living Frame preapproval reasoning lifecycle

## Status

This boundary prepares and persists a provider-specific Living Frame reasoning
run without authorizing a provider submission. It is a private, server-owned,
single-host restart-safety boundary. It is not provider execution, a released
reasoning result, selected-scene planning, approval, or production runtime.

## Why this boundary exists

The original controlled Living Frame result fixture used the preapproval input
expectation digest as its request hash. That expectation describes scope and
lineage, but it is not the complete semantic request a provider would receive.
Real execution must bind the exact payload separately.

The prepared lifecycle therefore preserves the original controlled fixture
unchanged and introduces an additive workload class:

`pre_plan_living_frame_semantic_reasoning_prepared`

Its `reasoningRequestDigestSha256` is exactly the digest of the complete
provider-neutral semantic payload. The authority separately binds:

- the current Living Frame preapproval-input authority;
- current source-visual and generic source-speech evidence;
- the semantic request and strict output JSON schema;
- the exact current route-data assurance evidence and decision set;
- the canonical Kimi K3, Qwen 3.7, DeepSeek V4 Pro route identity;
- the immutable reasoning rate-card identity; and
- a server-created, non-commercial internal-cost ceiling.

The existing Edit Reference V6 workload and receipt lane and the older
controlled Living Frame fixture lane remain separate.

## Server flow

```text
strict prepare request
  -> rebuild current Living Frame input authority
  -> reread source speech and route-data assurance
  -> rebuild provider-neutral semantic admission
  -> reread current input authority
  -> create server-owned internal-budget admission
  -> create exact Kimi K3 prepared envelope
  -> persist create-only content-addressed run
  -> atomically publish private current pointer
  -> reread the run twice
  -> reread current input authority again
  -> return private prepared-run evidence
```

The caller cannot choose a provider, model, route, envelope, run ID, attempt
ID, credential, work item, queue item, snapshot, reservation, or customer
credits. The strict prepare request contains only the existing semantic
admission request.

## Prepared envelope

The first envelope is deterministically assigned to
`kimi_k3_primary` / `kimi-k3`. It contains the complete bounded
provider-neutral payload and the exact strict output JSON schema. It also
contains a one-use idempotency digest, but its submission authority state is
`not_issued`.

The prepared envelope explicitly records:

- `providerTransportAuthorized = false`;
- `providerCallMade = false`;
- `credentialReadMade = false`;
- no persisted provider request body or response;
- no customer price, customer credits, reservation, wallet mutation, or
  service fee; and
- four unresolved runtime blockers: provider adapter, credential capability,
  one-use submission authority, and distributed lifecycle.

No provider SDK, credential, network call, or external mutation occurs in this
slice.

## Persistence boundary

The private repository uses:

- tenant-scoped cooperative file locking;
- create-only content-addressed run versions;
- a checksum-protected atomic current pointer;
- exact locator, owner, workspace, run, revision, and record-digest checks;
- immutable replay for the same prepared run; and
- full contract revalidation on every read.

This is restart-safe on one backend host only. It is not a distributed durable
attempt store, database repository, queue, lease, webhook, or unknown-attempt
reconciliation system. A later provider-execution slice must add CAS-backed
attempt state, one-use submission authority, checkback, retry/fallback, and
unknown-attempt reconciliation before any transport can be enabled.

## Closed authorities

The prepared record contains no attempt receipt, actual attempt cost,
provider result, selected scene, MasterTiming or SoundSync decision, estimate,
customer price, customer credits, approval, immutable snapshot, work graph,
queue, tool dispatch, asset creation, renderer, export, runtime, or production
authority.

GPU-heavy model work remains restricted to qualified Google Cloud Run GPU
workers. This preparation boundary performs no model inference and permits no
CPU fallback for a future heavy-model route.

## Verification

The focused smoke proves:

- the complete payload digest is distinct from the old metadata expectation;
- exact output-schema, route, rate-card, speech, visual, and assurance lineage;
- create-only persistence, restart reread, and idempotent replay;
- strict caller-field rejection;
- cross-owner isolation;
- rejection of a correctly re-digested detached payload;
- rejection of the old Kimi-to-GPT route;
- rejection of forged transport, credentials, attempts, results, and
  all-green authority packets; and
- preservation of the existing Edit Reference authority lane.
