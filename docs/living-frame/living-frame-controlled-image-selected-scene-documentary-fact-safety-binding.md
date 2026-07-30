# Living Frame Selected-Scene Documentary Fact-Safety Binding

Status date: 2026-07-29

Contract:
`living-frame-controlled-image-selected-scene-documentary-fact-safety-binding-v1`

State:
`approved_fact_safety_bound_private_prompt_merge_pending`

## Purpose

Living Frame may create stylized historical, documentary, geographic, or
investigative illustration sources. Those images must never be treated as
authentic archive, verified evidence, or proof that a depicted event occurred.

The selected-scene prompt path already carried a generic “illustrative only”
instruction. That was necessary but insufficient: it did not prove that the
exact selected scene had been reconciled with the current immutable approved
`DocumentaryFactSafetyPlan`, its scene-level expectation references, or the
specific approved claim dispositions.

This binding adds that missing read-only boundary. It does not verify facts and
does not become a second fact-safety planner.

## Canonical flow

```text
immutable approved snapshot
  → process-bound documentary fact-safety reader
  → exact selected-scene claim binding
  → selected Living Frame request/work/output lineage
  → digest-only fact-safety receipt
  → one process-bound private safety brief per request unit
  → existing animation-aware private prompt reader
  → fact-safety constraint merge
  → existing selected-scene private prompt materializer
```

The existing approved snapshot remains immutable. The candidate accepts no
caller-supplied fact plan, claim binding, prompt, model, dimensions, path, URL,
bytes, credentials, command, environment, provider route, or dispatch
authority.

## Source-truth dispositions

The binding derives one of three bounded treatments:

- `approved_verified_or_attributed_claim_guard` for exact geography, exact
  data, or documentary-source modes after their approved claim bindings are
  resolved;
- `approved_illustrative_interpretation_guard` for historical or real-world
  illustration that must not imply verified likeness, authentic archive, or a
  documented action; and
- `approved_fictional_or_stylized_guard` for explicitly fictional or stylized
  scenes.

`unknown_blocked` and `controlled_source_expectation` do not become generated
illustration prompts through this candidate.

## Claim-resolution rules

When the selected scene carries fact-safety expectation references, the private
snapshot packet must contain exactly one scene binding with the same reference
set and at least one approved claim item.

The binding rejects:

- missing or extra scene references;
- cross-scene, snapshot, or selected-binding substitution;
- dangling claim IDs;
- `unknown` or blocking claims;
- `needs_user_confirmation` visual treatments;
- unresolved source-required claims;
- planning-blocking clarifying questions;
- fictional claims inside an exact-fact source-truth mode; and
- any attempt to promote the binding into fact verification, approval,
  snapshot mutation, dispatch, runtime, asset, billing, review, render, or
  production authority.

## Private prompt behavior

The digest-only receipt contains:

- selected request, snapshot, scene, work, output, and planned-asset lineage;
- fact-safety plan and scene-claim-binding digests;
- claim/status/treatment counts;
- per-output private-brief digests and byte lengths; and
- fixed non-authority fields.

It never contains raw claim text, safe wording, source labels, people,
organizations, the full fact-safety plan, or subject-specific summaries.

The process-private brief is deliberately generated from approved status and
treatment codes rather than copying claim prose into the image model. It tells
the model:

- the image is an illustrative still source only;
- it must not invent or visually prove claims;
- it must not depict a named person performing an unsupported specific act;
- allegations and attributed claims require neutral, non-guilt-implying
  treatment;
- exact maps, data, labels, documents, quotations, dates, citations, and
  source attribution remain with deterministic canonical owners; and
- Remotion remains the final canvas owner.

The fact-safe reader wraps the existing animation-aware reader. It appends the
private safety constraints to the existing positive and negative conditioning
slots, then returns the same selected-scene prompt packet shape to the existing
materializer. It does not write arbitrary graph nodes or change the qualified
ComfyUI graph family.

## Evidence

The smoke covers:

- a cinematic illustrative historical-character scene with no exact claim
  binding;
- an exact-geography scene whose generated background is atmosphere only while
  the deterministic map remains authoritative;
- one private safety brief per approved generated output;
- digest-only receipts with no raw claim or source content;
- single-use lease enforcement;
- actual selected-scene prompt materialization after both animation-aware and
  fact-safety constraint merging;
- proof that the private prompt contains the safety constraints but not the raw
  approved claim or source label; and
- adversarial snapshot, scene, source-truth, expectation, claim, authority,
  unresolved-source, lease, and digest substitution.

## Remaining canonical integration

The current `ApprovedPlanSnapshot` already stores
`documentaryFactSafetyPlan`, but the released selected-scene interface does not
yet expose:

- a registered process-private reader for that exact immutable snapshot
  component; or
- a canonical scene-to-claim join bound to selected Living Frame scene
  expectation references.

Those are shared-owner integration requirements. This candidate defines and
tests the boundary without mutating the approved snapshot, selected-scene
publication, prompt materializer, work graph, asset manifest, fact-safety
planner, or backend dispatch route.

The existing frontend/mock `DocumentaryFactSafetyPlan` is planning evidence,
not proof that facts were independently verified. Production release still
requires canonical source evidence, documentary review, generated-asset QA,
private review, and the normal approval/revision path.
