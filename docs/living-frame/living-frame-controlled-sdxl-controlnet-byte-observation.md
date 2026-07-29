# Living Frame controlled SDXL ControlNet byte observation

Status: exact server-owned byte and safetensors-structure observation;
controlled, non-promotable, non-executable.

Contract:
`living-frame-controlled-sdxl-controlnet-byte-observation-v1`.

## Outcome

The retained controlled observation records a complete independent stream of
the pinned small SDXL canny ControlNet candidate and verified:

- 320,237,179 bytes;
- SHA-256
  `fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9`;
- a 14,931-byte safetensors JSON header;
- 140 tensors, all `F16`;
- 320,222,240 tensor-data bytes;
- contiguous, non-overlapping offsets across the complete data section;
- every tensor span against its declared shape and two-byte `F16` width;
- the complete sorted tensor-name set;
- eight bounded namespace counts;
- eight selected tensor shapes; and
- exact header, metadata, namespace, selected-shape, and tensor-name
  digests.

The exact-artifact smoke reruns this observation only when both the
ControlNet and prerequisite LoRA server-owned paths are injected; otherwise
it reports a fail-closed skip. The shared inspector returns no raw header,
metadata payload, complete
tensor-name map, tensor bytes, path, URL, filename, credential, or locator.
It returns only bounded structural facts and explicitly selected shapes.
The process-bound server reader is single-use.

## Structural finding and limitation

The selected shapes include:

- `add_embedding.linear_1.weight`: `1280 x 2816`;
- `controlnet_cond_embedding.conv_in.weight`: `16 x 3 x 3 x 3`;
- `controlnet_down_blocks.8.weight`: `1280 x 1280 x 1 x 1`;
- `conv_in.weight`: `320 x 4 x 3 x 3`; and
- `time_embedding.linear_1.weight`: `1280 x 320`.

Those namespaces and shapes are consistent with the selected SDXL
ControlNet candidate. They do not independently prove the exact base-model
family or canny-conditioning behavior. The embedded safetensors metadata
contains only `format=pt`; it does not name SDXL or canny.

The immutable repository configuration and model card still require a
separate server-owned binding, and the exact checkpoint must pass a
controlled ComfyUI load and canny-behavior benchmark before compatibility
can be established.

## Scope

This observation advances the second artifact in the five-artifact
candidate set:

- independently byte-verified artifacts: 2 of 5;
- safetensors schemas inspected: 2 of 5;
- complete bundle byte verification: false; and
- exact bundle compatibility: unproven.

The base checkpoint, generic IP-Adapter checkpoint, and matching CLIP Vision
checkpoint still require independent full-byte and schema verification. The
already verified LoRA remains compatibility-blocked because its embedded
metadata names `sdxl_base_v0-9`.

## Authority boundary

This contract can report only the exact controlled byte observation. It
does not:

- ingest, locate, mount, load, or execute a model artifact;
- prove model-family or canny behavior from a repository label;
- qualify ComfyUI compatibility, licensing, or paid production use;
- select a Living Frame scene;
- create timing, SoundSync, estimate, cost, approval, snapshot, work, queue,
  asset, QA, render, provider, tool, or runtime authority; or
- perform image generation.

The next artifact step is independent verification of another pinned
candidate or a separately authorized controlled load benchmark. Neither
step may promote the incomplete bundle.
