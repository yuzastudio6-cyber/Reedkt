# Living Frame shared GPU parent hardened core package cache evidence

Status date: 2026-07-30

Status:
`exact_core_artifacts_cached_mutable_host_cache_not_install_admitted`

Contract:
`living-frame-shared-gpu-parent-hardened-core-package-cache-evidence-v1`

## Outcome

The four core artifacts from the frozen shared-parent hardening matrix were
downloaded from their official package hosts into a private local
qualification cache.

The host remeasured all `1,178,861,927` bytes and reproduced every published
SHA-256. `unzip -t` passed for each wheel. The embedded `METADATA` SHA-256
values and wheel compatibility tags also match the official index metadata.

No package was installed.

## Exact observations

| Role | Version | Archive integrity | Embedded metadata | Wheel tag |
| --- | --- | --- | --- | --- |
| Torch | `2.6.0+cu124` | verified | verified | `cp310-cp310-linux_x86_64` |
| TorchVision | `0.21.0+cu124` | verified | verified | `cp310-cp310-linux_x86_64` |
| Triton | `3.2.0` | verified | verified | `cp310-cp310-manylinux_2_17_x86_64` and `manylinux2014_x86_64` |
| cuSPARSELt | `0.6.2` | verified | verified | `py3-none-manylinux2014_x86_64` |

The receipt never serializes the local cache path.

## Honest filesystem boundary

The backup-volume filesystem continued to project the artifacts as
owner-writable after a `chmod 0444` attempt. Therefore this evidence records:

```text
hostFilesystemReadOnlyModeVerified = false
consumerMustRehashBeforeAndAfterUse = true
canonicalRepositoryIngested = false
atomicReadOnlyMountVerified = false
```

These bytes may be used only as a qualification input. Before a build, the
canonical backend owner must ingest and rehash the exact files into its
private package repository, grant a process-bound atomic read-only mount, and
rehash after the consumer finishes.

## Still open

- complete hash-locked offline dependency closure;
- remediation of Pillow, Transformers, and inherited system metadata;
- hardened parent and derived image builds;
- complete Linux image security disposition;
- SAM2 checkpoint and temporal inference regression;
- ComfyUI five-model/current-node graph regression;
- L4 resource, output, persistence, QA, and review evidence.

No image, runtime, operation, asset, cost, billing, public, or production
authority is created.
