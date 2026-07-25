# Living Frame Storytelling System Architecture

Status: source-only contract v1 plus planning-only parent-skill admission
Runtime readiness: not integrated, not executable
Contract version: `living-frame-professional-skill-component-v1`

## Purpose

Living Frame Storytelling is a composite professional editing skill. It turns
A-roll, still photographs, illustrations, maps, diagrams, documents, and
isolated visual components into a coherent layered scene while preserving
ReeditPro's existing planning and execution authorities.

The central creative rule is:

> Animate meaning, not every object that can move.

Living Frame is not a new Signature System, planner, timeline, approval flow,
queue, provider, tool registry, cost ledger, QA gate, or renderer. It is a
professional skill component that a later canonical planning integration may
construct and attach to the existing `ProfessionalSkillPlan`.

This first slice defines and tests only a source-level contract. A valid
contract is still planning-only and cannot prove that any live source,
provider, tool, worker, asset, timing plan, estimate, approval, snapshot,
render, or QA result exists.

## Product meaning

Living Frame allows the story to materialize inside the active frame rather
than defaulting to unrelated B-roll or opaque rectangular inserts.

It supports five scene modes:

- `living_a_roll`: visuals occupy depth-aware space around the speaker.
- `living_still`: selected components of a still asset are animated.
- `living_archive`: photographs, documents, dates, and evidence are organized
  into a restrained animated composition.
- `living_diagram`: exact maps, data, systems, and relationships are animated
  through deterministic graphics.
- `hybrid_expansion`: a visual begins in A-roll, expands to a larger scene, and
  returns to the speaker's frame.

Stillness and non-use are first-class professional outcomes. Living Frame
should be rejected when an emotional expression, source truth, frame safety,
or a simpler treatment carries the story more effectively.

## Canonical authority chain

Living Frame must extend one existing chain:

```text
compiled intent
  -> ProfessionalSkillPlan component
  -> canonical planning handoff and estimate
  -> single approval and immutable snapshot
  -> existing execution package and private work graph
  -> registered tool/provider dispatch
  -> canonical asset manifest and internal tool-cost receipts
  -> one QA plan
  -> private Remotion review and revision
```

The later integration must reuse these current canonical surfaces:

| Concern | Existing authority |
| --- | --- |
| Compiled intent | `src/lib/intent-compiler.ts` |
| Professional skill vocabulary | `src/types/creative-skills-core.ts`, `src/types/creative-skill-plans.ts` |
| Professional skill plan | `src/types/professional-skills.ts`, `src/lib/professional-skills/` |
| Project projection | `src/lib/project-edit-skill-aware-plan.ts` |
| Planning authority | `server/services/planning-input-authority-binding-service.ts`, `server/services/canonical-planning-handoff-service.ts`, `server/services/edit-planning-authority-service.ts` |
| Approval and snapshot | `src/lib/approved-plan-snapshot.ts`, `server/services/approved-snapshot-service.ts` |
| Frame timing | `src/lib/master-timing-planner.ts` |
| Execution plan and manifest | `src/types/editing-agent-runtime.ts`, `src/lib/editing-agent-execution-planner.ts` |
| Work graph and queue | `server/services/canonical-edit-execution-package-service.ts`, `server/services/canonical-private-work-graph-orchestrator-service.ts` |
| Tool selection and dispatch | `src/lib/tool-registry.ts`, `src/lib/tool-strategy-planner.ts`, `server/tool-registry/`, `server/services/canonical-private-tool-dispatch-authority-service.ts` |
| Internal tool cost | `server/tool-cost-metering/` |
| QA | `src/lib/edit-qa-planner.ts` and canonical private artifact gates |
| Final composition | `src/lib/remotion-renderer-planner.ts`, `server/services/canonical-private-remotion-execution-service.ts` |
| Private review | canonical private review assembly, decision, and history services |

No later Living Frame slice may duplicate these authorities.

