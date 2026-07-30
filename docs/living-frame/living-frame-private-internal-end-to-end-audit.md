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
   base/hair/robe decomposition, selective articulated motion, Remotion,
   captions, sound, media QA, and retained review frames;
9. semantic sound timing reconciliation;
10. canonical private-review lineage;
11. a real gray8 FFV1 temporal-mask output through decode, stability
    measurement, create-only persistence, and review frames; and
12. the exact temporal-mask work-graph conflict.

Every subprocess is bounded, uses the pinned workspace `tsx` executable, and
returns only an output digest plus structured status to the aggregate receipt.
The aggregate receipt does not expose artifact bytes, local paths, prompts,
credentials, commands, or customer pricing.

## Honest result

Passing this audit proves that the currently executable private Living Frame
pipeline works together across its selected-scene and renderer boundaries. A
pass must still report two open internal runtime gates:

1. exact ComfyUI controlled generation needs the released five-model bundle and
   real L4 execution evidence; and
2. advanced temporal Living A-Roll subject masking has a verified byte-output
   and downstream QA path, but model inference still needs the canonical
   temporal work-graph discriminator plus an approved SAM2 checkpoint.

These are genuine internal execution dependencies. They are not waived merely
because customer release is out of scope. Until both exist, the audit status is
`passed_with_explicit_blocked_model_runtimes` and
`internalEndToEndReadyForOwnerReview` remains false.

Customer billing, public delivery, and production authority remain false
throughout.
