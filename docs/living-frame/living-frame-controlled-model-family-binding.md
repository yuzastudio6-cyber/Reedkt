# Living Frame controlled model-family binding

Status: deterministic, controlled, non-promotable compatibility expectation.

The controlled illustration stack now has one cross-graph check that prevents
obviously incompatible base-model, ControlNet, LoRA, generic IP-Adapter, and
CLIP Vision families from being described as one future workflow.

The binding independently revalidates the existing stock ComfyUI graph. When
the graph uses ControlNet, it also requires the existing deterministic
control-image-to-workflow binding. When generic IP-Adapter is requested, it
revalidates both the reviewed extension and the merged effective graph.

It then derives the exact ordered artifact slots and content-digest
expectations already present in those graphs. The only currently admitted
family combinations are:

- Stable Diffusion 1.5 with SD 1.5 ControlNet, LoRA, or generic IP-Adapter
  expectations and CLIP Vision ViT-H/14 for generic IP-Adapter; and
- Stable Diffusion XL base 1.0 with SDXL ControlNet, LoRA, or generic
  IP-Adapter expectations and CLIP Vision ViT-bigG/14 for generic IP-Adapter.

This is a coherence check, not artifact evidence. A caller-supplied family
label cannot prove what a checkpoint contains. The output therefore keeps
`currentArtifactMetadataPresent=false`,
`exactArtifactCompatibilityProven=false`, and every runtime authority false.

## Why this matters

Before this binding, each graph correctly retained an exact compatibility
manifest as an open gate, but no single contract rejected a structurally
valid graph whose future artifact slots were declared against different
model families. The new binding catches that contradiction before a future
worker can attempt a load.

It also keeps AuraFace outside generation conditioning. AuraFace remains the
separate identity-continuity measurement and QA capability. FaceID and
InsightFace routes are still prohibited.

## Still required

- the workflow-neutral canonical model-artifact repository;
- checksum- and size-protected read-only mounts;
- exact artifact manifest entries and independently verified metadata;
- dependency locks and legal review for every loaded artifact;
- offline host compatibility and quality benchmarks;
- canonical asset, work, dispatch, QA, approval, snapshot, and private-review
  binding.

The binding contains no model bytes, filenames, paths, URLs, prompts,
provider or tool identifiers, work or queue identifiers, cost fields, or
executable ComfyUI request. It is generic and sets
`subjectSpecificRouting=false`.