## Slice 1 contract

The v1 component is implemented only in namespaced source files. It deliberately
is not exported from a shared barrel and is not attached to
`ProfessionalSkillPlan`.

The component declares:

- its version, source, planning status, and literal non-authority boundary;
- digested expectations for compiled intent, source sequence, source segments,
  video understanding, adaptive strategy, confirmed output frame, and current
  `MasterTimingPlan`;
- a selected, rejected, deferred, blocked, or deliberate non-use decision;
- scene modes, narrative purpose, visual verb, importance, and restraint
  reasoning;
- a component scene graph with stable IDs, depth roles, transparency
  expectations, provenance expectations, continuity references, and abstract
  capability requirements;
- reusable mini-skill activations;
- semantic timing, attention, scale, and sound requests;
- caption, face, and gesture safety expectations;
- an ordered fallback ladder;
- complexity and capability signals for the later canonical estimate;
- expected QA checks and explicitly closed integration gates; and
- a deterministic SHA-256 digest.

The component does not contain:

- raw chat, transcript, instructions, source bytes, file paths, URLs, or signed
  URLs;
- secrets or credentials;
- executable code or commands;
- exact frame tracks;
- exact sound-cue placement, gain, pan, mix, or ducking values;
- tool, provider, model, job, queue, dispatch, work-item, approval, snapshot,
  reservation, ledger, price, credit, service-fee, or tool-cost authority.

## Evidence semantics

Slice 1 accepts only:

- `mock_planning_evidence`
- `controlled_unverified_evidence`
- `future_worker_evidence_required`

These values are expectations, not proof. `future_worker_evidence_required`
states that later canonical worker evidence must exist; it is not a verified
worker result. The output-frame confirmation, timing binding, source truth,
continuity references, and QA codes must all be re-read from their canonical
authorities during a later integration slice.

The contract therefore fixes every authority field to these literals:

```text
planningOnly = true
executable = false
timingAuthority = false
soundAuthority = false
estimateAuthority = false
approvalAuthority = false
runtimeAuthority = false
queueAuthority = false
providerAuthority = false
toolRouteAuthority = false
costAuthority = false
```

A caller cannot change those values, even with an otherwise all-green packet.

## Parent and mini-skill model

Living Frame is one composite skill. A mini-skill is a reusable activation role
inside a scene assembly, not a new global skill type.

The v1 vocabulary includes:

- Narrative Illustration
- Animation-Aware Illustration
- Component Decomposition
- Component Rigging
- Mechanical Part Motion
- Environmental Motion
- Editorial Motion
- Path Motion
- Deformation Motion
- State-Change Motion
- Focus Handoff
- Attention Restoration
- Visual Orbit
- Camera Choreography
- Semantic Scale
- Sound Choreography
- Visual Continuity Direction
- Alpha and Edge QA
- Living Frame Restraint QA

Each activation has a stable ID, role, decision, intensity, linked components,
semantic timing requests, dependencies, conflicts, and expected QA checks.
Dependency graphs must be acyclic.

## Scene graph

Every scene has exactly one focal-primary component. Other components may be
secondary motion, ambient motion, or static anchors. The scene graph can
describe:

- source A-roll or a source still;
- opaque and reconstructed background plates;
- primary subjects;
- mechanical parts;
- environmental effects;
- editorial graphics;
- exact map and data components;
- foreground occluders;
- contact shadows; and
- atmosphere.

Depth bands are ordered from far background through foreground. Parent, anchor,
and dependency references must resolve to stable component IDs, and the
resulting graph must be acyclic.

The v1 component records only abstract asset intent. It does not contain an
`EditWorkItem`, a `custom` work item, a job ID, or an executable work graph.
A missing future operation requires explicit admission to the canonical work
schema rather than a generic bypass.

## Motion and attention

Living Frame follows a semantic performance arc:

```text
prepare -> activate -> demonstrate -> resolve -> settle
```

