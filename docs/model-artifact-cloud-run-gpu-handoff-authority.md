# Model Artifact Cloud Run GPU Handoff Authority

Status: `verified_local_contract_remote_distribution_blocked`

## Outcome

ReEditPro now has one workflow-neutral contract that joins the canonical
model-artifact repository to one exact approved Google Cloud Run GPU attempt.
It supports an ordered bundle of independently versioned model artifacts
without putting model identifiers, storage locators, paths, URLs, bytes, mount
paths, or credentials into the Cloud Tasks request or Cloud Run environment.

This is the shared prerequisite for heavy model families such as SAM2,
BiRefNet, ComfyUI/ControlNet/IP-Adapter/LoRA, and other CUDA workloads. It is
not a Living Frame worker and does not register or execute any model.

## Exact Authority Chain

```text
immutable approved execution package
  -> canonical package queue attempt
  -> exact regional Cloud Run GPU dispatch attempt
  -> verified model-artifact repository locators
  -> ordered GPU model-artifact bundle
  -> process-bound single-use read-only handoff
  -> future server-owned private distribution and Cloud Run mount adapter
```

The bundle binds all of the following:

- dispatch-intent, dispatch-binding, attempt-plan, manifest-entry, package
  queue, region, job, and delivery-attempt identities;
- the one approved production tool ID and one approved operation ID already
  bound to that exact dispatch entry and revalidated against the canonical
  production tool and operation-spec registries;
- the exact `reeditpro-gpu-ai-worker` job request and worker service-account
  expectation;
- the `nvidia_l4` Cloud Run target and `cuda` model requirement;
- between 1 and 32 artifacts with a combined upper bound of 64 GiB;
- one canonical order and unique slot for every model artifact;
- exact repository record, artifact ID, revision, format, role, model family,
  byte length, SHA-256, descriptor digest, manifest digest, and immutable
  object identity;
- source-observation, review, security, license-policy, and current
  commercial-review evidence digests; and
- the exact admitted consumer scope, which must equal
  `<approvedToolId>.private-inference`.

Every artifact must already exist in the generic model-artifact repository.
Bundle creation performs the repository's full no-follow SHA-256 verification
for every object. CPU-permitted artifacts, GPU artifacts assigned to CPU,
cross-scope artifacts, reordered or duplicated slots, duplicate records,
wrong revisions, wrong families, wrong roles, wrong formats, wrong lengths,
wrong hashes, and unknown fields fail closed.

Version 1 verifies the exact supplied ordered requirement set, but it does
not yet prove that this is the complete canonical model-artifact set required
by the approved operation. That operation-owned requirement projection
remains an explicit blocker rather than being inferred from model names.

A valid repository record is therefore not sufficient by itself. The
consumer scope, approved tool, approved operation, dispatch entry, exact
canonical GPU target, and model-artifact bundle must all agree. For example,
a ComfyUI-scoped model bundle cannot be attached to an approved SAM2
operation even if an attacker recomputes every public digest.

The approved tool must itself be registered as GPU-required, CPU-forbidden,
model-weight-backed work. Its one operation must be the canonical registered
operation, require a GPU resource ceiling and exact server-mounted model
manifest, and forbid runtime model download.

## Opaque Dispatch Is Preserved

The existing Cloud Tasks body remains unchanged. It still carries only opaque
dispatch identity and integrity hashes. The Cloud Run Jobs request continues
to expose only:

- `REEDITPRO_DISPATCH_INTENT_ID`; and
- `REEDITPRO_DISPATCH_BINDING_HASH`.

The model bundle is a server-resolved sidecar authority for that exact
attempt. It is not serialized into either payload. This prevents task-size
growth, caller-selected model routing, signed-URL leakage, path injection, and
model metadata becoming a bearer capability.

## Process-Bound Read-Only Handoff

A short-lived handoff lease is:

- process-branded and therefore not forgeable by reconstructing JSON;
- single-use and expiring;
- bound to the exact bundle, dispatch attempt, and consumer scope;
- bound to the exact approved tool and operation already carried by that
  dispatch attempt;
- GPU-only with `cpuFallbackAllowed=false`;
- network-fetch and runtime-download prohibited; and
- serializable without host paths, mount paths, bytes, URLs, or credentials.

Only inside a trusted process callback does the handoff expose the
repository-owned immutable source paths and deterministic desired container
mount paths. All sources are rehashed before the callback and again after it.
A consumer that changes bytes, file mode, inode identity, length, or other
repository evidence causes the handoff to fail closed. The callback runs once
for the whole ordered bundle so a model graph cannot silently receive a
partial or reordered set.

The callback currently observes the verified sources only. It has no remote
distribution or model-execution authority.

## Heavy Model Placement Rule

An admitted artifact in this bundle must declare all of:

```text
executionClass = gpu_required
requiredExecutionTarget = google_cloud_run_gpu
accelerator = cuda
cpuFallbackAllowed = false
runtimeDownloadAllowed = false
networkFetchAllowed = false
```

The matching cloud attempt must target:

```text
workerType = gpu_ai_worker
cloudRunAccelerator = nvidia_l4
gpuCount = 1
noGpuZonalRedundancy = true
taskCount = 1
parallelism = 1
cloudRunInternalMaxRetries = 0
```

Cloud Tasks redelivery does not create another package attempt. There is no
silent CPU fallback when an L4 worker, CUDA runtime, model artifact, capacity
gate, or mount is unavailable.

## Security And Authority Boundary

The contract does not accept caller bytes, paths, URLs, filenames, mount
aliases, credentials, runtime downloads, or network fetches. It creates no
model artifact, work item, queue entry, asset-manifest entry, estimate,
customer cost, approval, or snapshot.

These remain false:

- private generation-bound GCS model distribution;
- the complete canonical operation-owned model-artifact requirement set;
- a distributed model-artifact repository;
- deployed Cloud Run read-only mounts;
- deployed worker identity and IAM evidence;
- deployed L4 capacity and CUDA compatibility;
- Cloud Run job execution;
- model inference;
- provider or tool dispatch;
- asset creation or QA;
- customer billing or credit mutation;
- render, runtime, external-beta, and production readiness.

The current repository is a hardened cooperative single-host authority. A
future distributed adapter must preserve the same artifact record,
manifest/content hashes, region, service identity, attempt, and read-only
mount semantics. It must use server-owned private object transport and must
never convert model locators into caller-visible or long-lived signed URLs.

## Focused Evidence

Run:

```bash
npx tsx server/smoke/canonical-model-artifact-cloud-run-gpu-handoff-smoke.ts
```

The smoke proves:

- two independently versioned artifacts form one ordered exact bundle;
- the bundle is bound to one exact L4/CUDA Cloud Run attempt;
- the Cloud Tasks body and Cloud Run environment remain byte-identical;
- full repository verification happens before bundle admission;
- one process-bound callback receives both read-only sources in exact order;
- every source is verified before and after the callback;
- serializable bundle, lease, and receipt contain no host/mount paths, bytes,
  URLs, or credentials;
- CPU target and CPU artifact substitution fail closed;
- wrong or cross-tool scope, an unregistered operation, checksum, family,
  order, slot, record, dispatch, and digest fail closed;
- correctly re-signed model-family and dispatch forgeries fail closed;
- forged consumer and lease capabilities, expiry, replay, and consumer
  mutation fail closed; and
- remote distribution, Cloud Run execution, inference, credits, and
  production authority stay false.

No Google Cloud resource, GCS object, provider, database, billing system,
deployment, or remote repository was contacted or mutated by this slice.
