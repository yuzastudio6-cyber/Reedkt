# Living Frame selected-scene admission candidate

Status: controlled, non-promotable server contract. It is not canonical scene
selection, plan mutation, approval, or runtime authority.

## Purpose

Living Frame already has a source-bound deferred parent skill, semantic scene
proposals, a planning-only semantic projection, continuity contracts,
deterministic motion, component preparation, renderer projection, and
controlled visual evidence. The current canonical plan nevertheless persists
only the deferred zero-scene parent component.

This contract closes the ambiguity between those stages. It compiles a strict
admission candidate containing:

- the exact deferred parent-component digest;
- the semantic request, result, proposal, and projection digests;
- the exact expected output-frame and MasterTiming digests;
- the visual-continuity-pack digest when the scene requires continuity;
- one complete closed set of current-authority expectations;
- every deferred scene candidate in deterministic semantic order; and
- the canonical gates that still must be resolved.

It does not change a scene decision from `defer` to `select`. The canonical plan
owner must re-read these inputs and make that decision in the existing
planning/approval system.

## Required current authorities

A candidate scene cannot be ready for the canonical plan owner's decision
unless controlled observations say the following exact authorities match:

1. canonical planning handoff;
2. planning evidence;
3. source-speech evidence;
4. route data assurance;
5. released reasoning result;
6. visual continuity pack, when required;
7. confirmed output frame; and
8. current MasterTiming plan.

`controlled_current_match` is deliberately not a live or production evidence
class. The future shared service must independently re-read every authority.
Missing or stale expectations compile into a blocked admission candidate.

The output-frame, MasterTiming, and continuity digests are cross-checked
against the semantic projection. A claim of a current match with a different
digest is rejected rather than downgraded.

## Deliberate non-use

Deliberate non-use is preserved as a first-class result:

- no candidate scenes are emitted;
- an absent continuity pack is permitted when the semantic result does not
  require continuity; and
- the canonical plan owner must still persist the decision through the normal
  plan/estimate/approval path.

Stillness therefore does not become a failure or silently trigger a different
visual system.

## Determinism and safety

- Authority expectations are a closed set and canonicalize by authority kind.
- Candidate scene order remains semantic order.
- Candidate scene plans remain `defer`.
- Scope, output-frame, timing, continuity, and scene-plan data participate in
  the SHA-256 digest.
- Unknown keys, duplicate authority kinds, incomplete sets, mismatched current
  digests, stale projections, and forged promotion flags fail closed.
- The contract carries no raw chat, transcript, media bytes, paths, URLs,
  credentials, executable code, provider/tool route, work item, queue item,
  cost, price, credit, or service-fee data.
- Its algorithm contains no person, vehicle, geography, genre, or topic
  routing. Musashi, a helicopter, and Hormuz remain test examples only.

## Authority that remains unchanged

The admission candidate grants none of the following:

- selected-scene or professional-skill-plan mutation authority;
- MasterTiming, exact-frame, or SoundSync authority;
- estimate, commercial, approval, or snapshot authority;
- work graph, queue, or asset-manifest authority;
- provider, tool, model-weight, or artifact-QA authority;
- renderer, Remotion, private-review, runtime, delivery, or production
  authority.

The canonical integration slice must add a separately persisted server-derived
component reference to the existing plan/snapshot lineage. It must not replace
the one planner, approval, snapshot, timing, work graph, tool registry,
renderer, or private-review system.