The contract expresses why motion should occur and which spoken meaning should
anchor it. It deliberately carries no exact frames.

The later canonical integration must:

1. revalidate the referenced confirmed output frame;
2. revalidate the current `MasterTimingPlan`;
3. convert semantic requests into frame-accurate canonical timing;
4. invalidate the Living Frame component when the frame or timing digest is
   stale; and
5. freeze the resulting tracks only in the one approved snapshot.

Focus Handoff is an attention transition, not a blur preset. Its methods may
include expected focus depth, contrast, camera, motion, light, and sound
emphasis. A handoff requires a later restore event unless the scene explicitly
transitions away.

## Semantic scale

Size may communicate importance, power, threat, quantity, distance, growth,
decline, vulnerability, or centrality. Every request identifies one of four
scale modes:

- literal physical;
- data proportional;
- perspective; or
- editorial symbolic.

Exact maps and data may never be distorted through editorial symbolic scale.
Symbolic treatment must be distinguishable from literal or proportional truth.

## Sound

Sound Choreography can request mechanical presence, environmental presence,
movement support, an editorial reveal, scale emphasis, or an attention
handoff. The contract also requests narration protection.

These are non-executable semantic requests. The existing SoundSync and audio
authorities remain responsible for exact cue frames, attack/release, level,
pan, mixing, speech ducking, and approval. Speech clarity always outranks
decorative sound.

## Visual continuity

Illustrated scenes depend on a versioned Visual Continuity Pack made from
expectation references:

- Style Bible
- Character Identity Sheet
- Object Identity Sheet
- Environment Identity Sheet
- Scene Design Sheet
- Motion Language Sheet
- Sound Language Sheet
- Alpha and Edge Rules
- Continuity Ledger

The pack is project memory, not model conversational memory. A later
integration must verify the exact versions and digests from canonical source
authorities before generation or reuse.

For historical people without photographic identity evidence, the system may
approve a canonical illustrative interpretation. The Musashi fixture uses that
mode. It is never a verified likeness or historical record.

## Transparency and depth

Living Frame requires real compositable layers. A visible checkerboard is not
an alpha channel, and a rectangular generated background cannot be accepted as
a transparent component.

The v1 transparency expectations are:

- opaque plate;
- native alpha preferred, with QA still required;
- still alpha required;
- temporal mask required;
- procedural alpha; and
- additive effect.

Each expectation has one compatible source and QA expectation. Examples:

```text
still alpha required
  -> postprocessed still mask required
  -> future alpha QA required

temporal mask required
  -> temporal mask sequence required
  -> temporal mask stability QA required

procedural alpha
  -> procedural alpha required
  -> procedural alpha validation required
```

An approved future alpha route must test white, black, gray, saturated, and
destination backgrounds, including edge contamination, internal holes,
fine-detail loss, mask flicker, and rectangular matte leakage.

The current GPT Image 2 model documentation must be checked at the exact
provider version selected later. The architecture must not assume that a
particular model returns production-ready alpha. A safe default is a separable
source image followed by an approved extraction, refinement, edge
decontamination, and multi-background QA route.

## Capability and generation ladder

Living Frame requests abstract capabilities, never caller-selected tools:

```text
reuse approved component
  -> deterministic drawing
  -> still generation or editing
  -> qualified controlled illustration
  -> bounded generated video asset
  -> premium rescue only when canonical policy allows
```

Generated video is not the default for rotors, slash trails, arrows, maps,
charts, particles, focus transfers, or camera moves that deterministic
composition can control. Exact maps and exact data cannot route to generated
video.

The contract includes complexity/capability signals for the existing estimate
system. It contains no dollars, credits, prices, service fees, reservations, or
cost authority. The canonical estimate remains mandatory before approval.

## QA expectations

Living Frame adds named expectations to the one canonical QA plan. It does not
create a second gate.

Expected checks cover:

