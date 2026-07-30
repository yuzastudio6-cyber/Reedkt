# Living Frame ComfyUI hardened runtime host evidence

Status date: 2026-07-30

Status:
`source_controlled_private_host_replay_candidate`

## Purpose

This contract turns the bounded sealed compatibility run from the hardened
ComfyUI closure into a repeatable private-host evidence operation. It does not
build an image, mount models, execute a ComfyUI graph, register an operation,
dispatch work, create an asset, produce a cost receipt, or grant production
authority.

The replay is frozen to:

```text
closure commit:
31e1bca64f76fbde11050129d842eb3a2a90e479

closure tree:
b450107244f85c3001eb43251fc87334655750d7

parent image:
reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0

parent image digest:
sha256:84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b
```

## Private inputs

The host injects all three cache roots together:

```text
REEDITPRO_LIVING_FRAME_HARDENED_CORE_CACHE_ROOT
REEDITPRO_LIVING_FRAME_HARDENED_REMEDIATION_CACHE_ROOT
REEDITPRO_LIVING_FRAME_HARDENED_TRANSFORMERS_CACHE_ROOT
```

The paths are never serialized into the evidence receipt. Each root must:

- use the exact bounded cache name;
- be a real directory rather than a symlink;
- contain only the exact manifest files;
- be non-writable by every host mode bit;
- contain only non-symlink regular files; and
- match every committed archive SHA-256 before and after the container run.

If none of the three inputs is configured, the smoke skips honestly. Partial
configuration fails closed.

## Source boundary

Before Docker starts, the runner requires:

- a clean Git worktree;
- the frozen closure commit to be an ancestor of the runner;
- the frozen closure tree to match exactly; and
- every closure contract file to be unchanged from the frozen commit.

This allows the evidence runner itself to evolve without silently changing the
installer, verifier, or package manifests.

## Sealed execution

Exactly one disposable Docker attempt is permitted with:

```text
platform: linux/amd64
network: none
process limit: 256
memory limit: 12 GB
CPU limit: 4
no-new-privileges: true
GPU access: absent
image pull: never
```

The three package caches and the source contract are mounted read-only. The
installer changes only the disposable container overlay. The final verifier
runs as UID/GID `65532:65532`. The container is removed after the attempt.

No model, source media, prompt material, credential, endpoint, provider,
cloud resource, or customer artifact is mounted.

## Receipt

The receipt contains only:

- frozen source and parent-image lineage;
- the evidence runner commit and tree;
- aggregate cache-set digests;
- before/after rehash stability;
- confinement facts;
- exact verifier result facts;
- authority-denial facts; and
- canonical evidence and observation digests.

It contains no host path or file payload.

## Still open

- a source-bound hardened OCI image build;
- merged-filesystem SBOM, vulnerability, license, signature, and provenance
  disposition;
- real L4/CUDA five-model graph execution;
- create-only output persistence and reread;
- alpha, continuity, fact, destination-composite, and private-review QA; and
- any operation registration, dispatch, billing, public delivery, or
  production release.
