# Canonical Model-Artifact Repository And Read-Only Mount Authority

Status: implemented as a private, workflow-neutral, single-host integrity
primitive. It is not model inference, Cloud Run deployment, tool admission, or
production readiness.

## Why this authority exists

ReeditPro has model-weight policy and placeholder manifest templates, but those
templates intentionally cannot claim real checksums. The existing offline AI
capability host also intentionally says `modelWeightsLoaded = false` and
rejects caller mounts. Heavy models such as SAM 2, ControlNet, IP-Adapter,
ComfyUI checkpoints, and similar GPU workloads therefore had no honest bridge
between reviewed bytes and a future confined worker.

This authority closes only that storage-integrity gap:

- server-owned bytes can be ingested into immutable content-addressed storage;
- exact artifact metadata is committed separately from the content object;
- every read recomputes the complete object SHA-256;
- a short-lived, process-bound lease can present the verified source to one
  exact server-owned consumer as read-only;
- GPU-required artifacts can target only `google_cloud_run_gpu` with `cuda`;
- CPU fallback, runtime downloads, and network fetches remain false.

The implementation is generic. Living Frame, SAM 2, AuraFace, ComfyUI,
ControlNet, IP-Adapter, LoRA, and future model families must consume the same
authority rather than create feature-specific weight stores.

## Files and ownership

- `server/model-artifacts/canonical-model-artifact-types.ts` defines the closed
  descriptor, manifest, locator, repository, verification, lease, consumer,
  and receipt contracts.
- `server/model-artifacts/canonical-model-artifact-repository.ts` owns
  process-bound root/source capabilities, atomic ingest, exact manifest
  validation, no-follow reads, and full-object verification.
- `server/model-artifacts/canonical-model-artifact-read-only-mount.ts` owns
  expiring single-use lease and process-bound consumer admission.
- `server/model-artifacts/index.ts` is the server-only export boundary.
- `server/smoke/canonical-model-artifact-repository-smoke.ts` destructively
  exercises integrity and authority failures.

No browser, planner, registry, queue, provider, billing, database, migration,
package, container, or UI path is part of this slice.

## Descriptor

One descriptor represents one immutable file. Multi-file model snapshots must
use one record per exact file and later bind those records through a separate
closed bundle/compatibility manifest; a directory is never silently treated as
one artifact.

The descriptor binds:

- safe artifact ID and immutable revision;
- closed artifact format, role, and model family;
- exact byte length and SHA-256;
- an ordered, unique consumer-scope set;
- controlled-internal-test or reviewed-repository-candidate admission;
- source-observation, review-evidence, and security-review digests;
- model-artifact license label, license-document digest, optional model-card
  digest, commercial-use status, existing `ReviewStatus`, redistribution and
  attribution facts, and a separately constrained paid-production-use flag;
- execution class, required execution target, accelerator, and literal-false
  CPU fallback/runtime-download/network-fetch policies;
- literal-false caller byte/path/URL acceptance.

The commercial-use and review vocabularies are reused from the existing
model-weight/tool-runtime policy. Repository acceptance is not legal approval:
blocked, unknown, needs-review, and evaluation-only artifacts may be preserved
for controlled evidence while remaining unusable for paid production.

## Server-owned source capability

Ingest does not accept a `Buffer`, path, URL, bucket locator, command, or
download request. Server boot/application code creates a process-bound source
reader around a function that opens a fresh Node `Readable`. JSON parsing,
structured cloning, process restarts, and object spreading cannot reconstruct
that capability.

The reader is single-use once its stream is opened. An idempotent replay whose
manifest and object already verify does not reopen the source.

## Storage and commit protocol

The root is server-injected, absolute, canonicalized, process-bound, and kept
private. The current proof is deliberately single-host and cooperative. It
does not claim hostile same-UID protection, a distributed lock, remote object
storage, or multi-replica durability.

The derived layout is:

```text
objects/<sha-prefix>/<content-sha256>.bin
manifests/<record-prefix>/<descriptor-sha256>.json
staging/<server-random-id>.partial
locks/repository.lock
```

Paths are derived only from validated SHA-256 values and server randomness.
They never come from request data.

Ingest uses this sequence:

1. acquire the private cooperative repository lock;
2. detect and verify an idempotent manifest/object replay;
3. open one process-bound server source;
4. stream to an exclusive private staging file while enforcing exact length
   and hashing every byte;
