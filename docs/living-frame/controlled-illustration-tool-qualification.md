# Controlled Illustration Tool Qualification

Status: evaluation-only requirements plus dated controlled source observations
Production approval: none
Registry changes in this slice: none
Contract: `living-frame-controlled-illustration-qualification-v2`
Source observation contract:
`living-frame-controlled-illustration-source-observation-v2`

## Purpose

Living Frame may need controlled illustration when an approved reusable asset,
deterministic drawing, or ordinary still-image edit cannot produce the required
character, pose, structure, or component separation.

This document classifies six candidates discussed during product design. It
does not say that six production tool identities should be added. Several are
models, adapters, checkpoints, or training/loading mechanisms that may belong
inside one future reviewed runtime profile and artifact manifest.

The v2 source packet was rebuilt on 2026-07-28. The AuraFace model-card
observation was read at the exact revision below; the other candidate
observations retain their prior exact revisions and digests.
That packet is not a release pin, package lock, artifact manifest, independent
source reread, model-weight manifest, legal review, or qualification.
Code-license labels and model-card statements are dated observations, not
current truth or legal/commercial approval. A later canonical authority must
reread every exact source, select and hash every executable artifact and
dependency, and reverify the relevant terms before admission. Nothing here is
installable, dispatchable, or approved.

## Controlled revision observations

The browser-shareable packet stores only closed locator codes, immutable
revision hashes, document-content digests, and literal non-authority fields.
It contains no URL or filesystem path. These documentation links are included
only so a later reviewer can independently reread the primary source.

