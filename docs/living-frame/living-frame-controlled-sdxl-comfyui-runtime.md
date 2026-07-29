# Living Frame controlled SDXL ComfyUI runtime

Status: implemented private host adapter; not registered, dispatched, deployed,
or production-qualified.

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
- canonical read-only model/input mounts;
- create-only output persistence and asset-manifest binding;
- real GPU resource-usage evidence;
- opaque-to-alpha processing where required;
- end-to-end private review and release evidence.

No second worker, queue, tool registry, timing system, approval system, cost
ledger, asset manifest, or renderer is introduced.
