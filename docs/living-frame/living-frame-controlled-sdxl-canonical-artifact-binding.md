# Living Frame controlled SDXL canonical-artifact binding

Status: exact five-artifact repository identity is controlled and
non-promotable; compatibility, loading, inference, and production remain
closed.

## Purpose

The generic Living Frame ComfyUI repository binding proves that five
server-resolved repository objects match the required roles, families,
format, and GPU-only policy. It intentionally does not name a particular
candidate bundle.

This follow-up binds that generic repository evidence to the five exact
artifacts whose full bytes and safetensors schemas were independently
inspected:

1. SDXL 1.0 base checkpoint;
2. SDXL canny ControlNet checkpoint;
3. the controlled SDXL offset LoRA candidate;
4. the generic SDXL IP-Adapter checkpoint; and
5. the paired OpenCLIP ViT-bigG CLIP Vision checkpoint.

It revalidates the completed five-artifact byte-observation chain and the
existing canonical repository binding. It then requires exact order, role,
binding kind, artifact ID, immutable repository revision, model family,
byte length, SHA-256 identity, and canonical GPU-bundle requirement identity
for every slot. The canonical repository performs another full checksum read.

## What this proves

- All five inspected artifact identities are present in the existing
  server-owned canonical repository.
- Every repository object matches the exact controlled candidate byte length
  and SHA-256 digest.
- The existing GPU-bundle requirement projection carries those same immutable
  identities in the same semantic order.
- No caller path, URL, filename, bytes, mount alias, provider, tool route,
  operation, job, or queue selection enters the result.

## What this does not prove

Repository identity is not runtime compatibility. In particular:

- the LoRA metadata still names `sdxl_base_v0-9`, while the exact base
  checkpoint identifies SDXL 1.0;
- no complete ComfyUI graph has loaded the five artifacts together;
- no deterministic seed, image, control-strength, adapter-strength, VRAM,
  latency, or output-quality benchmark has passed;
- no dependency/custom-node schema lock has been approved;
- no license or paid-production determination has been made;
- no Cloud Run GPU operation, private distribution, read-only mount, worker,
  selected scene, timing, SoundSync, estimate, approval, immutable snapshot,
  work graph, queue, asset-manifest mutation, QA approval, render, or
  production action has been authorized.

The next meaningful gate is a controlled complete-bundle load and behavior
benchmark on the backend-owned GPU path. It must reuse the canonical
repository, mount, GPU handoff, operation, work, cost, asset, QA, and private
review authorities rather than create Living Frame-specific substitutes.
