# Living Frame IP-Adapter extension evaluation

Status: controlled source evaluation, non-promotable and non-executable.

Stock ComfyUI does not include an IP-Adapter node. This evaluation narrows a
possible extension route without installing a custom node or claiming that
the route is operational.

## Reviewed source

The controlled observation uses
[`comfyorg/comfyui-ipadapter`](https://github.com/comfyorg/comfyui-ipadapter)
at immutable revision
`b188a6cb39b512a9c6da7235b880af42c78ccd0d` and tree
`8e16f8055ae089c28a68c2d9711c1d5d93bb52b8`.

The revision is dated 2024-09-13. Its package metadata identifies version
`2.0.0`, labels the source GPL-3.0, and points its repository metadata to the
original `cubiq/ComfyUI_IPAdapter_plus` project. These are dated source
observations, not legal approval, current compatibility evidence, or
production qualification.

Exact SHA-256 observations bind the license, package metadata, registration
file, main node implementation, utilities, attention patch, image-projection
models, and README. No plugin or model bytes are committed to ReeditPro.

## Narrow generic node boundary

Only two extension node classes are structurally admitted by this source
evaluation:

- `IPAdapterModelLoader`;
- `IPAdapterAdvanced`.

This is not yet an executable allowlist. It identifies the smallest generic
route that avoids automatic model discovery and FaceID-specific behavior.

The following are explicitly blocked:

- unified loaders;
- FaceID nodes;
- the InsightFace loader;
- FaceID batch and Kolors variants;
- embed file save/load nodes;
- every other plugin node unless a later contract admits it.

The generic future workflow must also use a separately bound stock
`CLIPVisionLoader`, an exact generic IP-Adapter checkpoint, a compatible base
model, and a canonical reference-image artifact. No runtime filename, caller
path, URL, download, or arbitrary custom node is allowed.

## Why FaceID remains prohibited

The reviewed extension contains optional InsightFace and FaceID code. That
does not become acceptable because AuraFace is now the preferred
identity-continuity model. AuraFace remains external QA and is not injected
into this generation extension.

The generic IP-Adapter route must never silently select a FaceID checkpoint.
FaceID artifacts and their InsightFace dependency remain blocked by their
separate terms and by consent, likeness, biometric privacy, fairness,
retention, minor-safety, deepfake, and documentary-safety requirements.

## Remaining gates

Before any execution, the canonical backend still needs:

- legal review of the GPL deployment boundary and source provenance;
- an exact dependency lock and ComfyUI compatibility benchmark;
- checksum/size/revision-protected manifests for the generic IP-Adapter and
  CLIP Vision weights;
- base-model compatibility and license admission;
- an approved reference-image artifact binding;
- canonical admission of the strict merged-graph compiler output into the
  future model-artifact, dispatch, and private-QA authorities;
- network-off, read-only, no-download runtime confinement;
- quality, style, composition, continuity, and security benchmarks;
- canonical registry, operation, dispatch, work, asset, cost, approval, and
  QA admission.

Until those gates exist, this report grants no package, model, tool,
provider, work, asset, render, runtime, or production authority.
