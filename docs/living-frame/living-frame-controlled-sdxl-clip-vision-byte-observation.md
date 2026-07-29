# Living Frame controlled SDXL CLIP Vision byte observation

Status: exact server-owned byte and safetensors-structure observation;
controlled, non-promotable, non-executable.

Contract:
`living-frame-controlled-sdxl-clip-vision-byte-observation-v1`.

## Outcome

The retained controlled observation records a complete independent stream of
the pinned SDXL companion image encoder and verified:

- 3,689,912,664 bytes;
- SHA-256
  `657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d`;
- a 96,072-byte safetensors JSON header;
- 777 tensors: 776 `F16` and one `I64`;
- 3,689,816,584 tensor-data bytes;
- contiguous, non-overlapping offsets across the complete data section;
- 776 `vision_model` and one `visual_projection` tensor entries;
- embedded metadata limited to `format=pt`; and
- exact header, metadata, namespace, selected-shape, and tensor-name
  digests.

The exact-artifact smoke reruns this observation only when the CLIP Vision
and prerequisite IP-Adapter, ControlNet, and LoRA server-owned paths are
injected; otherwise it reports a fail-closed skip. The shared inspector
returns no raw header, metadata, full tensor-name map,
tensor bytes, path, URL, filename, credential, or locator. The process-bound
server reader is single-use.

## Structural finding and limitation

The selected structure includes:

- a 1,664-wide vision embedding;
- a `1664 x 3 x 14 x 14` patch projection;
- 257 positional tokens;
- sampled attention projections at encoder layer indices 0 and 47;
- 1,664-wide pre- and post-layer normalization; and
- a `1280 x 1664` visual projection.

The visual projection's 1,280 output width matches the 1,280 input width of
the exact generic SDXL IP-Adapter image-projection matrix. That is useful
structural compatibility evidence for the two pinned objects. It is not a
successful model load, a behavioral result, or independent proof that the
file is the OpenCLIP ViT-bigG-14 variant named by the model card. The
embedded safetensors metadata says only `format=pt`.

The immutable model card must remain bound to the exact two objects, and the
complete bundle must pass a controlled ComfyUI load and
generic-reference-conditioning behavior benchmark.

## Scope

This observation advances the fourth artifact in the five-artifact
candidate set:

- independently byte-verified artifacts: 4 of 5;
- safetensors schemas inspected: 4 of 5;
- complete bundle byte verification: false; and
- exact bundle compatibility: unproven.

The SDXL base checkpoint is the only remaining candidate without independent
full-byte and schema verification. The verified LoRA remains
compatibility-blocked because its embedded metadata names
`sdxl_base_v0-9`. The verified ControlNet still requires exact
configuration/model-card binding and a canny-behavior benchmark.

## Authority boundary

This contract can report only the exact controlled byte observation. It
does not:

- ingest, locate, mount, load, or execute a model artifact;
- qualify a ComfyUI extension, node bundle, or complete artifact bundle;
- authorize FaceID, InsightFace, AuraFace generation conditioning, or a
  real-person identity route;
- qualify licensing or paid production use;
- select a Living Frame scene;
- create timing, SoundSync, estimate, cost, approval, snapshot, work, queue,
  asset, QA, render, provider, tool, or runtime authority; or
- perform image generation.

The next artifact step is independent verification of the pinned SDXL base
object. No partial observation may promote the incomplete bundle.
