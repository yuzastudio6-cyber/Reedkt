# Living Frame controlled SDXL base byte observation

Status: exact server-owned byte and safetensors-structure observation;
controlled, non-promotable, non-executable.

Contract:
`living-frame-controlled-sdxl-base-byte-observation-v1`.

## Outcome

The retained controlled observation records a complete independent stream of
the pinned SDXL base candidate and verified:

- 6,938,078,334 bytes;
- SHA-256
  `31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b`;
- a 402,436-byte safetensors JSON header;
- 2,515 tensors, all `F16`;
- 6,937,675,890 tensor-data bytes;
- contiguous, non-overlapping offsets across the complete data section;
- 587 `conditioner`, 248 `first_stage_model`, and 1,680 `model`
  tensor entries; and
- exact header, metadata, namespace, selected-shape, and tensor-name
  digests.

The exact-artifact smoke reruns the complete five-role chain only when every
server-owned model path is injected; otherwise it reports a fail-closed skip.
The shared inspector returns no raw header, metadata, embedded thumbnail,
full tensor-name map, tensor bytes, path, URL, filename, credential, or
locator. The process-bound server reader is single-use.

## Model-spec and structural findings

Six exact metadata values were verified inside the artifact:

- SAI model spec `1.0.0`;
- architecture `stable-diffusion-xl-v1-base`;
- title `Stable Diffusion XL 1.0 Base`;
- resolution `1024x1024`;
- prediction type `epsilon`; and
- license label `CreativeML Open RAIL++-M License`.

These are observations about the exact object's embedded metadata, not an
independent legal opinion or production-use approval.

The selected tensor structure contains:

- 768- and 1,280-wide text-conditioning embeddings;
- a 2,048-wide cross-attention context;
- a 2,816-wide additional-conditioning input;
- four latent channels;
- three image channels; and
- the expected text-conditioner, VAE, and diffusion-model namespaces.

The full artifact digest, not any embedded hash claim, is the identity used
by this observation.

## Complete byte set versus compatible runtime

This is the fifth artifact in the five-artifact candidate set:

- independently byte-verified artifacts: 5 of 5;
- safetensors schemas inspected: 5 of 5;
- remaining unverified artifact codes: none;
- complete bundle byte verification: true; and
- exact bundle compatibility: unproven.

Complete byte verification does not mean that the five objects form a
working or production-qualified runtime. In particular:

- the selected LoRA's embedded metadata names `sdxl_base_v0-9`, while this
  exact base names SDXL 1.0;
- the ControlNet still requires immutable configuration/model-card binding
  and a canny-behavior benchmark;
- the generic IP-Adapter and CLIP Vision pair still requires an exact
  controlled ComfyUI load and reference-conditioning benchmark; and
- none of the objects has been ingested, mounted, or admitted by the
  canonical model-artifact repository and GPU operation.

## Authority boundary

This contract can report only exact controlled byte and structure
observations. It does not:

- ingest, locate, mount, load, or execute a model artifact;
- qualify a ComfyUI host, extension, node bundle, or combined workflow;
- authorize FaceID, InsightFace, AuraFace generation conditioning, or a
  real-person identity route;
- qualify licensing or paid production use;
- select a Living Frame scene;
- create timing, SoundSync, estimate, cost, approval, snapshot, work, queue,
  asset, QA, render, provider, tool, or runtime authority; or
- perform image generation.

The next evidence phase is a controlled complete-bundle load and behavior
qualification through the shared GPU-capable execution architecture. No
byte observation may promote the bundle into production.