- narrative relevance and non-use restraint;
- one focal primary and visual-density restraint;
- caption, face, and gesture safety;
- continuity comparison;
- component separability and provenance;
- multi-background alpha and temporal mask stability;
- pivot physics;
- semantic timing binding;
- attention restoration;
- semantic scale truth;
- narration protection;
- exact geography and data verification;
- documentary integrity; and
- generated-video restraint.

Documentary or exact-geography scenes require canonical fact-safety evidence.
Generated illustration must not be presented as authentic archive evidence or
used to imply an unsupported event.

## Fallbacks

Fallbacks are an ordered semantic ladder:

```text
full Living Frame
  -> simplified depth composition
  -> safe-space overlay
  -> lower visual stage
  -> side-by-side
  -> full illustrated scene
  -> static card
  -> captions only
  -> no extra visual
```

A scene may omit steps, but it must preserve increasing restraint and end with
`no_extra_visual`. The ordered ladder is digest-bearing. Reordering it changes
meaning and is rejected when it violates the canonical sequence.

Examples:

- Temporal mask failure falls back to a non-depth layout.
- Alpha failure falls back to an opaque illustrated scene or a static card.
- Unverified geography falls back to a neutral, explicitly gated diagram or no
  visual.
- Distracting Focus Handoff falls back to motion or contrast without blur.
- A failed sound cue is removed rather than forced.

## Determinism and input safety

The v1 contract uses strict recursive schemas and rejects unknown keys.
Free-form summaries are length-bounded and reject control characters, URLs,
and secret-like payloads. Error objects contain only issue codes and structural
paths, never rejected values.

Canonicalization:

- sorts only set-like IDs, references, capability keys, QA codes, and
  dependency edges;
- sorts arrays with explicit `order` metadata by that metadata;
- preserves scene, timing, attention, sound, and fallback semantics;
- rejects duplicate or non-contiguous order values;
- rejects `undefined`, non-finite numbers, functions, symbols, non-plain
  objects, and cyclic JSON; and
- hashes UTF-8 canonical JSON with browser-safe
  `globalThis.crypto.subtle.digest('SHA-256', ...)`.

The digest excludes its own field. Any valid semantic change changes the
digest; post-digest mutation is rejected.

## Controlled fixtures

Slice 1 includes four non-promotable fixtures:

1. Musashi decisive strike: Living Still, canonical illustrative
   interpretation, component motion, procedural ink, no generated video.
2. Helicopter selective motion: body anchor, main and tail rotor pivots,
   downwash, camera, and speech-safe sound expectations.
3. Strait of Hormuz: Living A-Roll with exact-geography expectation, controlled
   routes, focus handoff, temporal-mask expectation, and fact-safety gates.
4. Emotional monologue: deliberate non-use with no scenes, components,
   capabilities, generation, or complexity.

The adversarial matrix rejects:

- unconfirmed frame and stale timing expectations;
- duplicate IDs, duplicate order, and cyclic graphs;
- caption, face, or gesture collision;
- identity conditioning without the safety gate;
- factual map distortion;
- invalid alpha and checkerboard-as-alpha claims;
- raw transcript, instruction, secret, executable, provider, tool, work, queue,
  approval, cost, or exact-mix injection;
- invalid fallback ordering;
- undefined or cyclic JSON;
- digest tampering; and
- a forged all-green/live/production-ready packet.

## Integration roadmap

### Slice 1: source-only contract

This document, tool-qualification notes, types, validation, fixtures, exports
within the namespace, and a direct smoke. Nothing is runtime-connected.

### Slice 2A: planning-only parent-skill admission

- add one Living Frame parent to the existing professional-skill registry;
- select it only from strong, explicit editing intent;
- make explicit non-use or restraint win deterministically;
- preserve no-user-tool-name behavior; and
- create no component, estimate, snapshot, work, provider, tool, or runtime
  authority.

### Slice 2B: canonical professional-skill component construction

Later and only with a new exact-path authorization:

