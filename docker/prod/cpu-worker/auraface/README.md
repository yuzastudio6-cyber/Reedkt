# Private AuraFace CPU runner candidate

This package is a fixed, offline, CPU-only candidate for Living Frame
identity-continuity measurement. It is not a face-generation, face-swap,
identity-verification, or likeness-approval service.

## Fixed operation

```text
tool.transformers.measure_auraface_identity_continuity.v1
```

The request accepts only two committed private image byte packets and bounded
SHA-256 lineage. It rejects caller paths, URLs, endpoints, model locators,
commands, thresholds, and identity decisions. The response returns private
single-use normalized embeddings to the server adapter; the public Living
Frame receipt never includes embeddings or raw images.

The preferred private protocol is
`living-frame-auraface-atomic-mount-offline-runner-v2`. It binds the request
to one canonical mount-session digest created while both exact model-artifact
leases remain open. The v1 protocol remains only as a controlled compatibility
lane for the earlier separately bound host contract. A v2 request always
receives a v2 response, including fail-closed responses.

## Model presentation

No model is baked into this image. The backend-owned model-artifact authority
must present these exact read-only files:

```text
/mnt/reeditpro/model-artifacts/auraface/glintr100.onnx
/mnt/reeditpro/model-artifacts/auraface/scrfd_10g_bnkps.onnx
```

The runner re-hashes both files before each bounded attempt. Their sizes and
digests are fixed by `living-frame-auraface-artifact-requirements-v1`.
Runtime downloads and automatic InsightFace model-zoo downloads are never
used. Production launch must additionally enforce `--network=none`.

The backend-owned atomic session must also verify each canonical object before
and after the runner consumes it. The container's internal re-hash does not
replace that outer canonical lease check. The mounted-runner adapter receives
host paths only inside its process-bound callback; paths and mount aliases are
not returned by the session contract.

## Preprocessing

The fixed preprocessing digest is:

```text
2660c1ec27667e691e9d1a84c0426fee95ccde4ddd35470e485ff5dcd4c6d614
```

It binds OpenCV BGR decode, 640x640 SCRFD detection, score threshold `0.5`,
NMS threshold `0.4`, exactly-one-face admission, five-landmark ArcFace
alignment to 112x112, 512-dimensional float32 output, and L2 normalization.
It is not a customer-adjustable identity threshold.

## License and safety boundary

The image installs the MIT-licensed InsightFace Python code but none of the
InsightFace project's non-commercial pretrained models. It consumes only the
separately pinned AuraFace artifacts, whose publisher labels them
Apache-2.0. Those labels remain controlled observations pending ReeditPro
legal, training-data-rights, fairness, privacy, consent, minor, impersonation,
and documentary-safety review.

The current package is private, unreleased, unregistered, undispatched, and
non-production. It does not modify ReeditPro's existing worker, registry,
credit, approval, model-artifact, QA, or private-review authorities.

## Controlled local build

The lockfile is intentionally scoped to the planned Linux AMD64 worker.
BuildKit must receive the target architecture explicitly:

```sh
docker build \
  --platform=linux/amd64 \
  -f docker/prod/cpu-worker/auraface/Dockerfile \
  -t reeditpro-living-frame-auraface-cpu-candidate:local \
  .
```

The build resolves only the hash-pinned public wheels. Runtime qualification
must use `--network=none`, a read-only root filesystem, a bounded temporary
filesystem, and the backend-owned model-artifact directory mounted read-only.
Running the image without that model mount fails closed with
`MODEL_OR_INFERENCE_FAILED`; it never downloads a replacement.

Controlled local integration uses `docker run -i` because the fixed JSON
request is delivered on stdin. Omitting Docker's stdin attachment produces an
empty request and must fail validation rather than falling back to any ambient
configuration.
