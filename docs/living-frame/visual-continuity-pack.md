# Living Frame Visual Continuity Pack

Status: controlled source contract v1
Runtime readiness: planning-only and non-promotable
Contract: `living-frame-visual-continuity-pack-v1`

## Purpose

The Visual Continuity Pack is structured project memory for illustrated and
layered Living Frame candidates. It records the visual rules that later
planners, asset workers, timing compilers, QA, and the renderer are expected to
revalidate. It replaces reliance on conversational memory; it does not replace
any canonical authority.

The pack answers planning questions such as:

- Which illustration language should stay consistent?
- Which character interpretation, object design, or environment treatment is
  expected?
- Which scene candidates share that visual language?
- Which components should remain still or be easy to separate later?
- Which alpha, identity, geography, fact, caption, face, and gesture checks
  will be required?
- Which controlled candidate assets were accepted for continuity planning,
  rejected, superseded, or left pending?

A valid pack does not prove that a reference is current, an asset exists, a
mask is clean, a scene is selected, a user approved the edit, or any work may
execute.

## Authority boundary

The v1 pack is always:

```text
status = controlled_planning_candidate
evidenceClass = controlled_non_promotable_visual_continuity_pack
promotionAllowed = false
semanticDecisionState = candidates_proposed
```

Its one positive authority literal is:

```text
controlledPlanningOnly = true
```

Every live-evidence, selected-scene, timing, SoundSync, estimate, customer
price, customer credit, approval, snapshot, asset-manifest, QA approval,
provider, tool-route, work-graph, queue, render, and runtime authority is
literal `false`.

An all-green caller packet cannot change those literals. The schema rejects
unknown keys, authority promotion, production-readiness fields, executable
content, provider or tool routes, work or queue identities, cost fields, and
raw instructions.

## Pack structure

### Canonical binding expectations

The pack records exact digest expectations for:

- workspace, project, edit session, and canonical planning handoff;
- the deferred Living Frame component;
- the source-bound visual-evidence binding;
- the controlled pre-approval reasoning-result binding;
- compiled intent;
- source sequence;
- confirmed output frame; and
- lineage revision.

These are binding expectations. This source contract cannot establish that the
referenced canonical records are current. A later server integration must
reload those authorities, compare every scope and digest, and reject missing,
changed, or stale lineage.

### Expectation references

The pack may reference:

- an existing character-consistency plan expectation;
- an existing documentary fact-safety plan expectation; and
- an optional Motion Storytelling style expectation when a separately bound
  Motion workflow context is present.

Every reference is controlled or marked for future canonical revalidation.
The pack cannot relabel it live, current, approved, or verified.

### Style Bible

The Style Bible records:

- asset and line treatment;
- bounded palette with explicit semantic order;
- lighting direction and character;
- edge and texture treatment;
- detail density;
- closed avoidance codes; and
- expectation references.

Avoidance codes include generic glossy anime, chibi proportions, unapproved
photoreal likeness, unreadable micro-detail, baked text, opaque rectangles,
publisher imitation, and named-artist imitation. These are creative and safety
constraints, not provider prompts.

### Character Identity Sheets

Each sheet records a controlled interpretation, source-truth mode, bounded
appearance descriptions, identity-safety state, closed identity rules,
reference-view digest expectations, and linked expectation references.

The v1 contract distinguishes:

- canonical illustrative interpretation;
- fictional character;
- symbolic figure;
- real-person neutral reference only; and
- source speaker with no likeness generation.

Miyamoto Musashi is represented only as a canonical illustrative
interpretation. The pack must never claim verified historical likeness or
historical evidence. A real-person neutral reference requires downstream
documentary fact-safety expectations. A source speaker cannot be converted
into an identity-generation target by this pack.

### Object and Environment Sheets

Object sheets describe canonical design expectations, truth mode, material and
color language, animation separability, and linked safety expectations.
Environment sheets describe environment truth, atmosphere, depth language, and
linked fact expectations.

Exact maps, measured relationships, and documentary environments require
fact-safety expectations. They remain unverified until the existing canonical
fact and geography authorities prove them. Editorial scale cannot silently
distort literal geography or proportional data.

### Scene Design Sheets

Scene sheets are ordered semantic candidates. They may describe the intended
Living Frame mode, composition, depth, linked sheets, caption/face/gesture
region expectations, and scale-truth guard.

They never contain:

- a selected-scene decision;
- a component scene graph;
- exact frame tracks;
- a provider prompt;
- a tool route; or
- executable work.

The current controlled reasoning result may propose a semantic candidate, but
selected-scene construction remains a later canonical planner responsibility.

