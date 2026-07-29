# Living Frame controlled SDXL IP-Adapter byte observation

Status: exact server-owned byte and safetensors-structure observation;
controlled, non-promotable, non-executable.

Contract:
`living-frame-controlled-sdxl-ipadapter-byte-observation-v1`.

## Outcome

The retained controlled observation records a complete independent stream of
the pinned generic SDXL IP-Adapter candidate and verified:

- 702,585,376 bytes;
- SHA-256
  `ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6`;
- a 14,872-byte safetensors JSON header;
- 144 tensors, all `F16`;
- 702,570,496 tensor-data bytes;
- contiguous, non-overlapping offsets across the complete data section;
- 4 `image_proj` and 140 `ip_adapter` tensor entries;
- 70 paired key/value adapter projections;
- the complete sorted tensor-name set; and
- exact header, metadata, namespace, selected-shape, and tensor-name
  digests.

The exact-artifact smoke reruns this observation only when the IP-Adapter and
its prerequisite ControlNet and LoRA server-owned paths are injected;
otherwise it reports a fail-closed skip. The shared inspector returns no raw
header, metadata, full tensor-name map,
tensor bytes, path, URL, filename, credential, or locator. The process-bound
server reader is single-use.

## Structural finding and limitation

The selected structure includes:

- an `8192 x 1280` image-projection matrix;
- a 2,048-wide normalization/output space;
- 140 adapter projections with 2,048-wide context input;
- 20 projections with output width 640; and
- 120 projections with output width 1,280.

The bounded namespace inspection found the generic `image_proj` and
`ip_adapter` structure and did not find a FaceID or InsightFace namespace.
That is structural evidence about this exact object, not a claim about every
upstream workflow, extension, or companion model.

The safetensors object has no embedded metadata naming its exact model
family. The immutable model card must still be bound to the exact companion
CLIP Vision encoder, and the complete bundle must pass a controlled ComfyUI
load and generic-reference-conditioning behavior benchmark.

## Scope

This observation advances the third artifact in the five-artifact candidate
set:

- independently byte-verified artifacts: 3 of 5;
- safetensors schemas inspected: 3 of 5;
- complete bundle byte verification: false; and
- exact bundle compatibility: unproven.

The SDXL base checkpoint and matching CLIP Vision checkpoint still require
independent full-byte and schema verification. The verified LoRA remains
compatibility-blocked because its embedded metadata names
`sdxl_base_v0-9`. The verified ControlNet still requires exact
configuration/model-card binding and a canny-behavior benchmark.

## Authority boundary

This contract can report only the exact controlled byte observation. It
does not:

- ingest, locate, mount, load, or execute a model artifact;
- qualify a ComfyUI extension, node bundle, or companion encoder;
- authorize FaceID, InsightFace, or real-person identity conditioning;
- qualify licensing or paid production use;
- select a Living Frame scene;
- create timing, SoundSync, estimate, cost, approval, snapshot, work, queue,
  asset, QA, render, provider, tool, or runtime authority; or
- perform image generation.

The next artifact step is independent verification of the pinned companion
CLIP Vision or SDXL base object. No partial observation may promote the
incomplete bundle.
