# Living Frame ComfyUI hardened local image evidence

Status date: 2026-07-30

Status:
`local_hardened_derivative_verified_scan_incomplete`

## Result

The exact 33-package hardening closure was materialized as a local-only
`linux/amd64` derivative of the canonical ComfyUI parent:

```text
image digest:
sha256:d4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd

image byte length:
12,657,282,187

default identity:
65532:65532
```

The image retains the canonical fixed runner, contains no model weights, and
keeps operation registration, runtime execution, dispatch, asset creation,
billing, public delivery, and production false.

## Materialization boundary

Docker Desktop BuildKit could not use the local `linux/amd64` parent as a
`FROM` source. The private test therefore used:

```text
sealed disposable overlay
→ exact package replacement
→ non-root verifier
→ local container commit
→ metadata sanitation
→ strict read-only image verification
```

This is sufficient for local merged-filesystem inspection. It is not a
reproducible source-bound OCI build and carries no build provenance.

## Host-path sanitation

The first local commit inherited Docker Desktop mount labels containing host
paths. That intermediate was rejected. A metadata-only sanitation step blanked
every `desktop.docker.io/mounts/*` value. The sanitized image configuration and
history were checked for `/Users/` and `/Volumes/` paths and contained none.

The unsafe tag, unsafe intermediate image, and both temporary containers were
then removed. Only the sanitized local derivative remains.

## Strict runtime verification

The sanitized image passed the exact fixed verifier with:

```text
root filesystem: read-only
network: none
Linux capabilities: all dropped
no-new-privileges: true
temporary filesystem: /tmp, 256 MiB, noexec, nosuid, nodev
runtime identity: 65532:65532
```

Verified versions:

```text
Torch 2.6.0+cu124
TorchVision 0.21.0+cu124
TorchAudio 2.6.0+cu124
Pillow 12.3.0
Transformers 5.5.0
Hugging Face Hub 1.5.0
```

The canonical runner lineage and operation-scoped `sam2` import denial
remained intact. No model loaded and no graph executed.

## Full-image scanner result

Docker Scout `1.20.4` was given a 1,200-second full-image attempt. Its scratch
space was redirected to a private backup volume so it could not exhaust the
host system disk. The scanner expanded approximately 24 GB of temporary
merged-filesystem data but did not produce a SARIF report before the bound.

The attempt was terminated and Scout removed its incomplete temporary data.

Therefore:

```text
full image scan completed: false
vulnerability clearance: false
```

The next scan should run on a Linux scanner host with fast local storage.
Runtime verification must not be represented as vulnerability clearance.

An adjacent archive-input attempt is frozen in
`living-frame-comfyui-hardened-archive-scan-evidence.md`. It binds the exact
completed `docker save` tar by byte length and SHA-256, but the archive scan
also reached its 1,200-second boundary without producing a report. It narrows
the remaining requirement to a Linux scanner host with fast local storage.

## Open gates

- reproducible source-bound OCI build;
- complete Linux-host SBOM and vulnerability scan;
- license, direct-VCS, signature, and provenance disposition;
- canonical private image ingest;
- real L4 five-model ComfyUI regression;
- private output persistence, resource receipt, alpha/continuity/fact QA, and
  private review.
