# Living Frame controlled ComfyUI workflow expectation

Status: controlled, source-bound, non-executable evaluation contract.

This slice records what the pinned stock ComfyUI source can express without
custom nodes. It does not install ComfyUI, load a checkpoint, create a provider
route, admit a tool, create work, write an asset, or authorize runtime
execution.

## Pinned source observation

The graph contract is bound to:

- ComfyUI revision
  `093d571b83e7a79833200e199b46b9f5a62217f9`;
- SHA-256
  `860b5aa27a99be08627c4f996b2852c998081473a54e7be4f24c6c421f667a8d`
  for `nodes.py` at that revision.

The controlled source inspection found built-in registrations for:

- `CheckpointLoaderSimple`;
- `LoraLoader`;
- `CLIPTextEncode`;
- `EmptyLatentImage`;
- `ControlNetLoader`;
- `ControlNetApplyAdvanced`;
- `KSampler`;
- `VAEDecode`.

It did not find a built-in IP-Adapter node or a built-in
`comfyui_controlnet_aux` preprocessor node. This is a dated source observation,
not current upstream truth or runtime qualification.

## Supported expectation profiles

The compiler emits one of four deterministic, generic, non-executable graphs:

1. `base_txt2img`;
2. `lora_txt2img`;
3. `controlnet_txt2img`;
4. `controlnet_lora_txt2img`.

Every graph:

- uses only the closed built-in node-class set above;
- contains no raw prompt, filename, path, URL, provider ID, tool ID, job ID,
  queue ID, or executable ComfyUI request;
- binds opaque SHA-256 expectations for future checkpoint, conditioning,
  control-image, LoRA, qualification, source-observation, and output-frame
  authorities;
- omits `LoadImage` so a browser/caller path cannot enter the graph;
- omits `SaveImage` so the source-only contract cannot write an artifact;
- keeps seed, sampler, scheduler, step count, CFG, and denoise settings behind
  future canonical runtime allowlists;
- sets `subjectSpecificRouting=false`.

The graph proves structure only. A digest-shaped checkpoint reference is not a
resolved model artifact and cannot become one without the canonical
model-weight and asset-manifest authorities.

## IP-Adapter and preprocessing boundary

The original controlled-illustration candidate family remains six capability
areas, not six presumed tool-registry entries. This source inspection narrows
their executable relationship:

- stock ComfyUI can host base generation, LoRA-only conditioning, ControlNet
  application, and combined ControlNet plus LoRA loading;
- `comfyui_controlnet_aux` remains a separately qualified custom-node and
  dependency bundle; it is not silently executable through stock ComfyUI;
- the currently admitted ControlNet graph shape does not require that custom
  bundle: it accepts only an externally prepared, content-addressed control
  image. Living Frame's deterministic Canny, source-bound uint16 depth, and
  COCO-17 pose rasterizers can produce measured bytes for that later artifact
  lane, while the canonical asset, evidence, QA, and dispatch gates remain
  closed;
- generic IP-Adapter needs either a separately qualified ComfyUI extension or
  a separately reviewed non-ComfyUI runtime route;
- AuraFace stays outside the generation graph as identity-continuity
  measurement and QA. It is not an IP-Adapter replacement and is not a
  generation-conditioning node.

The contract therefore retains the explicit blocker for the missing
IP-Adapter runtime binding. It does not claim custom preprocessing execution:
the v2 ControlNet profiles declare
`external_precomputed_control_image_only`, `controlNetAuxRequired=false`, and
`customPreprocessorRequired=false`. Requests that specifically need auxiliary
annotators are still blocked pending separate bundle, dependency, checkpoint,
and license qualification. The contract must never misrepresent the six
candidate areas as fully installed or end-to-end dispatchable.

## Closed authorities

The expectation grants no authority for source-current truth, installation,
packages, containers, weights, prompts, providers, tool registry, tool route,
operations, dispatch, selected scenes, timing, SoundSync, estimate, cost,
approval, snapshot, work items, work graph, queue, asset manifest, artifact
creation, QA approval, rendering, runtime, or production.

Those gates can open only through the existing canonical systems. They cannot
be opened by changing a boolean or by recomputing this expectation digest.