- add an optional `ProfessionalSkillPlan.livingFrame` field atomically with
  canonical async construction and validation;
- make the planner, not callers or fixtures, construct the component;
- revalidate its source, output-frame, and `MasterTimingPlan` expectations;
- bind it into canonical content-addressed persistence and immutable snapshot
  lineage; and
- prevent the legacy synchronous snapshot helper from copying an unvalidated
  component.

### Slice 3: planning handoff, estimate, and approval

- revalidate source/output-frame/timing expectations;
- publish complexity signals to the existing estimate system;
- show the user the scene idea, generated assets, expected complexity, and
  fallback without exposing internal tools;
- require the one estimate and approval; and
- freeze the exact component and later timing bindings in the immutable
  snapshot.

### Slice 4: canonical work and asset mapping

- map approved components to existing named work-item types where valid;
- request explicit schema admission for any missing operation;
- preserve scene/component lineage in the existing asset manifest;
- use existing dependency, idempotency, reconciliation, retry, and placeholder
  policies; and
- never use a generic custom work item as a bypass.

### Slice 5: renderer and private review

- compile approved scene components into deterministic Remotion layer groups;
- bind exact tracks to `MasterTimingPlan`;
- preserve captions above required layers;
- consume approved masks and alpha assets only;
- run canonical artifact QA; and
- use the existing private Remotion review and revision flow.

### Slice 6: qualified controlled illustration

- qualify an execution host, preprocessors, adapters, checkpoints, model
  weights, licenses, security, cost, and quality;
- keep identity-conditioned paths closed until consent, likeness, retention,
  deepfake, and documentary-safety requirements pass;
- route through the existing backend-only tool/provider authority; and
- retain deterministic and non-use fallbacks.

## Closed gates after slice 1

The following remain explicitly unimplemented:

- canonical planner integration;
- canonical output-frame and MasterTiming revalidation;
- canonical estimate;
- user approval;
- immutable snapshot integration;
- controlled-illustration qualification;
- provider route review;
- work-item schema admission;
- asset production and QA;
- private Remotion review;
- identity safety;
- documentary fact verification; and
- temporal mask benchmarking.

Passing the source-only contract smoke does not make any of these gates green.

## Slice 2A: planning-only parent admission

Slice 2A admits exactly one professional-skill parent:

```text
motion.living_frame_storytelling
```

The parent reuses the existing `motion_design` family. It is selected only from
explicit user editing intent, Edit Brief directives, or edit-cue directives
already admitted by the professional-skill planner. Selection must not inspect
transcript text, source filenames, source metadata, inferred workflow/category
labels, model output, or provider output.

Selection is strong-signal and restraint-first:

- an explicit Living Frame or Living A-Roll request may select it;
- an explicit request to animate a still photograph or illustration may select
  it;
- an explicit request for explanatory elements around, behind, beside, or in
  front of the speaker may select it;
- generic animation, an explainer category, or a visual preference alone may
  not select it; and
- no-animation, no-motion, static-only, talking-head-only, no-extra-visual, or
  minimal-visual direction deterministically suppresses it.

The selection policy returns only a closed reason code. It never returns or
stores the matching raw user text.

The admitted parent has:

```text
executionModes = [plan_only]
hiddenAdapterToolNames = []
backendIntents = []
```

It creates no Living Frame component payload. It adds no timing, estimate,
approval, snapshot, work item, queue, job, QA result, provider route, tool
route, cost, renderer, or runtime authority. The six controlled-illustration
candidates remain evaluation-only documentation and are absent from product
copy and runtime registries.

`ProfessionalSkillPlan.livingFrame` remains intentionally absent. Adding it
requires a later atomic async-construction slice that also performs canonical
digest/source/output-frame/`MasterTimingPlan` revalidation, content-addressed
component persistence, immutable snapshot binding, tamper checks, and explicit
exclusion from the legacy synchronous snapshot path.
