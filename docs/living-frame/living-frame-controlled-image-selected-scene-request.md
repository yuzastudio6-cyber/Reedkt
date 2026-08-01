# Living Frame controlled-image selected-scene request

Status date: 2026-07-29

Status:
`selected_scene_request_projected_operation_admission_pending`

This contract closes the planning gap between an approved Living Frame scene
and the future canonical ComfyUI operation. It is a server-derived,
non-executable request projection. It does not register ComfyUI, create an
approved operation binding, dispatch a worker, or create an asset. A separate
server-only materializer can now consume this projection plus the
confirmed-frame ratio extension and create a process-bound private
prompt-request lease. That later bridge does not make this base projection
executable.

## Required lineage

The compiler revalidates:

- the canonical approved-snapshot lineage binding;
- the selected Living Frame scene and its Visual Continuity Pack digest;
- the current execution requirements and MasterTiming lineage;
- the component asset/work binding;
- the canonical estimate and controlled-illustration cost/work binding;
- the canonical pending work graph;
- the exact generated asset intent and expected output; and
- the confirmed final output-frame expectation.

The resulting receipt contains digests and server-owned locator identities,
not raw chat, prompt text, image bytes, model bytes, paths, URLs, commands,
credentials, or caller-selected model names.

## One request unit per generated component

Each generated opaque still output becomes one request unit. A request unit
binds:

- one scene, component, asset intent, pending work item, and output key;
- the semantic direction digest;
- the animation-aware component direction digest;
- the approved Visual Continuity Pack digest when reference or identity
  conditioning is required;
- the exact private slot kinds needed by the component;
- the final output-frame expectation;
- one-image-per-attempt behavior; and
- the existing downstream alpha, QA, manifest, private-review, and Remotion
  requirements.

The server derives the private slot policy from the selected component:

```text
base still generation
  -> base checkpoint + private positive/negative conditioning

structure-conditioned illustration
  -> ControlNet checkpoint + externally prepared control image

reference- or identity-conditioned illustration
  -> generic IP-Adapter + CLIP Vision + approved reference image

approved low-rank adapter use
  -> LoRA artifact slot
```

FaceID and unapproved identity adapters remain forbidden. AuraFace is not a
generation slot; it remains separate optional CPU continuity QA.

## Frame-aware restraint

The currently qualified controlled SDXL operation proves a square
`1024 × 1024` component output, not arbitrary full-frame generation.

Isolated subjects and separable components may therefore project as
`isolated_component_square_1024`. Components whose role is a source still,
opaque background plate, or reconstructed background plate remain
`blocked_by_full_frame_generation_canvas_extension`.

This deliberate state remains on the base selected-scene request. The
namespaced full-frame ratio extension consumes it and derives qualification
units at the exact confirmed `16:9`, `9:16`, or custom-frame dimensions. It
does not mutate the base request or make those units executable. A professional
Living Frame scene must never silently force a non-square confirmed
composition into a generic square image.

ComfyUI never owns the final video canvas. Remotion remains the final
deterministic compositor.

## Benchmark separation

The controlled SDXL compatibility benchmark remains useful for model, node,
and graph qualification. It cannot substitute for this selected-scene
request.

The selected-scene request has exact approval, scene, component, asset,
continuity, timing, frame, estimate, and work lineage that a benchmark case
does not have.

The server-private selected-scene materializer now compiles the already
qualified graph family independently from these exact request units. It
explicitly records that no benchmark case or recipe was used. See
`docs/living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization.md`.

## Cost and operation boundary

The projection expects exactly one canonical production identity:

```text
tool: comfyui
operation: tool.comfyui.generate_controlled_image.v1
work item: generate_image_asset
worker: gpu_ai_worker
accelerator: one NVIDIA L4
```

ComfyUI, deterministic control-image preparation, ControlNet, generic
IP-Adapter, and LoRA loading share one GPU-attempt lifetime. They do not
become five tool charges. AuraFace remains separately attributable optional
CPU QA.

The five model roles still resolve through the canonical model manifest and
read-only model mounts. They do not travel in ordinary request artifact
bindings.

## Remaining gates

The request projection is implemented, but execution remains closed until:

- the backend registry owner admits the one ComfyUI identity and operation;
- the approved work item receives that exact operation binding;
- the fixed supervised-process entrypoint is represented canonically;
- the signed, scanned, non-root image is released;
- the exact model manifest is mounted read-only;
- license and paid-use review passes;
- private GPU dispatch and worker leases exist;
- actual worker resource-cost receipts exist;
- generated artifacts pass QA and asset-manifest reconciliation;
- private review succeeds; and
- the final Remotion composition passes its existing gates.

Full-frame plate request units additionally require the qualified frame-ratio
generation evidence described above. The ratio extension contract is now
implemented, but L4 memory/latency/output-quality qualification and the normal
release gates remain required.

The private selected-scene materialization bridge is also implemented. It
creates one process-bound single-use prompt-request lease per approved
generated output and nothing more: operation registration, dispatch, runtime,
cost, persistence, QA approval, private review, final composition, and
production remain closed.
