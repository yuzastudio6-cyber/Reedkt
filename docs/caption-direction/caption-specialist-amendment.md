# Captions Specialist Amendment

Status: `cap_10_contract_complete_private_font_visual_render_gated`
Applies to: all historical files in `docs/caption-direction/`

This amendment supersedes only the historical identity, intelligence-routing,
support-request, and milestone-progression portions of CAP-00. The underlying
Caption creative architecture remains applicable unless this document says
otherwise.

## 1. Identity

- Top-level specialist key: `captions`.
- Internal composite professional skill: `caption_design`.
- Compatibility alias: `caption_direction` → `caption_design`.
- Explicit restraint: `no_captions`.
- `caption_design` is not the top-level callable specialist.
- Legacy `captions.*` definitions remain readable through versioned mappings;
  they do not stay independent primary owners.

## 2. Skills first, Orchestra later

The Captions Specialist must be fully implementable and privately qualifiable
without a production Orchestra. CAP-01 supplies a bounded standalone harness
that consumes neutral Orchestra-shaped call contracts. The harness is not the
global scheduler and must reject:

- direct peer dispatch;
- caller-authored scope expansion;
- unqualified job claims;
- recursive/cyclic support calls;
- runtime, provider, asset, QA-approval, billing, delivery, or production
  authority supplied by a caller.

The future HQ/Orchestra mounts the finished specialist through the same public
manifest, qualification, call, support, and result surfaces.

## 3. Shared contracts, not Caption duplicates

The goal requires neutral shared versions of:

- `SkillCapabilityManifest` with primary-analysis ownership,
  invocation policy, result contract, failure semantics, and security policy;
- `SkillQualificationSnapshot`;
- `SkillSupportRequest`;
- `OrchestraSkillCall`;
- `OrchestraSkillJobResult`.

The committed base does not contain these contracts. CAP-01 must add or consume
one neutral shared definition set. It must not place equivalent definitions
under `caption-direction`, Living Frame, Sound, or another specialist.
Existing `skill-capability-manifest-v1`, where present on a later owner
branch, remains backward-readable and must not be silently mutated.

## 4. Intelligence ownership

Captions owns caption reasoning inside its bounded assignment. It does not own a
separate Head Intelligence provider and does not call Qwen directly.

Visual Intelligence owns:

- source and reference visual analysis;
- final-frame occupancy and protected-region observations;
- OCR/screen-text, subject, gesture, B-roll, Living Frame, and visual-hierarchy
  observations;
- postrender visual inspection evidence.

Captions sends bounded support requests and consumes typed evidence. It
validates evidence deterministically and retains its own caption QA/repair
responsibility. Visual Intelligence cannot grant final QA approval.

## 5. Track All and SAM 3.1

Track All owns mask, track, anchor, occlusion, and temporal-stability support.
SAM 3.1 is an implementation owned behind that support boundary. Caption code
may request a support artifact and consume opaque evidence references; it may
not import SAM server internals, choose the model route, dispatch a GPU task,
or reinterpret model runtime evidence.

Historical SAM 2 use is compatibility evidence only. New work uses SAM 3.1
through the Track All-compatible owner.

## 6. Cross-specialist coordination

- StoryTiming owns final executable frames.
- Sound owns sound selection, generation, mix, ducking, loudness, and audio QA.
- Living Frame owns its selected scenes, route/rig/topology/artifacts, complete
  visual QA, and execution.
- Transition Language owns transition selection and execution.
- B-roll/media owners own source selection, crop, preparation, and delivery to
  Remotion.
- Remotion owns final composition.
- Canonical workflow owners retain approval, immutable snapshot, work graph,
  asset manifest, estimate/cost, leases, persistence, reconciliation, private
  review, and delivery.

CAP-11 remains the Caption-owned outbound/inbound Living Frame payload. A
future `SkillSupportRequest` carries that payload and its digest lineage; it
does not replace CAP-11 or turn it into a dispatcher.

Illustrated-character animation and mechanical rigging remain paused. Caption
may coordinate non-character Living Frame modes through the existing boundary.

## 7. QA and release target

The target of this Goal is
`caption_specialist_private_internal_qualified`, not public SaaS production.
That status still requires complete Caption-owned implementation, real-media
private qualification, direct visual inspection, honest unresolved external
gates, and a dependency-complete handoff to the backend workflow pipeline.

Technical raster, timing, mask, color, stream, and export checks remain
mandatory. They do not replace direct visual review of the actual pixels. Any
media milestone must inspect representative and complete-time evidence
appropriate to the claim, record the inspection decision, and keep failed
visual evidence separate from deterministic technical success.

## 8. Milestones

The historical CAP-01–17 roadmap is superseded by CAP-00R–CAP-20 in
[Implementation Roadmap](implementation-roadmap.md). Historical milestone
reports and preservation-tree evidence are inputs to requalification, not
automatic proof on the clean implementation branch.
