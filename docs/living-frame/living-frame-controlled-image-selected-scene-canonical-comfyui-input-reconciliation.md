# Living Frame selected-scene canonical ComfyUI input reconciliation

Status date: 2026-07-30

Status:
`canonical_comfyui_candidate_input_lease_created_dispatch_blocked`

`living-frame-controlled-image-selected-scene-canonical-comfyui-input-reconciliation-v1`
is the final namespaced, non-executable bridge between the existing Living
Frame selected-scene private operation request and the canonical backend
`canonical-comfyui-gpu-runtime-request-candidate-v1` input accepted by commit
`bffa1ec0632fe26cd72ec4b8fe373bdcb38e353b`.

It does not copy or replace the canonical backend compiler, GPU router,
subprocess runner, registry, dispatch authority, work graph, asset manifest,
cost owner, QA owner, private-review owner, or Remotion compositor.

## Why this boundary was required

The selected-scene feature chain already provided:

- exact approved-snapshot and selected-scene lineage;
- one generated work item, output key, and planned manifest entry;
- a verified confirmed full-frame or isolated-component canvas;
- the exact controlled ComfyUI graph;
- five model artifact source-binding digests;
- zero to two approved external image artifacts;
- one private operation request per output;
- one process-bound single-use lease; and
- one-request/one-process/one-image/one-attempt semantics.

The canonical backend runtime envelope additionally requires four values that
the earlier feature request did not own:

1. the exact canonical runtime file aliases expected by the fixed ComfyUI
   layout;
2. decoded width and height metadata for each external input PNG;
3. the canonical work-item hash, not only the work-item ID and key; and
4. pending dispatch-intent, dispatch-binding, and attempt-plan hashes.

Those values cannot be invented from raw chat or caller input. The
reconciliation compiler therefore consumes a current server-owned binding
packet through a process-bound reader and fails closed if any value disagrees
with the selected scene, operation receipt, approved work item, output,
planned manifest entry, or confirmed frame.

## Canonical filename closure

The bridge accepts only the exact fixed runtime names:

| Role | Canonical runtime file |
| --- | --- |
| SDXL base | `sd_xl_base_1.0.safetensors` |
| ControlNet | `diffusion_pytorch_model.fp16.safetensors` |
| LoRA | `sd_xl_offset_example-lora_1.0.safetensors` |
| Generic IP-Adapter | `ip-adapter_sdxl.safetensors` |
| CLIP Vision | `model.safetensors` |
| External structure input | `control-image.png` |
| External continuity reference | `reference-image.png` |

All five model records must retain their exact content hashes, sizes, roles,
canonical order, and source-binding digests. Optional graph capabilities may
leave a model unused, but the five objects remain one atomic read-only mount
lifetime. Used aliases must appear exactly once in the graph; unused aliases
must not appear.

## Exact private candidate input

After revalidation, the compiler creates one process-bound single-use lease
containing a structurally exact candidate input for the canonical backend:

```text
admission digest
pending dispatch and attempt lineage
approved selected-scene lineage
canonical prompt graph + unique SaveImageWebsocket output node
five model source-binding digests
zero to two exact private input-image records
confirmed output canvas class and dimensions
```

The private value is suitable for the canonical backend owner to pass to
`createCanonicalComfyUiGpuRuntimeRequestCandidate` after one-writer
reconciliation. It is not a canonical runtime request by itself. The
serializable receipt contains digests, dimensions, counts, and lineage only;
it does not contain conditioning text, the prompt graph, model or image
aliases, paths, URLs, bytes, credentials, commands, environment, prices,
credits, reservations, wallets, or ledgers.

## Frame and graph requirements

The bridge mirrors the released canonical candidate envelope:

- isolated components are exactly `1024 × 1024`;
- confirmed full-frame requests are between 256 and 4096 pixels per axis;
- both dimensions are divisible by eight;
- the total canvas is at most 8,294,400 pixels;
- the graph contains one ordered selected-scene topology;
- one `SaveImageWebsocket` node is the only output;
- batching remains disabled; and
- ComfyUI produces one opaque still input, never the final video canvas.

The prompt remains the real selected-scene prompt materialized from the
approved work item. The compatibility benchmark path is not accepted.

## Authority boundary

The binding packet may carry pending dispatch and attempt hashes because the
canonical request-candidate schema requires them. Every authority remains
false:

- canonical runtime compiler invocation;
- operation registration;
- queue or dispatch authority;
- canonical worker lease;
- GPU attempt creation;
- runtime execution;
- resource or actual-cost receipt;
- output persistence;
- asset-manifest mutation;
- QA approval;
- private-review approval;
- render authority;
- final-canvas ownership; and
- production readiness.

The current output is a conformance projection and process-private input
lease, not a dispatch record.

## Adversarial coverage

The focused smoke now proves the real `1920 × 1080` selected full-frame unit
can be projected into the canonical candidate-input shape and rejects:

- missing or malformed work-item hashes;
- invalid or substituted input-image dimensions;
- relaxed pending dispatch boundaries;
- cross-work-item or cross-output substitution;
- extra final-canvas claims;
- copied or reused process-bound leases;
- non-canonical model or image aliases;
- non-canonical graph or output topology;
- invalid confirmed canvas dimensions; and
- prompt, path, byte, credential, billing, or production leakage into the
  receipt.

## Remaining internal-test gates

The feature-to-canonical request shape is now reconciled. The remaining
ComfyUI internal-test gates are external execution and evidence gates:

1. land this adapter at the canonical backend one-writer boundary;
2. provide canonical pending dispatch and work-item-hash records;
3. ingest and distribute the exact five model objects read-only;
4. use the released/scanned fixed image;
5. run one real NVIDIA L4 request;
6. persist and reread the output privately;
7. record resource and internal-cost evidence;
8. complete alpha, continuity, documentary-fact, destination-composite,
   manifest, and private-review QA; and
9. return the approved asset to Remotion for final composition.

Public delivery, customer billing, external beta, and production promotion
remain outside the current internal-testing goal.
