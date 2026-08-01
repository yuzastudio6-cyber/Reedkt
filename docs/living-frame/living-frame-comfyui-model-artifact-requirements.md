# Living Frame ComfyUI model-artifact requirements

Status: exact unresolved requirement projection; non-executable.

The revalidated controlled model-family binding now projects its model-bearing
slots into one exact ordered requirement set. For the complete controlled
ControlNet + LoRA + generic IP-Adapter graph, the set contains:

1. base diffusion checkpoint;
2. matching ControlNet checkpoint;
3. matching LoRA adapter;
4. matching generic IP-Adapter checkpoint; and
5. matching CLIP Vision checkpoint.

Each requirement retains the original graph binding kind and SHA-256
expectation plus the independently validated model-family expectation. Every
artifact is classified as GPU-required with a future
`google_cloud_run_gpu`/CUDA target, no CPU fallback, no runtime download, and
no network fetch.

The requirement set also revalidates the controlled, non-promotable ComfyUI
dependency-lock observation and binds its exact evidence digest. That evidence
does not qualify the candidate image: canonical dependency artifact
admission, a rebuilt/scanned/signed image, and node-policy enforcement remain
open.

This is not an artifact manifest or mount request. It contains no locator,
filename, path, URL, model bytes, provider/tool/operation identity, job,
queue, cost, or commercial approval. The workflow-neutral canonical
model-artifact repository remains the only owner of immutable artifact
records, checksum verification, and single-use read-only mount leases.

Before these requirements can resolve, every artifact needs an exact
repository locator, full verification, bundle compatibility manifest,
canonical dependency artifact admission, signed image rebuild, license and
paid-use review, a single-use read-only mount, a confined GPU worker,
selected-scene/approved-snapshot lineage, canonical work/cost/asset/QA
admission, and private review.
