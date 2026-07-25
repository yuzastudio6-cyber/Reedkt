# Controlled Illustration Tool Qualification

Status: evaluation-only hypotheses
Production approval: none
Registry changes in this slice: none

## Purpose

Living Frame may need controlled illustration when an approved reusable asset,
deterministic drawing, or ordinary still-image edit cannot produce the required
character, pose, structure, or component separation.

This document classifies six candidates discussed during product design. It
does not say that six production tool identities should be added. Several are
models, adapters, checkpoints, or training/loading mechanisms that may belong
inside one future reviewed runtime profile and artifact manifest.

All code-license, model-weight, commercial-use, security, and runtime statements
below are working hypotheses. A later qualification must pin exact repository,
package, commit, model, checkpoint, workflow, and deployment versions and then
verify primary sources. Nothing here is installable, dispatchable, or approved.

## Existing ReeditPro capability context

The current production registry already represents relevant capabilities such
as:

- `torch_torchvision`
- `transformers`
- `birefnet`
- `sam2`
- `transparent_background`
- `rembg`
- `opencv`
- `kornia`
- `sharp`
- `svg_js`
- `remotion`

Living Frame should reuse qualified existing identities rather than duplicate
them. This first slice neither changes the registry count nor claims that any
existing profile is ready for a new Living Frame route.

## Candidate classification

| Candidate | Working classification | Possible role | Slice 1 status |
| --- | --- | --- | --- |
| ComfyUI | Execution host/orchestrator | Execute a pinned node workflow in an isolated backend/GPU boundary | Evaluation only |
| `comfyui_controlnet_aux` | Preprocessing bundle | Produce pose, depth, edge, line-art, or segmentation controls for a qualified workflow | Evaluation only |
| ControlNet | Model/adapter/checkpoint capability | Condition image generation on spatial structure | Evaluation only |
| IP-Adapter | Model/adapter/checkpoint capability | Condition generation on approved image references and visual identity | Evaluation only |
| PuLID | Identity adapter/checkpoint capability | Potentially preserve an approved identity representation | Evaluation only and safety-blocked |
| PEFT/LoRA | Training/loading mechanism | Load or train bounded low-rank adaptation artifacts under an approved policy | Evaluation only |

The last four are not automatically separate `ProductionToolId` values. A
future decision must determine whether they are:

- artifacts loaded by an existing model-runtime identity;
- capabilities declared by one controlled-illustration runtime profile;
- preprocessing or training operations requiring separate canonical
  admission; or
- rejected after qualification.

## Required routing principle

The later planner must use this order:

```text
reuse approved component
  -> deterministic vector, map, diagram, particles, or composition
  -> approved still generation or editing
  -> qualified controlled illustration
  -> bounded generated video only when deterministic motion is insufficient
```

The model or workflow does not choose its own route. The canonical planner
requests an abstract capability. The existing backend tool strategy and
dispatch authority select an approved profile only after estimate and approval.

No frontend code may call a controlled-illustration host.

## Candidate hypotheses

### ComfyUI

Working hypothesis:

- It can serve as a node-graph workflow host with API-oriented execution.
- A pinned workflow could combine a base model, approved image references,
  pose/depth/edge conditioning, and bounded image outputs.
- Its code repository currently advertises GPL-3.0, but exact deployment and
  distribution implications require legal review.
- Custom nodes create a material supply-chain and arbitrary-code risk.

Required controls:

- isolated backend or worker boundary;
- no caller-supplied workflow graphs;
- allowlisted node types and exact versions;
- no dynamic custom-node install;
- locked outbound network policy;
- immutable workflow digest;
- immutable model/checkpoint manifest;
- GPU/runtime resource ceilings;
- private input/output storage;
- provider/tool cost receipts through existing infrastructure;
- deterministic retry and idempotency policy; and
- explicit license and commercial-use evidence.

Primary-source starting point:

- <https://github.com/comfyanonymous/ComfyUI>

### `comfyui_controlnet_aux`

Working hypothesis:

- It is a preprocessing bundle for controls such as pose, depth, edges, and
  line art.
- Its repository currently advertises Apache-2.0 for code, but bundled or
  downloaded models may have separate terms.
- It is not a creative planner and must not become a source of story intent.

Required controls:

- exact preprocessor allowlist and versions;
- model artifact inventory and digests;
- source/output dimension and orientation checks;
- deterministic preprocessing settings;
- no unreviewed downloads at execution time;
- source privacy and retention policy; and
- structure-control QA against the approved Scene Design Sheet.

Primary-source starting point:

- <https://github.com/Fannovel16/comfyui_controlnet_aux>

### ControlNet

Working hypothesis:

- It can condition diffusion generation using approved spatial controls such as
  pose, depth, edge, segmentation, or line art.
- The reference implementation currently advertises Apache-2.0 for code.
- Model weights, derivatives, and base-model combinations require separate
  exact-version license and commercial-use review.

Required evidence:

- pose and sword-angle compliance;
- depth and edge-control fidelity;
- no identity or style drift beyond approved thresholds;
- base-model and checkpoint compatibility;
- full artifact provenance;
- reproducibility policy;
- controlled failure behavior; and
- animation-aware separability score.

Primary-source starting point:

- <https://github.com/lllyasviel/ControlNet>

### IP-Adapter

Working hypothesis:

- It can supply image-prompt conditioning alongside text and compatible
  structural controls.
- It may help preserve an approved character interpretation, clothing, object
  design, or style.
- Its repository currently advertises Apache-2.0 for code, while checkpoints
  and base models need separate review.

Required evidence:

- character, object, clothing, and palette continuity;
- reference contribution and leakage tests;
- multi-reference conflict behavior;
- pose-control interoperability;
- source consent and provenance;
- exact checkpoint manifest; and
- failure thresholds that trigger regeneration or a deterministic fallback.