| Controlled locator | Immutable revision bound in the 2026-07-28 packet | What was observed |
| --- | --- | --- |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | `806e092ed42772e4ce7abf44c97c50021cc4bd10` | Repository source and declared `LICENSE` label |
| [`comfyui_controlnet_aux`](https://github.com/Fannovel16/comfyui_controlnet_aux) | `e8b689a513c3e6b63edc44066560ca5919c0576e` | Repository source and declared `LICENSE.txt` label |
| [ControlNet source](https://github.com/lllyasviel/ControlNet) | `ed85cd1e25a5ed592f7d8178495b4483de0331bf` | Repository source and declared `LICENSE` label |
| [ControlNet v1.1 collection](https://huggingface.co/lllyasviel/ControlNet-v1-1) | `69fc48b9cbd98661f6d0288dc59b59a5ccb32a6b` | Model-card license label; no checkpoint bytes verified |
| [IP-Adapter source](https://github.com/tencent-ailab/IP-Adapter) | `62e4af9d0c1ac7d5f8dd386a0ccf2211346af1a2` | Repository source and declared `LICENSE` label |
| [Generic IP-Adapter collection](https://huggingface.co/h94/IP-Adapter) | `018e402774aeeddd60609b4ecdb7e298259dc729` | Generic model-card label; no FaceID promotion |
| [IP-Adapter-FaceID](https://huggingface.co/h94/IP-Adapter-FaceID) | `43907e6f44d079bf1a9102d9a6e56aef7a219bae` | Research-only/non-commercial statement tied to InsightFace |
| [AuraFace v1](https://huggingface.co/fal/AuraFace-v1) | `af6d057c9b0ec4071d4c49c80e3539258798b609` | Model-card Apache-2.0 label, intended use, training-data description, limitations, and benchmark claims; no model bytes or rights verified |
| [InsightFace](https://github.com/deepinsight/insightface) | `1456819742fd09bc4ad5293856a143a3e807c78e` | README distinction between code and pretrained model/training-data use |
| [PEFT](https://github.com/huggingface/peft) | `051b2c5d9f2a94413418e6a8f65881bb2e31bc71` | Framework source and declared `LICENSE` label |

The packet also records the observed document-content SHA-256 values, but
those hashes prove only which text the controlled fixture described. They do
not prove artifact integrity, legal interpretation, commercial suitability,
redistribution permission, current upstream state, or production readiness.

At the observed auxiliary-bundle revision, the source inventory included 667
Python files, 16 license files, and eight model-like files. That is evidence
that the bundle cannot be admitted under one package label: every copied
annotator, embedded artifact, downloaded checkpoint, dependency, and runtime
behavior remains separately unresolved.

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

| Candidate | Working classification | Primary-source observation | Status |
| --- | --- | --- | --- |
| ComfyUI | Execution host/orchestrator | At the controlled 2026-07-26 observation, the `Comfy-Org/ComfyUI` repository labeled core code GPL-3.0 | Evaluation only |
| `comfyui_controlnet_aux` | Preprocessing bundle | Repository labels its own code Apache-2.0 and states that it connects copied annotator code to downloaded assets; every annotator source and checkpoint remains separately unqualified | Evaluation only |
| ControlNet | Model/adapter/checkpoint capability | Reference code repository labels code Apache-2.0; the referenced ControlNet v1.1 weight collection labels itself OpenRAIL | Evaluation only |
| IP-Adapter | Model/adapter/checkpoint capability | Base code and the referenced generic `h94/IP-Adapter` artifact label themselves Apache-2.0; that observation cannot promote FaceID variants | Evaluation only |
| AuraFace | Identity-continuity measurement capability | The exact model card labels the repository Apache-2.0 and describes commercial/public training sources, limitations, demographic variability, and privacy obligations; those statements are controlled observations, not independent rights, fairness, or production qualification | Evaluation only and measurement-only |
| PEFT/LoRA | Training/loading mechanism | PEFT repository labels framework code Apache-2.0; a LoRA artifact still depends on base-model, data, training, and distribution terms | Evaluation only |

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
- At the controlled 2026-07-26 observation, its repository labeled the core
  GPL-3.0, but exact deployment and
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

Primary-source starting points:

- <https://github.com/Comfy-Org/ComfyUI>
- <https://github.com/Comfy-Org/ComfyUI/blob/master/LICENSE>

### `comfyui_controlnet_aux`

Working hypothesis:

- It is a preprocessing bundle for controls such as pose, depth, edges, and
  line art.
- Its repository labels the code Apache-2.0, but bundled or
  downloaded models may have separate terms.
- It is not a creative planner and must not become a source of story intent.

Required controls:

- exact preprocessor allowlist and versions;
- independent source pin and license review for every copied annotator;
- model artifact inventory and digests;
- independent pin, digest, and license review for every downloaded checkpoint;
- source/output dimension and orientation checks;
- deterministic preprocessing settings;
- no unreviewed downloads at execution time;
- source privacy and retention policy; and
- structure-control QA against the approved Scene Design Sheet.

Primary-source starting point:

- <https://github.com/Fannovel16/comfyui_controlnet_aux>
- <https://github.com/Fannovel16/comfyui_controlnet_aux/blob/main/LICENSE.txt>

### ControlNet

Working hypothesis:

- It can condition diffusion generation using approved spatial controls such as
  pose, depth, edge, segmentation, or line art.
- The reference repository labels its code Apache-2.0.
- The referenced Hugging Face weight collection labels itself OpenRAIL.
  Model weights, derivatives, annotators, and base-model combinations require separate
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
- <https://github.com/lllyasviel/ControlNet/blob/main/LICENSE>
- <https://huggingface.co/lllyasviel/ControlNet-v1-1>

### IP-Adapter

Working hypothesis:

- It can supply image-prompt conditioning alongside text and compatible
  structural controls.
- It may help preserve an approved character interpretation, clothing, object
  design, or style.
- Its repository labels code Apache-2.0, and the referenced `h94/IP-Adapter`
  model card labels that artifact Apache-2.0. Checkpoints
  and base models need separate review.
- The official IP-Adapter-FaceID model card describes its FaceID models as
  research-only and non-commercial because they use InsightFace. The generic
  IP-Adapter code or model-card label must never promote a FaceID workflow.

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
- <https://github.com/tencent-ailab/IP-Adapter/blob/main/LICENSE>
- <https://huggingface.co/h94/IP-Adapter>
- <https://huggingface.co/h94/IP-Adapter-FaceID>

### AuraFace

Working hypothesis:

- AuraFace is a face-embedding model used only to measure identity continuity
  between approved references and generated candidates.
- It is not a generator, identity adapter, likeness creator, or approval
  authority. Generic IP-Adapter plus the approved Visual Continuity Pack remain
  the reference-conditioning route.
- The exact `fal/AuraFace-v1` model card labels the repository Apache-2.0 and
  describes the model as trained on commercial and publicly available sources.
  That self-description does not independently prove training-data rights,
  consent, demographic fairness, privacy compliance, or commercial
  suitability for ReeditPro.
- The model card reports ethnicity-dependent performance and training-data
  limitations. ReeditPro therefore needs project-calibrated thresholds and
  human review rather than a universal similarity threshold.
- Every runtime dependency, face detector, aligner, ONNX artifact, and
  preprocessing implementation requires independent artifact and license
  qualification.

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
must use an approved canonical illustrative interpretation. AuraFace may
compare that interpretation with later illustrations, but it cannot turn the
interpretation into verified historical likeness or evidence.

Primary-source starting point:

- <https://huggingface.co/fal/AuraFace-v1>
- <https://huggingface.co/fal/AuraFace-v1/blob/af6d057c9b0ec4071d4c49c80e3539258798b609/README.md>
- <https://huggingface.co/fal/AuraFace-v1/blob/af6d057c9b0ec4071d4c49c80e3539258798b609/LICENSE.md>
- <https://huggingface.co/blog/isidentical/auraface>

### Superseded identity candidate

PuLID is no longer a Living Frame controlled-illustration candidate. The v2
contract replaces it with AuraFace because ReeditPro needs a separately
measured continuity signal, not another identity-generation adapter. Historical
PuLID observations do not authorize installation, fallback, or dispatch.

### PEFT/LoRA

Working hypothesis:

- PEFT is a training/loading framework for parameter-efficient adaptation, and
  LoRA is one adaptation method.
- At the controlled 2026-07-26 observation, the Hugging Face PEFT repository
  labeled framework code Apache-2.0.
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
- <https://github.com/huggingface/peft/blob/main/LICENSE>

## Current GPT Image 2 alpha boundary

The current `gpt-image-2` model reference says transparent backgrounds are not
supported. Living Frame must not request or claim native transparent output
from that exact model.

The current planning requirement is:

```text
opaque, separable GPT Image 2 source
  -> qualified segmentation or matting
  -> edge and matte-color decontamination
  -> true-alpha artifact
  -> black, white, gray, saturated, and destination-background QA
```

The image-editing guide also says a provider mask guides the edit but does not
need to match the target shape precisely. A provider edit mask is therefore
not the production matte.

Primary-source starting points:

- <https://developers.openai.com/api/docs/models/gpt-image-2>
- <https://developers.openai.com/api/docs/guides/image-generation#customize-image-output>
- <https://developers.openai.com/api/docs/guides/image-generation#edit-images>

This is a source requirement, not a provider adapter, model qualification,
runtime route, or production approval. A future image model may use native
alpha only after its exact operation supports it and the same alpha QA passes.
The source-observation packet does not attempt to convert this documentation
statement into provider capability authority. The existing opaque-only
qualification boundary remains fail-closed and must be reread by the future
canonical provider/model authority.

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

`gpt-image-2` must use the opaque-source route described above. Native alpha
from a different future exact model/operation remains unverified until its
capability is confirmed and the same QA passes.

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

## Qualification contract conclusion

The v2 contract records the six candidates as classified, evaluation-only
requirements. It does not claim six `ProductionToolId` values. It requires
exact future artifact inventories, license scopes, safety reviews, and
benchmarks while fixing every installation, registry, operation, dispatch,
runtime, and production authority to false.

No candidate is installed, package-pinned, artifact-pinned, independently
verified, registered, routed, dispatched, or production-ready in this slice.
The controlled revision observations do not alter the canonical model-weight
manifest, including the separately discovered fail-closed
`transparent-background`/`rembg` manifest gap. Canonical planner, estimate,
approval, snapshot, work-graph, tool, provider, cost, asset, QA, and
private-review gates remain closed.
