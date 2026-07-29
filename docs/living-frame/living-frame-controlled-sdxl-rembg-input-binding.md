# Living Frame Controlled SDXL rembg Input Binding

Status: server-private opaque-input reread contract implemented; generic rembg
source admission, execution, mask commit, alpha composition, QA, and production
gates closed.

This contract closes one narrow lineage gap between a verified opaque ComfyUI
PNG and ReeditPro's existing canonical rembg operation. It does not create or
dispatch a rembg request.

## Why this bridge is required

The existing canonical rembg runtime is bound to an exact frame extracted from
source video by FFmpeg. That contract includes source-media identity, frame
index, extraction work, and source-frame artifact lineage. A generated opaque
Living Frame still is not an FFmpeg source frame and must not be relabeled as
one merely to reuse the runtime.

The new binding establishes an exact future source variant:

```text
living_frame_generated_opaque_still_png
```

It revalidates the existing controlled GPU-output observation, rereads the
exact PNG and decoded RGBA bytes through a process-bound one-shot reader,
recomputes both SHA-256 values, enforces the fixed 1024-by-1024 RGBA shape, and
confirms every alpha byte is 255. Verified bytes are delivered only through a
second process-bound one-shot consumer. No bytes, paths, URLs, credentials,
prompts, commands, or raw media enter the serializable binding.

## Required shared-runtime extension

A later shared-authority change must add a strict discriminated source union
to the canonical rembg admission:

```text
canonical_source_frame
  → existing FFmpeg/source-media lineage, unchanged

living_frame_generated_opaque_still
  → exact Living Frame output-observation and opaque-input binding lineage
```

The generated-still branch must preserve the existing rembg runtime policy:

- canonical tool `rembg`;
- operation `tool.rembg.remove_image_background.v1`;
- Google Cloud Run GPU in `europe-west1`;
- one NVIDIA L4;
- CUDA with pinned `u2netp`;
- mask-only gray8 PNG output;
- source dimensions preserved;
- no CPU fallback;
- no runtime download; and
- no network fetch.

This source-only slice does not admit that variant, create a tool request,
dispatch a worker, or commit a mask.

## Alpha pipeline

The intended canonical continuation is:

```text
verified opaque ComfyUI output
→ this exact-input binding
→ existing rembg mask operation
→ committed gray8 mask with QA
→ existing Sharp straight-alpha composition
→ true RGBA artifact
→ multi-background and destination-composite QA
→ continuity and documentary-safety QA
→ approved snapshot/work/asset/private review
→ existing Remotion compositor
```

An opaque checkerboard remains opaque pixels and cannot satisfy this pipeline.
The binding does not claim that segmentation succeeded or that a transparent
component exists.

## Cost and credit lineage

The ComfyUI generation has already consumed one shared GPU-host attempt. This
binding never charges that attempt again.

rembg is a separate canonical tool attempt because it executes a separate
model operation. Its infrastructure cost must be recorded by the existing
tool-cost authority, including failed or unknown attempts. This binding
contains no amount, customer price, credits, service fee, reservation, wallet,
or ledger data. The existing estimate and settlement pipeline remains
responsible for bundle aggregation, one-time credit rounding, and the single
downstream ReeditPro service fee.

## Closed authority

The contract grants only one private reread authority. Generic rembg source
admission, model artifact qualification, tool operation, dispatch, completion,
actual cost, customer price or credits, scene selection, MasterTiming,
SoundSync, estimate, approval, snapshot, work graph, queue, asset manifest,
mask commit, mask QA, alpha composition, alpha QA, rendering, runtime, and
production authority all remain false.
