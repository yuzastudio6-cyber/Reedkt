# Living Frame Controlled SDXL Benchmark Graph Blueprint

## Purpose

The request blueprint identifies which server-owned values each compatibility
case needs. This graph blueprint adds the missing deterministic topology: the
exact nodes, node order, edge references, fixed benchmark parameters, external
slot references, and output policy for each case.

It is still not an executable ComfyUI request. It contains no conditioning
text, image pixels, model alias, filename, path, URL, credential, command,
provider route, tool route, operation ID, work item, queue item, or customer
cost.

## Parent Revalidation

The compiler revalidates four current parent contracts before projecting a
graph:

1. the seven-case subject-neutral benchmark request blueprint;
2. the stock `controlnet_lora_txt2img` ComfyUI graph expectation;
3. the reviewed generic IP-Adapter extension; and
4. the deterministic merged stock-plus-IP-Adapter graph.

The exact parent IDs and digests are bound into the result. A stale, forged,
cross-parent, or differently ordered parent fails closed.

## Case Topologies

| Case | Nodes | External slots | Topology |
|---|---:|---:|---|
| exact bundle load | 0 | 0 graph references | load verification only; the request blueprint retains five artifact slots |
| base baseline | 7 | 3 | checkpoint, two conditioning encoders, latent, sampler, decode, websocket output |
| LoRA probe | 8 | 4 | base topology plus LoRA loader |
| ControlNet probe | 10 | 5 | base topology plus ControlNet loader, server image loader, and ControlNet application |
| IP-Adapter probe | 11 | 6 | base topology plus CLIP Vision, generic IP-Adapter loader/application, and server reference image loader |
| full combined primary | 15 | 9 | all five model roles and both server image fixtures |
| full combined replay | 15 | 9 | byte-equivalent graph policy with the same replay seed |

Across the six generation cases, the blueprint contains 66 nodes and 36
external slot references. The request blueprint retains 41 unresolved slots
because the load-only case carries five model-artifact slots without a
generation graph.

## Fixed Benchmark Runtime Policy

Generation cases reuse the specification's fixed policy:

- 1024 by 1024 pixels;
- batch size 1;
- `dpmpp_2m`;
- `karras`;
- 24 steps;
- CFG 5.5;
- denoise 1; and
- the exact case seed.

LoRA strengths, ControlNet application parameters, and generic IP-Adapter
application parameters are copied from the independently revalidated current
parent graphs. The blueprint does not invent an alternative configuration.

## Closed Node Policy

Only these node classes are represented:

- `CheckpointLoaderSimple`
- `LoraLoader`
- `CLIPTextEncode`
- `ControlNetLoader`
- `LoadImage`
- `ControlNetApplyAdvanced`
- `EmptyLatentImage`
- `CLIPVisionLoader`
- `IPAdapterModelLoader`
- `IPAdapterAdvanced`
- `KSampler`
- `VAEDecode`
- `SaveImageWebsocket`

FaceID, InsightFace, unified/embedding loaders, in-graph preprocessors,
arbitrary preview/save nodes, and every node outside the closed allowlist are
forbidden. Control and reference images are represented only as unresolved
server-owned external slots. Output is websocket-only so a future private
runner can capture and hash the returned artifact without a caller-selected
filesystem target.

## Slot And Graph Safety

Every generation graph must:

- reference each request slot exactly once;
- contain no extra external slot;
- have unique, deterministic node IDs and order;
- reference only earlier nodes;
- have exactly one terminal `SaveImageWebsocket` node;
- remove disabled capabilities and rewire model/conditioning edges;
- keep generic IP-Adapter separate from FaceID and AuraFace; and
- remain subject-neutral.

The blueprint carries literal authority flags proving that it cannot
materialize values, dispatch work, create an asset, record cost, select a
scene, approve a plan, render, or claim production readiness.

## Remaining Runtime Gates

Execution still requires all of the following from existing canonical
authorities:

- the registered ComfyUI operation contract;
- exact canonical artifact repository identities and read-only mounts;
- a dependency-locked, scanned, signed GPU image;
- server-owned conditioning/control/reference fixtures;
- current runtime node schemas;
- private slot materialization;
- runtime allowlist enforcement;
- approved snapshot, work, lease, reservation, and idempotency bindings;
- released GPU attempt and internal-cost evidence;
- metric attestation;
- license and paid-use review; and
- canonical asset QA and private review.

The graph blueprint opens none of those gates.
