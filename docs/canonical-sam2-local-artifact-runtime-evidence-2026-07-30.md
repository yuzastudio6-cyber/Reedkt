# Canonical SAM2 local artifact/runtime evidence — 2026-07-30

Status: `private_local_checkpoint_and_mount_verified_l4_required`

This record captures bounded private-local evidence for the source contract in
`canonical-sam2-gpu-runtime-source-and-router.md`. It is not Cloud Run,
production dispatch, canonical model-repository ingest, or customer evidence.

## Exact checkpoint

The immutable official checkpoint URL at repository revision
`ee5bba1d82bb8749febdf90f45e84b687142ba03` was downloaded into a private local
cache outside Git.

Observed identity:

```text
file: sam2.1_hiera_small.pt
bytes: 184416285
sha256: 6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38
mode: 0444
```

The byte length and digest exactly match the canonical requirement. The file
was not added to Git and was not uploaded to any cloud service.

## Confined deserialization

Inside the derived linux/amd64 candidate with network disabled, read-only
root, all capabilities dropped, no-new-privileges, UID/GID 65532, bounded
CPU/memory/PIDs, a noexec temporary filesystem, and the checkpoint mounted
read-only, `torch.load(..., map_location="cpu", weights_only=True)` observed:

```json
{
  "cuda": false,
  "inference": false,
  "stateEntryCount": 519,
  "tensorElementCount": 46060610,
  "tensorSchemaSha256": "0bed2cb61421610316683633c3e0db3ed674c66008db95c53f8fba28fe8c2793",
  "topLevelKeys": ["model"],
  "weightsOnly": true
}
```

This is a safe checkpoint-structure observation, not a source-config/model
load or inference claim.

## Fixed runner preflight

The current source candidate built offline from the exact inspected parent
image. Its default identity is UID/GID 65532 and its fixed entrypoint is:

```text
/usr/bin/python3 -I -B /opt/reeditpro/gpu-operations/sam2/runner.py
```

A valid SHA-bound runtime request was supplied with:

- a real 48-frame, 320x180, 24fps private MP4 mounted read-only;
- the exact checkpoint directory mounted read-only;
- an empty private-output tmpfs;
- network none, read-only root, all capabilities dropped, and
  no-new-privileges.

The runner rehashed the source and checkpoint, verified media metadata and the
fixed source/config/package identities, then stopped at:

```json
{
  "ok": false,
  "operationId": "tool.sam2.segment_and_track_subject.v1",
  "sensitiveDetailsIncluded": false,
  "stage": "CUDA_RUNTIME_PREFLIGHT_FAILED"
}
```

That is the correct outcome on Apple-hosted linux/amd64 CPU emulation. It
proves the fixed request, source, checkpoint, and mount boundary reaches the
hard CUDA gate without silently falling back to CPU.

## Remaining exact gate

The remaining model-runtime evidence is one real L4 execution of this exact
source/config/checkpoint combination, followed by create-only output
persistence, byte reread, edge/temporal/coverage/contact-object QA, private
review, and canonical resource-usage/cost receipts.

No operation registration, cloud dispatch, billing, public delivery, or
production authority is granted by this record.