5. require the declared length and digest;
6. change the staged object to owner-read-only mode `0400`;
7. hard-link the fully synced inode into its content-addressed destination;
8. remove the staging name and require one remaining link;
9. publish the small checksum-protected manifest atomically; and
10. reread the manifest and fully rehash the committed object before returning.

The manifest is the commit point. A crash before manifest publication can
leave an unaddressable exact content object; a later exact descriptor safely
reuses it after full verification. A committed manifest without its exact
object fails closed.

## Verification

Every repository read and every lease consumption performs a full-file SHA-256
calculation. Verification also requires:

- private regular-directory ancestry;
- no symbolic links;
- one regular object file;
- exactly one hard link;
- exact owner-read-only `0400` object mode;
- exact expected byte length;
- stable device, inode, mode, link count, size, mtime, and ctime across the
  read;
- a strict checksum-protected manifest with no unknown fields;
- exact descriptor, record ID, manifest digest, and locator agreement.

Verification receipts contain no bytes or host paths.

## Read-only lease

A lease:

- is genuine only inside the creating process;
- is single-use and bounded to at most fifteen minutes;
- binds one locator, descriptor digest, consumer scope, and execution target;
- stores only a digest of the server lease ID;
- contains no host path, mount alias, credential, or artifact bytes;
- keeps model inference and production authority false.

The consumer is also process-bound. The host path and server-derived mount
alias exist only inside its callback. The object is fully verified before and
after that callback. Any chmod, hard-link, symlink, byte, size, inode, or
timestamp mutation fails closed.

This first consumer contract can only prepare/read the immutable source. It
cannot claim that inference ran. A future qualified worker adapter must provide
its own execution and confinement evidence without weakening this lease.

## GPU placement

GPU-heavy inference must not silently fall back to CPU.

For `executionClass = gpu_required`, the only accepted descriptor is:

```text
requiredExecutionTarget = google_cloud_run_gpu
accelerator = cuda
cpuFallbackAllowed = false
runtimeDownloadAllowed = false
networkFetchAllowed = false
```

A lease request for `private_controlled_cpu` is rejected. The repository smoke
uses tiny bytes and does not execute them; its GPU target proves policy
binding, not a live Google Cloud resource.

Actual Cloud Run GPU execution still requires a separately qualified,
workflow-neutral distribution/mount adapter, service identity, network-off
runtime, checksum-protected model bundle, resource benchmark, and execution
receipt. No cloud resource, credential, deployment, or billable call is
created here.

## Relationship to existing authorities

- Existing `server/model-weights` templates remain placeholders and unchanged.
  Repository manifests do not mutate or silently promote them.
- Existing model-weight license policy remains authoritative for paid
  production.
- Existing tool registry and operation specs remain authoritative for tool
  identity and dispatch.
- Existing approved snapshot, estimate/credit, work graph, queue, artifact
  manifest, QA, and private-review systems remain authoritative.
- The offline AI capability host remains model-weight-free until a later
  bounded integration admits this exact lease and supplies runtime evidence.
- Living Frame may bind locators and evidence later, but it does not own this
  repository.

## Adversarial evidence

The smoke covers:

- forged repository, source-reader, lease, and consumer objects;
- traversal and unknown descriptor fields;
- unsorted/duplicate scope semantics;
- GPU-to-CPU placement forgery;
- forged paid-production approval;
- wrong source length/checksum and staging cleanup;
- single-use source readers;
- idempotent replay without reopening bytes;
- content deduplication across distinct exact manifests;
- locator/manifest mismatch and caller path injection;
- writable, hard-linked, symlinked, missing, and byte-tampered objects;
- hard-linked and unknown-key/tampered manifests;
- unadmitted consumer scope and cross-consumer lease use;
- expired and replayed leases;
- consumer mutation between the before/after verification passes; and
- symbolic-link repository roots.

## Explicitly still closed

This authority does not grant:

- model compatibility or bundle completeness;
- package/container/runtime qualification;
- GPU worker or Cloud Run deployment readiness;
- provider, tool, operation, dispatch, work, queue, or asset authority;
- model inference, output artifact, QA, render, or export authority;
- estimate, customer price, credit, approval, or snapshot authority;
- paid-production permission merely because bytes are stored;
- remote durability, distributed locking, hostile same-UID isolation, or
  public/external-beta readiness.