### Motion and Sound Language Sheets

The Motion Language Sheet records motion character, motion density, camera
character, stillness policies, and the rule that only one motion is
focal-primary at a time. Its timing is semantic only.

The Sound Language Sheet records a restrained palette, density, narration
protection, and the prohibition on automatic whooshes for every element.

Neither sheet contains exact frames, cue placement, gain, pan, mix, ducking,
or approval. `MasterTimingPlan` and SoundSync remain the only canonical
execution authorities.

### Alpha and Edge Rules

The pack records whether native alpha is only a capability expectation, which
master treatment is expected after QA, whether temporal mask benchmarking is
required, and which backgrounds must be tested.

Required alpha test backgrounds are:

1. white;
2. black;
3. neutral gray;
4. saturated color; and
5. the destination composite.

A visible checkerboard is not alpha. A native-alpha claim is not QA approval.
An opaque rectangular background cannot pass as a transparent component.
Living A-Roll candidates require future temporal-mask benchmarking before
depth interaction can execute.

### Continuity Ledger

The ledger records controlled asset expectations and their semantic order. An
entry can be pending, rejected, superseded, accepted for continuity planning
only, or waiting for future asset evidence.

`accepted_for_continuity_planning_only` means only that a candidate can inform
later visual planning. It never means:

- asset bytes exist;
- the asset belongs to the canonical manifest;
- identity, edge, alpha, or factual QA passed;
- the asset is executable; or
- the asset may render.

Only the existing asset-manifest and QA authorities can establish those facts
after approval.

### Dependency graph

Sheet relationships form a set-like directed graph with unique stable IDs and
closed edge kinds. Dangling references, duplicate identities, and cycles fail
closed. The graph expresses continuity dependencies only; it is not a work
graph.

## Determinism and safety

The contract:

- uses strict recursive allowlists and rejects unknown keys;
- bounds free-form summaries and rejects control characters, URLs, filesystem
  paths, secret-like values, raw chat, raw transcript, instructions, prompts,
  media bytes, credentials, code, and commands;
- returns only issue codes and structural paths, never rejected values;
- rejects `undefined`, functions, symbols, non-finite numbers, non-plain
  objects, and cyclic JSON;
- sorts set-like collections by stable identity;
- preserves semantic order through explicit `order` fields;
- rejects duplicate order values and invalid references; and
- hashes UTF-8 canonical JSON with browser-safe
  `globalThis.crypto.subtle.digest('SHA-256', ...)`.

The digest excludes its own field. Reordering a set-like collection does not
change the digest. Changing semantic order or any lineage expectation does.
Mutating a full pack without recomputing through the contract yields a digest
mismatch.

## Controlled fixtures

The source slice contains three controlled, non-promotable packs:

- **Musashi:** cinematic anime and restrained ink, canonical illustrative
  identity, separable sword expectation, limited motion language, and no
  likeness or historical-evidence claim.
- **Helicopter:** realistic controlled illustration, body/rotor separation,
  mechanical motion language, downwash environment, and no asset-QA claim.
- **Strait of Hormuz:** Living A-Roll candidate, exact-geography expectation,
  source-speaker no-likeness rule, temporal-mask benchmark requirement, and
  no claim of live geographic verification.

The emotional-monologue fixture deliberately creates no pack.

Adversarial coverage rejects raw data leakage, provider/tool/runtime fields,
production promotion, unknown keys, deliberate-non-use payloads, duplicate
IDs/order, graph cycles, dangling references, unsafe text, cross-lane Motion
references, forged evidence, likeness and fact-safety violations, map
distortion, invalid alpha, checkerboard-as-alpha, missing mask benchmarks,
ledger promotion, selected-scene or exact-frame claims, stale digests, and an
all-green authority forgery.

## Canonical integration requirements

Before a Visual Continuity Pack can affect selected-scene planning, a later
server slice must:

1. reload the exact canonical planning handoff;
2. reload and verify the deferred Living Frame component;
3. reload and verify current Slice 3A source evidence;
4. reload and verify a released provider-neutral reasoning result, rather than
   a controlled fixture;
5. compare scope, source sequence, output-frame, and lineage digests;
6. map only selected planning expectations into the existing professional
   skill plan and estimate;
7. preserve deliberate non-use as pack absence;
8. freeze the resulting reference through the one immutable approved
   snapshot; and
9. leave timing, SoundSync, work, tool dispatch, assets, QA, and rendering to
   their existing authorities.

Until those steps are implemented and tested, the pack is useful design
memory, not execution evidence.
