# Living Frame Private ComfyUI Prompt Materialization

## Purpose

`living-frame-controlled-sdxl-private-prompt-materialization-v1` closes the
source-level gap between the subject-neutral graph blueprint and a future
private GPU operation. It converts one current generation-case graph into
ComfyUI API-format prompt JSON while keeping all model aliases, image aliases,
and conditioning text behind a process-bound, single-use lease.

This is real deterministic prompt compilation. It is not tool registration,
GPU dispatch, model inference, asset generation, cost evidence, or production
qualification.

## Server-owned input

The caller supplies only a bounded server-owned locator. A process-bound reader
must reread:

- the current graph-blueprint identity and digest;
- one exact generation recipe and its digest;
- the confirmed output-frame expectation digest;
- every model, conditioning, control-image, and reference-image slot required
  by that recipe.

Caller graph JSON, prompt text, model aliases, image aliases, paths, URLs,
credentials, provider IDs, tool IDs, prices, and operation routes are not
accepted.

## Exact materialization

External graph slots become private values:

- model slots become private `.safetensors` aliases;
- positive and negative conditioning slots become bounded private text;
- control and reference image slots become private `.png` aliases;
- node-output references remain exact `[nodeId, outputIndex]` edges;
- literal sampler and control values remain those frozen in the graph.

Only the graph blueprint's closed node classes are accepted. Every node stays
topological, every external slot is resolved exactly once, and the only output
node remains `SaveImageWebsocket`.

The public receipt stores only SHA-256 digests, byte lengths, node counts,
slot classes, and source lineage. It never stores the private values.

## Single-use lease

The compiled prompt is held in a non-serializable, process-bound lease. A
future canonical GPU operation may consume that lease once. A copied object,
JSON packet, reused lease, or caller-supplied prompt cannot qualify.

The lease itself grants no operation, dispatch, runtime, provider, work,
queue, cost, asset, approval, or production authority.

## Pricing relationship

One consumed prompt lease is intended to correspond to one future shared
ComfyUI GPU attempt. ControlNet Aux, ControlNet, IP-Adapter, and LoRA loading
remain capabilities inside that same host attempt; they do not create
independent tool charges. This contract does not calculate or mint a price.
The canonical Living Frame estimate and actual worker-resource receipt remain
the only cost authorities.

AuraFace is not present in the ComfyUI prompt. When identity continuity
measurement is required, it remains a separate post-generation CPU QA step.

## Closed gates

The following remain required:

- current graph-blueprint repository reread;
- current GPU node-schema revalidation;
- scanned and signed dependency-locked GPU image;
- distributed private read-only model mount;
- canonical ComfyUI operation registration;
- released GPU attempt and worker-resource cost evidence;
- canonical metric attestation;
- paid-use and license review;
- selected-scene, approved-snapshot, work, asset, QA, and private-review
  admission.

No cloud, provider, model, queue, billing, settlement, render, or deployment
action is authorized by this contract.