Primary-source starting point:

- <https://github.com/tencent-ailab/IP-Adapter>

### PuLID

Working hypothesis:

- It may provide identity-oriented conditioning for compatible image models.
- Its repository currently advertises Apache-2.0 for code.
- Its own project notes and future benchmarking must be consulted for identity
  fidelity limits.
- Base-model and checkpoint terms remain separate.

This route is blocked beyond ordinary technical qualification. It requires:

- explicit consent and permitted-use policy;
- real-person and public-figure likeness rules;
- minor protection;
- deepfake and impersonation safeguards;
- retention and deletion policy for identity references and embeddings;
- documentary and evidentiary-use restrictions;
- disclosure policy for illustrative reconstructions;
- anti-harassment and sexual-content safeguards;
- auditability and user review; and
- legal approval for the exact deployment.

Historical figures without photographic identity, such as Miyamoto Musashi,
must use an approved canonical illustrative interpretation. PuLID may not turn
that interpretation into a claim of verified historical likeness.

Primary-source starting point:

- <https://github.com/ToTheBeginning/PuLID>

### PEFT/LoRA

Working hypothesis:

- PEFT is a training/loading framework for parameter-efficient adaptation, and
  LoRA is one adaptation method.
- The current Hugging Face PEFT repository advertises Apache-2.0 for code.
- A LoRA artifact inherits constraints from its source data, base model,
  training process, and distribution terms; framework licensing alone is
  insufficient.

Required controls:

- training data rights and consent;
- base-model compatibility and license;
- exact adapter artifact digest;
- dataset manifest without private source leakage;
- training and inference resource limits;
- retention and deletion;
- overfitting/memorization tests;
- style and identity safety;
- approved loading locations; and
- no caller-provided adapter artifact.

Primary-source starting point:

- <https://github.com/huggingface/peft>

## Qualification matrix

Every candidate route must produce evidence in these areas:

| Area | Required evidence |
| --- | --- |
| Capability | The route measurably improves an approved Living Frame need |
| Character continuity | Face, hair, clothing, proportions, props, and handedness remain within approved bounds |
| Style continuity | Palette, line, shadow, texture, light, and detail match the Style Bible |
| Pose and structure | Approved skeleton, camera, object angle, depth, and composition are followed |
| Component separation | Outputs support clean decomposition, pivots, masks, and hidden-area reconstruction |
| Alpha | Native or postprocessed alpha passes multi-background and edge QA |
| Reproducibility | Workflow, seeds when supported, versions, settings, and artifacts are frozen |
| Provenance | Inputs, references, model artifacts, and accepted output lineage are complete |
| Security | No arbitrary nodes, code, commands, URLs, downloads, or caller-selected workflows |
| Privacy | Inputs and identity references follow private storage and retention policy |
| License | Exact code, model, checkpoint, data, output, and commercial terms are reviewed |
| Runtime | GPU memory, latency, concurrency, timeout, cancellation, and recovery are bounded |
| Cost | Internal cost per accepted component and retry is measurable |
| Quality | Semantic, continuity, separability, anatomy, typography, and destination-composite QA pass |
| Safety | Identity, documentary, misleading-evidence, and prohibited-content policies pass |
| Maintenance | Version pinning, migrations, rollback, and deprecation are defined |

## Benchmark scenes

Qualification should compare at least these controlled scenes:

1. Musashi hero pose and decisive strike component pack.
2. The same approved Musashi interpretation from a materially different pose.
3. A helicopter with separable body, main rotor, tail rotor, and background.
4. A figure with hair, fingers, cloth, and a thin weapon over dark and light
   destinations.
5. A non-identity stylized character across multiple scenes.
6. An exact map scene to prove that controlled illustration is not selected
   when deterministic geography is required.
7. An emotional monologue to prove deliberate non-use.

For each route compare:

- accepted outputs per attempt;
- time and internal cost per accepted component;
- continuity score;
- pose/structure score;
- separability score;
- alpha score;
- human review time;
- revision cost;
- reproducibility;
- safety failures; and
- reuse in later scenes.

The business metric is cost per approved, revision-ready, reusable scene—not
cost per model invocation.

## Alpha qualification

No route may treat a checkerboard image as transparency. Each accepted
component must identify:

- opaque plate, native alpha, still mask, temporal mask, procedural alpha, or
  additive effect;
- straight or premultiplied alpha at the renderer boundary;
- extraction and refinement lineage;
- matte decontamination status;
- multi-background QA results; and
- destination-scene QA results.

Native alpha, when an exact provider/model version supports it, is still an
unverified claim until it passes QA. If native alpha is unsupported or fails,
the approved route must generate a separable source and use the existing
qualified foreground/mask/image-processing capabilities.

## Runtime admission criteria

A candidate remains evaluation-only until all of these are true:

- exact versions and artifacts are pinned;
- primary-source license and commercial-use reviews are recorded;
- security and privacy review passes;
- model-weight policy and artifact manifests are complete;
- benchmark evidence passes predetermined thresholds;
- canonical capability and work-item schema admission is approved;
- the existing tool registry references the route without duplication;
- backend-only dispatch and secrets are proven;
- internal cost metering is mapped;
- approval/snapshot gating is proven;
- private artifact QA and Remotion review are proven; and
- deterministic fallbacks are tested.

Passing those checks would authorize only the reviewed route. It would not
promote every candidate, permit dynamic plugins, or make identity conditioning
generally available.

## Slice 1 conclusion

No candidate is installed, registered, routed, dispatched, or production-ready
in this slice. The Living Frame contract carries abstract capability
expectations only. Canonical planner, estimate, approval, snapshot, work-graph,
tool, provider, cost, asset, QA, and private-review gates remain closed.
