# Living Frame controlled SDXL ComfyUI runtime

Status: implemented private host adapter and fixed process supervisor; not
registered, dispatched, deployed, or production-qualified.

## Purpose

Living Frame's controlled-illustration path uses one bounded ComfyUI graph for
five co-resident GPU capabilities:

1. the ComfyUI execution host;
2. `comfyui_controlnet_aux` preprocessing where the approved graph requires it;
3. ControlNet structure conditioning;
4. generic IP-Adapter reference conditioning;
5. PEFT/LoRA loading.

Those capabilities are not five billable provider calls. One accepted graph
request is one shared GPU attempt. AuraFace is a separate optional CPU
continuity measurement and is never part of the generation graph.

The new host adapter consumes the existing single-use private GPU request,
requires an already-consumed canonical private tool-dispatch authority, and
submits exactly one prompt to a fixed loopback ComfyUI host. It accepts no
caller endpoint, path, URL, credential, model bytes, runtime download, arbitrary
node class, or external network route.

## Fixed transport

The concrete server-only port talks only to the co-located loopback host:

- `POST /prompt` with the already-materialized graph and private client ID;
- `WS /ws?clientId=...` for execution events and the one
  `SaveImageWebsocket` PNG;
- best-effort `POST /interrupt` after the bounded 90-second timeout.

The adapter requires exactly one binary preview-image frame whose header
declares PNG, strips the eight-byte ComfyUI framing header, and decodes the PNG
with Sharp. Only one 1024 by 1024 PNG under 32 MiB passes.

The result receipt contains digests and measurements, never prompt text, model
aliases, private prompt ID, output bytes, paths, URLs, credentials, commands,
or customer commercial data. Output bytes are held behind a process-bound,
single-use lease for a future canonical artifact-persistence adapter.

## Fixed process lifecycle

The server now also owns the missing process boundary around that loopback
transport. The supervisor starts exactly one ComfyUI process for one accepted
attempt using fixed server source:

- one fixed Python executable and pinned ComfyUI `main.py`;
- loopback `127.0.0.1:8188` only;
- API nodes and metadata disabled;
- all custom nodes disabled before exactly the reviewed generic IP-Adapter and
  ControlNet auxiliary directories are whitelisted;
- fixed private input, model-path, runtime, and output locations;
- preview disabled, cache disabled, FP16 and CUDA device zero fixed;
- offline Hugging Face/Transformers flags and no caller environment merge;
- bounded stdout/stderr capture;
- a 60-second loopback readiness ceiling;
- guaranteed termination after the one host-runtime result or any failure.

The process port accepts no caller command, arguments, environment, path, URL,
credential, listen address, or download policy. Its serializable lifecycle
receipt contains only timestamps, counts, hashes, terminal process facts, and
closed authority flags. The fixed private subprocess remains unqualified until
the pinned source and wheel closure is actually packaged into the shared GPU
image and the L4 qualification gates pass.

## Offline package source closure

The repository now contains the source-controlled package inputs for that
future image under `docker/prod/gpu-worker/comfyui/`:

- an exact 35-entry, hash-pinned Linux wheel requirement lock;
- an exact three-archive provenance lock for ComfyUI, the generic IP-Adapter
  extension, and ControlNet auxiliary extension;
- an explicit offline build and runtime boundary.

A server-side source contract rereads those files, compares every wheel and
source observation with the existing dependency-lock evidence, binds the fixed
process-supervisor digest, and keeps image build, scan, signature, router
admission, mounts, GPU execution, actual cost, customer credits, and production
authority closed. Wheel binaries and source archives remain outside Git and
must enter the future clean build only through a reviewed canonical build-input
authority.

The package now also includes a no-argument offline installer and an exact
`extra_model_paths.yaml`. The installer reads only from
`/opt/reeditpro/build-inputs/comfyui`, verifies the complete wheel/source
closure, creates the process supervisor's fixed
`/opt/reeditpro/gpu-operations/comfyui` layout, and leaves model weights out of
the image. Model files remain under the existing canonical read-only artifact
authority, followed by a fixed operation projection under
`/mnt/reeditpro/model-artifacts`.

The measured local locked candidate image is useful compatibility evidence,
but its observed entrypoint and source layout are
`/usr/bin/python3 /opt/ComfyUI/main.py`. It therefore does not satisfy the
fixed package/process contract and cannot be relabeled as the canonical
runtime image. A later reviewed build must apply this fixed installer or
prove a byte-equivalent layout before router admission.

## Cost behavior

- completed, failed, and outcome-unknown attempts remain distinct terminal
  observations;
- timeout or lost connection after prompt acceptance is outcome-unknown, not
  free;
- the host adapter does not create cost evidence itself;
- the existing canonical worker-resource usage recorder must record the same
  execution-attempt ID;
- the Living Frame actual-cost reader then attributes that one GPU attempt to
  `shared_controlled_illustration_gpu_host`;
- exact reuse never reaches this adapter and creates no attempt;
- AuraFace CPU QA is separately metered only when the approved plan requests it;
- credits are aggregated and rounded once, with the ReeditPro service fee
  applied once by the existing settlement path.

## Opaque-to-alpha boundary

The generated PNG is treated as opaque source artwork. The adapter explicitly
rejects any claim that it created a transparent-background or true-alpha
artifact. When Living Frame needs compositing transparency, the approved
downstream route remains:

opaque generation → qualified segmentation/matting → edge decontamination →
true-alpha artifact → black/white/saturated/destination-composite QA.

## Closed gates

The runtime code is deliberately unreachable from the canonical execution
pipeline until the existing shared authorities admit:

- the `comfyui` canonical tool identity and
  `tool.comfyui.generate_controlled_image.v1` operation;
- a qualified L4 GPU worker image containing the exact pinned dependency and
  model-artifact closure;
- the fixed ComfyUI source, wheel lock, two reviewed custom-node source
  archives, model-path configuration, and process supervisor packaged into
  that image;
- canonical read-only model/input mounts;
- create-only output persistence and asset-manifest binding;
- real GPU resource-usage evidence;
- opaque-to-alpha processing where required;
- end-to-end private review and release evidence.

No second worker, queue, tool registry, timing system, approval system, cost
ledger, asset manifest, or renderer is introduced.
