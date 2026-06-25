# Production GPU AI Install Plan

Milestone 11 prepares the GPU AI worker package foundation and model-weight readiness metadata. It follows Milestone 10's CPU/render core install definitions.

M11 adds GPU worker Docker declarations, GPU Python requirements, model-weight manifest templates, GPU readiness checks, and policy docs. It does not build images, deploy, run GPU jobs, process user media, download weights, call providers, add secrets, or make Revideo core.

GPU tools remain worker-only and can execute only from approved snapshots in future milestones.

## AI Graphics 21-Tool Install Readiness

The AI graphics 21-tool install-readiness lane expands GPU worker declarations for `transformers`, SAM2, `rembg[gpu]`, `transparent-background`, and Real-ESRGAN, while keeping BiRefNet on the Transformers model-loader path. This is an install-readiness step only. It does not download model weights, run GPU imports, process media, or unlock beta. Beta readiness requires a later worker image build proof, GPU import smoke, approved private model-weight manifests, approved safe fixtures, Tool Route/Worker handoff gating, and runtime QA.
## Milestone 12 Validation

M12 surfaces M11 GPU package declarations, model-weight templates, source-install review items, and GPU runtime policy in the unified readiness report. It does not run GPU jobs, import heavy GPU packages by default, load model weights, or download models.

## Milestone 15C Consumption

M15C consumes the GPU readiness and model-weight metadata for BiRefNet and SAM2. It adds skip-safe execution scaffolds and command plans only; it does not download models, run unapproved GPU jobs, or treat package availability as model-weight approval.

## Milestone 15D Consumption

M15D consumes GPU readiness and model-weight metadata for Real-ESRGAN and FILM. It adds sample-first enhancement and selected-clip interpolation scaffolds only; it does not download model weights, run unapproved GPU jobs, final render/export, or treat package availability as model-weight approval.
