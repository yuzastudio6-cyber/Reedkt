# Living Frame private internal end-to-end audit

## Purpose

Run:

```text
npm run smoke:living-frame-private-internal-end-to-end-audit
```

This audit is the aggregate private internal checkpoint for Living Frame. It
does not reinterpret individual test evidence. It reruns the frozen planning,
contract, selected-scene, real-render, persistence, QA, private-review, and
fail-closed temporal-mask fixtures and requires every expected result.

The audit deliberately distinguishes:

- verified private internal execution;
- verified source and lineage contracts;
- an expected shared-interface conflict; and
- model runtimes that are still impossible to exercise safely because their
  approved artifacts or canonical discriminator do not exist.

It is not a customer-production readiness audit.

## Required cases

The aggregate audit executes:

1. canonical planning evidence and closed runtime authorities;
2. parent and reusable mini-skill contracts;
3. the subject-neutral capability matrix;
4. selected-scene private ComfyUI prompt materialization without dispatch;
5. a real Remotion render covering all five Living Frame modes, deliberate
   non-use, multiple depth styles, attention, caption priority, sound, and
   fallbacks;
6. real portrait and custom non-square confirmed-frame renders without square
   substitution;
7. the complete selected-scene PixiJS environmental-particle slice through
   Remotion, create-only persistence, media QA, and private-review evidence;
8. the real Musashi illustration through alpha, exact destination composite,
   base/sword-arm/hair/robe decomposition, deterministic bounded shoulder-plate
   reconstruction, a synchronized articulated strike, Remotion, captions,
   sound, media QA, and retained review frames;
9. real generated flat-editorial and paper-collage alpha fixtures through
   adaptive flat and shallow-2.5D Remotion scenes, measured spatial behavior,
   caption priority, create-only persistence, and retained review frames;
10. semantic sound timing reconciliation;
11. canonical private-review lineage;
12. the exact selected-scene source-video → normalized subject prompt → SAM2
    temporal-mask work-admission candidate;
13. a real gray8 FFV1 temporal-mask output through decode, stability
    measurement, create-only persistence, and review frames; and
14. the exact temporal-mask work-graph conflict.

Every subprocess is bounded, uses the pinned workspace `tsx` executable, and
returns only an output digest plus structured status to the aggregate receipt.
The aggregate receipt does not expose artifact bytes, local paths, prompts,
credentials, commands, or customer pricing.

The exact local ComfyUI image is host-specific and therefore remains an
adjacent conditional internal test rather than one of the 14 portable
aggregate cases. When that exact image is present,
`smoke:living-frame-comfyui-local-confinement-internal-test` additionally
proves model-free startup with a default non-root derived image, fixed
entrypoint, scrubbed environment, `sam2` denial, the reviewed two-node
allowlist, read-only root, zero network, zero capabilities, and no prompt,
model, GPU, artifact, dispatch, or cost action. It does not discharge the
five-model/L4 gate.

The exact local GPU-worker proof image is likewise host-specific. When it is
present,
`smoke:living-frame-sam2-local-runtime-confinement-internal-test`
additionally proves the pinned SAM2 source revision, selected native Meta
config, Apache-2.0 license bytes, native video-predictor builder, Torch
2.5.1+cu124, TorchVision 0.20.1+cu124, and CUDA 12.4 build under a derived
fixed-entrypoint, non-root, read-only, zero-network, zero-capability
confinement. It rejects caller arguments, root override, and unexpected model
mounts. It loads no checkpoint, performs no inference, and does not discharge
the checkpoint/L4 gate.

## Honest result

Passing this audit proves that the currently executable private Living Frame
pipeline works together across its selected-scene and renderer boundaries. A
pass must still report two open internal runtime gates:

1. exact ComfyUI controlled generation needs the released five-model bundle and
   real L4 execution evidence; and
2. advanced temporal Living A-Roll subject masking has an exact namespaced
   source-video/SAM2 work-admission candidate, a verified byte-output and
   downstream QA path, canonical backend work-graph admission frozen at
   `576ca54b`, and a model-free local source/config/runtime confinement pass.
   Model inference still needs the approved SAM2 checkpoint ingest/read-only
   mount plus a real L4/CUDA run and measured mask QA.

These are genuine internal execution dependencies. They are not waived merely
because customer release is out of scope. Until both exist, the audit status is
`passed_with_explicit_blocked_model_runtimes` and
`internalEndToEndReadyForOwnerReview` remains false.

Customer billing, public delivery, and production authority remain false
throughout.
