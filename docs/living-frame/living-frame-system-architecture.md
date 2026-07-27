# Living Frame Storytelling System Architecture

Status: controlled semantic request v2, proposal binding v1, and visual
continuity contract v1
Runtime readiness: planning expectations only, not executable
Component contract: `living-frame-professional-skill-component-v1`
Evidence contract: `living-frame-planning-evidence-binding-v1`
Visual continuity contract: `living-frame-visual-continuity-pack-v1`
Semantic request contract: `living-frame-semantic-reasoning-request-v2`
Semantic proposal binding:
`living-frame-semantic-scene-proposal-binding-v1`
Controlled-illustration qualification requirements:
`living-frame-controlled-illustration-qualification-v1`
Controlled-illustration upstream observation:
`living-frame-controlled-illustration-source-observation-v1`

## Purpose

Living Frame Storytelling is a composite professional editing skill. It turns
A-roll, still photographs, illustrations, maps, diagrams, documents, and
isolated visual components into a coherent layered scene while preserving
ReeditPro's existing planning and execution authorities.

The central creative rule is:

> Animate meaning, not every object that can move.

Living Frame is not a new Signature System, planner, timeline, approval flow,
queue, provider, tool registry, cost ledger, QA gate, or renderer. It is a
professional skill component. The current canonical integration may construct
only one deferred expectation component and attach it to the existing
`ProfessionalSkillPlan`.

The contracts and canonical bindings remain planning-only and cannot prove
that any live provider, tool, worker, asset, estimate, approval, render, or QA
result exists. Slice 3A can project a source-bound private visual evidence
package only after the existing verifier passes; that projection still grants
none of those authorities.

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

## Reviewed design record

The product conversation that motivated Living Frame was design input, not
repository authority. The decisions below are the reviewed result after
cross-checking that input against the current ReeditPro product, intent,
professional-editing, timing, approval, execution, asset, tool, model-routing,
QA, and rendering contracts.

No raw conversation, prompt, or transcript is retained in the Living Frame
contract. Later changes must update this repository document and the typed
contracts through the normal one-writer review boundary.

### Final decisions

- Living Frame Storytelling is the umbrella composite professional skill.
  Living A-Roll is one scene mode, not the parent skill.
- The five initial modes are `living_a_roll`, `living_still`,
  `living_archive`, `living_diagram`, and `hybrid_expansion`.
- Mini-skills are reusable component activations inside a parent assembly.
  They are not a new global skill type or a second catalog.
- Stillness, a simpler visual, and deliberate non-use are valid professional
  decisions. Capability does not create an obligation to animate.
- Narrative Illustration and Animation-Aware Illustration describe creative
  intent. “AI drawing,” provider names, and implementation techniques are not
  user-facing creative skill identities.
- A versioned Visual Continuity Pack is the intended project memory for style,
  characters, objects, environments, motion, sound, alpha, and accepted asset
  lineage. Conversational memory is never continuity authority.
- The synthesis ladder is reuse, deterministic drawing, still
  generation/editing, qualified controlled illustration, bounded generated
  video, then policy-permitted premium rescue.
- Exact maps, data, labels, typography, particles, slash paths, camera motion,
  and other controllable elements prefer deterministic construction. Generated
  video is reserved for motion that actually needs it.
- Remotion remains the final deterministic compositor. Living Frame does not
  create a renderer.
- `MasterTimingPlan` remains the sole exact-frame authority. Living Frame can
  request semantic timing but cannot mint frames.
- SoundSync and the existing audio plans remain the sole exact cue, mix,
  ducking, gain, and pan authorities.
- The canonical reasoning route remains Kimi K3, then Qwen 3.7, then DeepSeek
  V4 Pro. Qwen2.5-VL remains the separate visual-understanding specialist and
  cannot create edit authority independently.
- Living Frame pre-approval reasoning is workflow-neutral. Ordinary Edit Video
  planning is the base authority; Motion Storytelling may contribute an
  optional, separately reverified production-context tuple but is never the
  universal Living Frame planner or snapshot.
- Selected Living Frame scenes require both source-bound visual evidence and a
  schema-validated pre-approval reasoning result bound to the same current
  planning inputs. Neither one alone selects a scene.
- Source visuals and source speech are different evidence authorities. Living
  Frame owns neither generic speech extraction nor its repository. A semantic
  request for a source that contains speech remains blocked until the shared
  workflow-neutral speech-evidence authority supplies a current namespaced
  projection.
- Shared route data assurance is a separate security and model-routing
  authority. A semantic request may declare the requirement but cannot bind a
  provider envelope, certify processing or retention policy, or call a model.
- The Living Frame semantic request has its own bounded payload digest. That
  digest is distinct from the pre-approval input-authority digest, visual
  evidence digest, strict output-schema digest, and whole request-contract
  digest.
- Transparency is capability-checked. The current `gpt-image-2` model cannot
  request transparent output, so its required Living Frame path is opaque
  separable generation, qualified segmentation or matting, edge
  decontamination, a true-alpha artifact, and multi-background plus
  destination-composite QA. A different future exact model/operation may use
  native alpha only after its capability and output pass the same QA.
- Documentary truth, generated-illustration disclosure, likeness safety,
  semantic-scale truth, and exact-geography/data verification are mandatory.
- Rollout begins with Living Still and deterministic scenes, then clean Living
  A-Roll, then advanced temporal depth after masking benchmarks pass.
- No provider, controlled tool, generation, worker, or rendering activity may
  start before the existing plan, estimate, approval, and immutable snapshot
  authorities permit it.
- Upstream source revisions, license files, and model-card statements are
  dated controlled observations only. They never self-promote into current
  source truth, legal/commercial approval, a model-weight manifest, package
  admission, registry/operation admission, dispatch, or runtime readiness.

### Superseded proposals

| Earlier proposal | Reviewed disposition |
| --- | --- |
| Living A-Roll as the umbrella system | Superseded by Living Frame Storytelling; Living A-Roll is a mode. |
| “AI Drawing” as a top-level skill | Superseded by Narrative Illustration and Animation-Aware Illustration activations. |
| Generate a complete video scene by default | Superseded by the reusable deterministic-first synthesis ladder. |
| Let a reasoning model write arbitrary JavaScript for each scene | Rejected; models emit typed, validated plans that approved compilers execute. |
| Add six new production tool IDs and increase the registry count | Rejected; the six candidates span a host, a preprocessing bundle, adapters/checkpoints, and a training/loading mechanism. |
| Use the older workload-specific Kimi-to-GPT fallback | Superseded by the shared canonical Kimi-to-Qwen-to-DeepSeek route. |
| Treat source visual evidence as proof of narration meaning | Rejected; generic source-speech evidence is a separate shared authority and remains required when speech exists. |
| Treat a provider route name as proof of privacy or data handling | Rejected; shared route data assurance and the provider-envelope binding are separate future authorities. |
| Use a generic `custom` work item for missing operations | Rejected; missing work requires explicit canonical schema admission. |
| Assume generated-image transparency always works or always fails | Superseded by exact capability checks plus deterministic alpha fallback and QA. |
| Treat GPT Image 2 as a native-alpha route | Rejected for the current `gpt-image-2` capability; it requires opaque generation followed by qualified matting and alpha QA. |
| Replace detailed illustration entirely with procedural drawing | Rejected; detailed hero art can use still generation while motion and composition remain controlled. |
| Build a separate Living Frame planner, timeline, queue, or renderer | Rejected; Living Frame extends the existing canonical authorities. |

### Unresolved questions

These questions remain intentionally open and must not be answered by runtime
assumption:

- Which exact style profiles, motion languages, sound languages, and
  per-profile restraint thresholds ship first?
- What released repository, locator, retention, and consumer contract will
  provide current private visual-evidence packages to planning?
- What released server reader will reload the current unpublished handoff,
  exact component payload, and controlled internal-cost ceiling expectation
  for the pre-approval input authority?
- What workflow-neutral source-speech evidence package, verifier, reader, and
  repository will provide current narration meaning without creating a
  Living Frame-specific transcription lane?
- What exact shared route-data-assurance record will bind processing region,
  retention, training use, sensitivity, rights, likeness, minors, and
  fact-safety policy to the canonical Kimi-to-Qwen-to-DeepSeek route?
- What transport, durable run/result repository, lifecycle, timeout, retry,
  and checkback authority will execute pre-approval reasoning?
- What canonical planning service will supersede a deferred-analysis handoff
  with a server-derived selected handoff under durable idempotency, compare-
  and-swap, checkback, and unknown-attempt handling?
- Which Kimi deployment and model version will satisfy the shared route,
  privacy, latency, structured-output, and internal-cost gates?
- Will controlled illustration use one isolated workflow host, direct
  libraries, or more than one reviewed runtime profile?
- What are the exact code, weight, base-model, dependency, training-data, and
  output commercial-use terms for each controlled-illustration artifact?
- Which exact auxiliary annotators and checkpoints, if any, can pass
  independent source, license, artifact, security, quality, and commercial-use
  review instead of admitting the whole preprocessing bundle?
- Which temporal masking route and quantitative hair, hand, contact-object,
  camera-motion, and flicker thresholds qualify Living A-Roll?
- What consent, retention, real-person, public-figure, deepfake, minor, and
  documentary rules would be required before any identity adapter is admitted?
- Which named canonical work-item operations and scene-package manifest fields
  are required after approval?
- What quantitative continuity, alpha, anatomy, pivot, attention, motion,
  semantic-scale, and sound thresholds block delivery?
- What is the measured internal and customer estimate impact per approved,
  revision-ready, reusable scene?
- When, if ever, should advanced 2.5D or 3D scene construction be admitted?
- Which future exact image model/operation, if any, should be qualified for
  native alpha after passing the same destination-composite QA as the opaque
  GPT Image 2 fallback route?

## Architectural invariants

- One compiled-intent authority.
- One professional-skill plan and catalog.
- One confirmed output frame and `MasterTimingPlan`.
- One estimate and approval flow.
- One immutable approved snapshot lineage.
- One execution package, work graph, queue, and asset manifest.
- One backend tool/provider dispatch authority.
- One internal tool-cost evidence system and a separate existing customer
  estimate/credit policy.
- One QA plan plus existing private artifact gates.
- One Remotion composition and private-review flow.
- No frontend provider calls and no heavy work before approval.
- Workers execute the immutable approved snapshot and never reinterpret raw
  chat.

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

The v1 component began in namespaced source files. Slice 2B admits its optional
field to `ProfessionalSkillPlan` only when the canonical async builder has
rebuilt the component from the exact canonical planning projection.

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

The current `gpt-image-2` model does not support transparent output. Living
Frame must use a separable opaque source followed by approved segmentation or
matting, refinement, edge decontamination, a true-alpha artifact, and
multi-background plus destination-composite QA. Provider edit masks guide an
edit; they are not production mattes. A future image model's native alpha is
still unqualified until its exact operation and output pass the same QA.

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

Implemented as a deferred-only binding:

- add an optional `ProfessionalSkillPlan.livingFrame` field atomically with
  canonical async construction and validation;
- make the canonical publication client, not callers or fixtures, construct
  the component from the selected parent and exact draft projection;
- revalidate its source, output-frame, and `MasterTimingPlan` expectations;
- bind it into canonical content-addressed persistence and immutable snapshot
  lineage; and
- prevent the legacy synchronous snapshot helper from copying an unvalidated
  component.

Slice 2B deliberately admits no selected scene graph. When the parent is
selected, the component has:

```text
status = deferred
decision = deferred
scenePlans = []
continuityPackRefs = []
capabilityRequirements = []
qaExpectationCodes = []
all estimate counts = 0
all complexity = none
generated video = not required
```

The browser computes SHA-256 with `globalThis.crypto.subtle`. The server parses
the strict deferred schema, independently recomputes the component digest, and
recomputes bindings for:

- exact canonical compiled intent;
- exact canonical source sequence;
- every ordered canonical segment;
- the exact confirmed output-frame projection; and
- the exact current `MasterTimingPlan`.

Video-understanding and adaptive-strategy references remain
`future_worker_evidence_required`. They are not promoted to live evidence.
Changing the output frame or timing plan makes the component stale and blocks
handoff/publication.

The optional `livingFrame` component is persisted through the existing
content-addressed plan-component store. Its component reference is included in
the existing `planHash`, copied into the immutable canonical snapshot, and
covered by the existing exact plan/snapshot component-reference equality
check. It creates no work item, asset, estimate line, tool route, provider
route, queue record, job, cost event, QA result, or render instruction.

The legacy synchronous `createApprovedPlanSnapshot` path fails closed whenever
this field is present. Only the existing asynchronous canonical planning,
approval, and immutable snapshot authority may carry it forward.

### Slice 3A: source-bound planning evidence

Slice 3A adds a narrow private-reader binding:

- callers provide only a server-owned locator, never evidence payloads, paths,
  URLs, signed URLs, media bytes, credentials, or storage identities;
- an injected private reader returns the existing
  `PrivateGcpVisualUnderstandingPlan` and
  `PrivateGcpVisualEvidencePackage`;
- the service reuses
  `verifyPrivateGcpVisualEvidencePackage` and independently revalidates the
  exact workspace, project, edit, source-sequence item, media asset, checksum,
  plan, checkpoint, coverage, cache, and evidence-package identities;
- missing, stale, tampered, wrong-scope, wrong-source, incomplete,
  low-confidence, user-review-required, or audio/transcript-claiming evidence
  fails closed;
- source-less admission is `not_applicable_idea_first` only when the exact
  canonical Motion Storytelling production authority proves there is no
  uploaded source; and
- the output is a content-addressed, planning-only projection containing
  bounded observation ranges, summaries, confidence, and digests.

The projection is bound to the same deferred Living Frame component, compiled
intent, source sequence, confirmed output-frame projection, and current
`MasterTimingPlan`. It exposes no reader locator, storage path, raw media,
transcript, provider, tool, job, queue, cost, approval, QA, timing, scene, or
runtime authority. It is not persisted into `ProfessionalSkillPlan` or the
snapshot in this slice.

### Slice 3B-A: workflow-neutral pre-approval input authority

The source-only Slice 3B-A contract binds the inputs that a future reasoning
run must consume. It is not a reasoning run, result, receipt, estimate, scene
plan, approval, snapshot, or runtime command.

- a non-serializable server reader must reload the current unpublished
  canonical planning handoff and its exact component payload;
- the service independently verifies the handoff ID/hash, component hash,
  resolved planning-input binding, deferred Living Frame component, and the
  Slice 3A evidence projection re-read through its private reader;
- ordinary Edit Video is the workflow-neutral base. A Motion Storytelling
  production tuple is optional context only and must be separately reverified
  through the existing Motion production-authority reader;
- the bounded reasoning request and strict result-schema expectation are
  content-addressed without retaining raw chat, transcript, media, paths,
  URLs, credentials, provider operations, tools, jobs, queues, or executable
  code;
- the only permitted reasoning order is the shared canonical Kimi K3, Qwen
  3.7, then DeepSeek V4 Pro route. The older Kimi-to-GPT route, Qwen2.5-VL
  reasoning, and media-provider operations are rejected;
- a current rate-card identity and controlled internal-cost ceiling
  expectation may be bound, but no attempt receipt, actual attempt cost,
  provider invoice truth, customer price, credits, reservation, wallet
  mutation, or service fee is created;
- the strict shared pre-approval envelope discriminates Living Frame from Edit
  Reference Study Chat V6. Cross-lane or mixed authority fails closed, and the
  existing Edit Reference authority remains byte-for-byte unchanged; and
- the server re-reads the handoff/components after evidence binding so a
  concurrent change fails closed.

The Slice 3B-A reader and evidence fixtures remain controlled,
non-promotable, and production-unready. No reader route, provider transport,
durable repository, cloud resource, billing path, or deployment is released
by this contract.

### Slice 3B-B1: controlled semantic-result binding

Slice 3B-B1 extends the existing reasoning cost and run-receipt contracts
through a strict workload-authority union. The existing Edit Reference Study
Chat V6 authority, constructors, validators, serialization, digests, and
receipt behavior remain unchanged. Living Frame receives a separate
`pre_plan_living_frame_semantic_reasoning` lane; a mixed or cross-lane object
fails closed.

This slice remains controlled and non-promotable:

- a process-bound server reader, not caller JSON, supplies the internal-budget
  admission, canonical run receipt, and strict semantic-result fixture;
- the service reconstructs the workload authority from the exact current
  Slice 3B-A input-authority digest, current handoff scope, Slice 3A evidence
  digest, bounded request/schema digests, canonical route identity, immutable
  rate-card identity, and controlled internal-cost ceiling;
- only the Kimi K3, Qwen 3.7, then DeepSeek V4 Pro route is accepted.
  Reordering, duplicate attempts, the superseded Kimi-to-GPT route,
  Qwen2.5-VL, media-provider operations, mixed authorities, and cost-ceiling
  breaches fail closed;
- failed attempt cost remains in the controlled receipt, while an unknown
  attempt prevents a semantic result from binding. Only one completed
  terminal attempt may bind the exact result digest;
- the current handoff, components, planning evidence, and result are read
  again before a binding is returned. A stale or changed input/result fails
  closed;
- each semantic decision cites an exact source observation or the separately
  verified idea-first context. Candidate decisions remain candidates:
  `selectedSceneAuthority` is false; and
- the returned evidence class is
  `controlled_non_promotable_reasoning_result_binding`. Every provider,
  transport, credential, selected-scene, component, capability, timing,
  SoundSync, estimate, customer-commercial, approval, snapshot, work-graph,
  queue, tool, media-generation, render, export, runtime, and production
  authority remains false.

The controlled receipt proves contract compatibility and fail-closed lineage;
it does not prove that a provider attempt ran or that a durable result exists.

### Slice 3B-B2: released reasoning execution and durable result evidence

This separately gated future slice must:

- execute the provider-neutral Kimi K3, Qwen 3.7, then DeepSeek V4 Pro chain
  through released transport, retry, timeout, checkback, idempotency, and
  durable run/result authorities;
- provide a workflow-neutral Living Frame result repository rather than
  copying the Edit Reference V6 store or using Motion Storytelling as
  universal authority;
- retain failed and unknown attempt cost from real durable attempt evidence,
  never from the Slice 3B-A input contract or Slice 3B-B1 fixtures;
- re-read and validate the durable result against the same current handoff,
  components, Slice 3A evidence, request digest, result-schema digest, route,
  and internal-cost ceiling; and
- preserve the boundary that reasoning evidence alone cannot select a scene,
  mint exact timing/SoundSync cues, calculate the customer estimate, approve a
  snapshot, create work, choose tools, render, or authorize production.

### Slice 3C-A: controlled Visual Continuity Pack

Slice 3C-A defines the versioned project-memory contract described in
`docs/living-frame/visual-continuity-pack.md`.

- Style, character, object, environment, scene, motion, sound, alpha, ledger,
  and dependency expectations are strict, bounded, and content-addressed.
- Character-consistency, fact-safety, and optional Motion style plans are
  references only. The pack cannot label those external plans current,
  approved, verified, or live.
- Scene sheets remain semantic candidates. They do not contain a selected
  scene, component graph, exact timing, SoundSync cue, estimate, work item,
  provider, tool route, or render instruction.
- Ledger acceptance means continuity planning only. It is not QA approval,
  executable asset evidence, or asset-manifest ownership.
- Native-alpha and temporal-mask fields are QA expectations. Checkerboards and
  rectangular backgrounds remain invalid substitutes for true alpha.
- Musashi remains a canonical illustrative interpretation; Hormuz remains
  blocked on later exact-geography verification; an emotional monologue keeps
  the pack absent.
- Browser-safe SHA-256 binds semantic order and canonical lineage. Set-like
  permutations normalize; semantic order or lineage changes invalidate the
  digest.

This is a controlled, non-promotable source contract. It provides no current
provider result, selected-scene authority, timing, estimate, approval,
snapshot, asset, QA, work, render, or runtime authority.

### Slice 3D-A: bounded semantic reasoning request

Slice 3D-A defines the real semantic payload that a future provider-neutral
pre-approval run may consume. It is separate from Slice 3B-A's input-authority
metadata and cannot execute a run.

- The payload contains only bounded intent signals, restraint signals, allowed
  Living Frame modes, source-bound visual-evidence projections, ordered
  segment context, ordered semantic constraints, and requested candidate,
  rejection, non-use, or blocked decision kinds.
- The request binds the exact Slice 3B-A input-authority digest, Slice 3A
  visual-evidence binding digest, and strict semantic scene-proposal JSON
  Schema digest.
- The semantic payload, strict output schema, and complete request are
  content-addressed independently. The input-authority and evidence digests
  must also remain distinct; substituting one digest for another fails closed.
- Set-like intent, mode, evidence-reference, and reference-ID collections
  canonicalize. Segment and semantic-constraint order is preserved. Changing
  semantic order changes the digest.
- A source containing speech is blocked with
  `generic_source_speech_evidence_required`. The generic evidence digest is
  deliberately absent until the future shared workflow-neutral authority is
  injected.
- Every request is also blocked with
  `shared_route_data_assurance_required`. The provider-envelope state and
  digest remain unbound.
- The only expected reasoning order is Kimi K3, Qwen 3.7, then DeepSeek V4
  Pro. This is a routing expectation, not provider selection or transport
  authority. The obsolete Kimi-to-GPT route, Qwen2.5-VL reasoning, and
  media-provider operations remain forbidden.
- Output DTOs may describe semantic candidates, component relationships,
  mini-skill suggestions, timing phases, attention intent, semantic scale,
  sound intent, continuity expectations, QA expectations, and fallbacks.
  They cannot select a canonical scene, mint exact frames or SoundSync cues,
  calculate an estimate, approve a plan, choose a provider or tool, create
  work, or authorize runtime.
- Raw chat, transcript, instructions, media, paths, URLs, credentials, hidden
  reasoning, provider envelopes, commands, jobs, queues, work items, cost
  authority, and production claims are rejected recursively.

Fixtures remain controlled and non-promotable. Musashi is still a canonical
illustrative interpretation, Hormuz still proves no live geography or data,
and forged all-green packets retain every provider, timing, estimate,
approval, work, render, and production authority as literal false.

### Slice 3D-B: controlled semantic scene-proposal binding

Slice 3D-B validates content-only output against the existing Slice 3D-A
request DTO and an optional, independently valid Slice 3C-A Visual Continuity
Pack. It does not introduce a second scene-proposal DTO.

- The complete Slice 3D-A request is revalidated before any proposal
  cross-reference is trusted. Its request, semantic-payload, and strict
  output-schema digests are bound into the result binding.
- The strict content-only result schema is revalidated and normalized before
  its own browser-safe SHA-256 digest is calculated.
- Decision, scene, component, mini-skill activation, semantic timing,
  attention, sound, fallback, and evidence references must be unique,
  acyclic, ordered, and internally complete.
- Exactly one component may be focal-primary in a proposed scene. A focus
  handoff to a visual must include semantic attention restoration unless the
  proposal exits the scene through a later canonical transition.
- Semantic scale may not present symbolic emphasis as literal geography,
  physical scale, or proportional data. Exact maps and exact data remain
  downstream verification requirements.
- Transparency fields are expectations, not alpha evidence. Opaque plates,
  still masks, temporal masks, procedural alpha, and additive effects must use
  compatible QA routes. A checkerboard remains invalid evidence of alpha.
- Musashi remains a canonical illustrative interpretation and cannot become a
  verified likeness or historical-evidence claim. The controlled Hormuz
  fixture cannot claim live geography or data verification.
- If a proposed scene declares continuity expectations, an omitted Visual
  Continuity Pack preserves `continuity_pack_required`. If a pack is present,
  its contract, exact workspace/project/edit/handoff/evidence scope, scene
  keys, relevant sheet kinds, identity rules, truth rules, and alpha
  expectations are cross-validated.
- Deliberate non-use contains no scene proposal and requires no continuity
  pack. This remains a first-class valid result.
- Set-like citations and references canonicalize. Semantic scene, component,
  activation, timing, attention, sound, and fallback order is preserved.
  Changing a valid fallback ladder changes the content and binding digests;
  invalid escalation is rejected.

The output class is
`controlled_non_promotable_semantic_scene_proposal_binding`. It contains no
canonical selected-scene ID and cannot supersede a handoff, persist a result,
select a provider or tool, mint exact timing or SoundSync cues, calculate an
estimate, modify approval or snapshot state, create work or assets, render, or
authorize runtime. Even a forged all-green packet fails because every such
authority is a closed literal `false`.

### Controlled semantic-to-plan projection

`living-frame-semantic-plan-projection-v1` closes the structural gap between
the content-only semantic proposal and the existing
`LivingFrameProfessionalSkillComponent` scene/component shape. It is not the
selected-scene planner.

The compiler:

- revalidates the canonical deferred Living Frame component and the complete
  controlled semantic-proposal binding;
- deterministically projects candidate scenes, components, dependencies,
  mini-skill activations, semantic timing phases, attention, semantic scale,
  sound requests, region safety, fallbacks, continuity references, capability
  requirements, QA expectations, and complexity signals;
- preserves a deliberate non-use result without creating scene, capability,
  continuity, or estimate complexity;
- fills only the five required semantic timing lifecycle phases when a
  content-only candidate omitted one. These remain requests with
  `exactFramesProvided=false`; `MasterTimingPlan` still owns every frame;
- marks every candidate scene `defer` and the projected component `blocked`;
  and
- keeps the projection workflow-neutral. Musashi, helicopter, Hormuz, and
  every other named topic remain fixtures, never route selectors.

The projection remains
`controlled_non_promotable_professional_skill_plan_projection`. It always
retains `released_reasoning_lifecycle_required` and
`canonical_selected_scene_admission_required`. It cannot be copied into the
canonical professional-skill plan, estimate, approval, snapshot, work graph,
asset manifest, renderer, or runtime. A later canonical planner must reload
the current shared speech evidence, route-data assurance, durable reasoning
result, handoff, output frame, timing, and continuity authorities before it
may select any projected scene.

### Shared prerequisite gates before selected scenes

The canonical backend owns three workflow-neutral prerequisites. Living Frame
will consume only namespaced projections after they are released:

1. generic source-speech evidence and its current server reader;
2. route data assurance for the canonical reasoning route; and
3. durable preplan run/result lifecycle plus deferred-handoff supersession.

Living Frame must not implement a private transcriber, provider repository,
selected-handoff publisher, idempotency store, checkback loop, or attempt-cost
ledger to bypass these prerequisites.

### Slice 3C-B: selected scene planning, estimate, and approval

- wait until the shared speech, route-assurance, reasoning lifecycle, and
  server-derived handoff prerequisites are current;
- revalidate source/output-frame/timing expectations;
- require current Slice 3A evidence, Slice 3D-A request, Slice 3B reasoning
  binding, and applicable Visual Continuity Pack;
- construct selected, rejected, blocked, and deliberate-non-use scene
  decisions through the existing professional-skill planner;
- publish complexity signals to the existing estimate system;
- show the user the scene idea, generated assets, expected complexity, and
  fallback without exposing internal tools;
- require the one estimate and approval; and
- freeze the exact component and later timing bindings in the immutable
  snapshot.

### Slice 4: canonical timing, work, and asset mapping

- compile semantic timing and sound requests through `MasterTimingPlan` and
  SoundSync rather than a Living Frame clock;
- map approved components to existing named work-item types where valid;
- request explicit schema admission for any missing operation;
- preserve scene/component lineage in the existing asset manifest;
- use existing dependency, idempotency, reconciliation, retry, and placeholder
  policies; and
- never use a generic custom work item as a bypass.

#### Named work-type admission audit

`living-frame-work-admission-catalog-v2` audits every current Living Frame
capability and mini-skill against the existing `EditWorkItemType` vocabulary.
It is a static, non-executable coverage record; it does not create work items
or asset-manifest entries.

The current 35 vocabulary entries resolve as follows:

- 32 have a candidate mapping to an existing named work type, including
  `generate_image_asset`, `generate_ai_video_asset`, `render_map_asset`,
  `render_chart_asset`, `generate_mask_asset`, `process_image_asset`,
  `reconstruct_background_plate`, `build_component_rig`,
  `prepare_visual_cue_timing`, `prepare_soundsync_timing`,
  `prepare_remotion_layer`, `run_asset_qa`, and `run_final_qa`;
- one (`visual_continuity_direction`) is planning-only and should not create a
  work item;
- hidden-background-plate reconstruction and component-rig construction now
  have first-class canonical names rather than being hidden under
  `process_image_asset` or `custom`;
- adapter training/loading still requires explicit canonical schema admission;
  and
- identity-conditioned illustration remains safety-blocked and cannot be
  relabeled as ordinary image generation.

The catalog sets `customWorkItemAllowed=false`. It is invalid to hide a
rig, hidden-plate, adapter, or identity operation under `custom`,
`process_image_asset`, or `generate_image_asset`. The two new names are schema
and dry-run job-classification admissions only: no worker handler, tool route,
asset creation, queue dispatch, or runtime authority is added. Existing work
types remain candidate vocabulary mappings: selected-scene admission,
immutable snapshot, timing/SoundSync, tool/provider/model-weight
qualification, artifact QA, and private review remain required before the
canonical execution planner may create work.

#### Deterministic component-rig compilation

`living-frame-component-rig-v1` turns one validated component-geometry bundle
and its exact deterministic-motion bundle into a subject-neutral rig
specification. It preserves component hierarchy, parent and anchor
dependencies, pivots, depth order, transparency and mask expectations,
motion-track bindings, camera nodes, and occlusion relations. It rejects
missing dependencies, cycles, duplicate IDs/orders, mismatched geometry and
motion lineage, altered topological order, artifact-contract substitution, and
authority promotion.

The compiled rig is an animation specification, not executable model-written
code. It expects the admitted `build_component_rig` work-item name and a
`living_frame_component_rig_spec_json` processed artifact, but it does not
create either record. Canonical selected-scene admission, immutable snapshot
lineage, work-item creation, asset-manifest insertion, artifact QA, renderer
projection, private review, and runtime execution remain owned by the existing
pipeline.

### Slice 5: renderer and private review

- compile approved scene components into deterministic Remotion layer groups;
- bind exact tracks to `MasterTimingPlan`;
- preserve captions above required layers;
- consume approved masks and alpha assets only;
- run canonical artifact QA; and
- use the existing private Remotion review and revision flow.

#### Workflow-neutral Remotion profile boundary

The first renderer-integration contract is
`living_frame_deterministic_layered_scene_v1`. It is a workflow-neutral
profile candidate: it does not contain Musashi, helicopter, Hormuz, or any
other subject-specific route. Those names remain controlled examples that
exercise character illustration, mechanical selective motion, geographic
explanation, and restraint.

The profile binds the existing renderer-plan binding, semantic choreography
binding, immutable approved-snapshot lineage observation, approved work-output
lineage, and planned asset-manifest lineage into one deterministic layer
manifest. It does not add a renderer. `RendererCompositionPlan` remains the
plan authority and the existing private Remotion service remains the only
future execution boundary.

This profile remains non-executable until canonical planning freezes selected
Living Frame scene, renderer, and choreography component references; exact
motion samples and committed artifacts are projected from the approved
snapshot; artifact QA passes; the existing offline Remotion protocol admits
the profile; and the existing private review flow approves its rendered
artifact. All execution and production authority flags remain false.

### Slice 6: qualified controlled illustration

- qualify an execution host, preprocessors, adapters, checkpoints, model
  weights, licenses, security, cost, and quality;
- keep identity-conditioned paths closed until consent, likeness, retention,
  deepfake, and documentary-safety requirements pass;
- route through the existing backend-only tool/provider authority; and
- retain deterministic and non-use fallbacks.

## Closed gates after slice 2B

The following remain explicitly unimplemented:

- selected Living Frame scene construction;
- executable frame-track construction from semantic timing;
- canonical estimate;
- user approval;
- Living Frame-specific runtime work and asset mapping;
- controlled-illustration qualification;
- provider route review;
- work-item schema admission;
- asset production and QA;
- private Remotion review;
- identity safety;
- documentary fact verification; and
- temporal mask benchmarking.

Canonical source/output-frame/`MasterTimingPlan` digest revalidation and
content-addressed snapshot lineage are now present for the deferred component.
They do not make any runtime, estimate, approval, provider, tool, queue, cost,
QA, rendering, or production gate green.

## Closed gates after slice 3A

Slice 3A proves only that an injected server reader can supply a current,
source-bound private visual package suitable for later pre-approval reasoning,
or that visual source evidence is exactly not applicable under canonical
idea-first authority.

It does not provide:

- a released evidence repository or locator service;
- model/provider transport;
- pre-approval reasoning runs or results;
- selected or rejected Living Frame scenes;
- Visual Continuity Packs;
- exact timing or SoundSync cues;
- complexity estimate line items;
- user approval or new snapshot authority;
- work items, assets, dispatch, retries, or cost receipts;
- controlled-illustration qualification;
- alpha, mask, continuity, documentary, or render QA;
- Remotion layer compilation; or
- private review or production readiness.

## Closed gates after slice 3C-A

The Visual Continuity Pack makes style and continuity expectations explicit,
bounded, deterministic, and source-lineage-sensitive. It does not open the
gates listed after Slice 3A.

In particular, Slice 3C-A does not provide:

- a released reasoning transport or durable reasoning-result repository;
- canonical selected/rejected/blocked scene construction;
- a user-visible Living Frame estimate or approval proposal;
- exact `MasterTimingPlan` tracks or SoundSync cues;
- executable component rigs, masks, alpha assets, or scene packages;
- canonical asset-manifest records or QA-approved assets;
- admitted work-item operations, dispatch, retries, or cost receipts;
- qualified controlled-illustration runtimes, preprocessors, model weights, or
  identity adapters;
- Remotion layer compilation or private review; or
- production readiness.

Later integration must independently reload the current canonical handoff,
deferred component, source evidence, reasoning result, output frame, and
continuity expectations before any selected scene or estimate is constructed.

## Closed gates after slice 3D-B

Slice 3D-A proves that a bounded Living Frame semantic request and strict
candidate-output schema can be constructed, normalized, content-addressed,
and rejected safely. It does not prove that its evidence is live, that a
provider ran, or that any candidate was selected.

The following remain closed:

- generic source-speech evidence, reader, and repository;
- shared route data assurance and a bound provider envelope;
- provider transport, credentials, attempts, retries, and durable results;
- deferred-handoff supersession and durable preplan lifecycle;
- canonical selected/rejected/non-use scene projection;
- exact `MasterTimingPlan` tracks and SoundSync cues;
- estimate, customer credits, approval, or snapshot mutation;
- component assets, alpha or mask production, work graph, queue, dispatch,
  internal attempt-cost evidence, or asset-manifest ownership;
- QA-approved executable assets, Remotion compilation, private review, export,
  and production readiness; and
- controlled-illustration installation, qualification, or dispatch.

The strict scene-proposal DTO and its cross-validation binding are content
only. Even a structurally valid, all-green candidate packet has no
selected-scene, timing, sound, estimate, approval, provider, tool, work,
asset, render, runtime, or production authority.

## Controlled-illustration qualification requirements

The v1 source contract classifies exactly six evaluation candidates:

| Candidate | Contract class |
| --- | --- |
| ComfyUI | execution host/orchestrator |
| `comfyui_controlnet_aux` | preprocessing bundle |
| ControlNet | model/adapter/checkpoint capability |
| IP-Adapter | model/adapter/checkpoint capability |
| PuLID | identity adapter/checkpoint capability |
| PEFT/LoRA | training/loading mechanism |

This is not a list of six production tool identities. The packet records the
artifact families, license scopes, security and safety reviews, and benchmarks
that a future qualification authority would need. Every candidate remains
uninstalled, unpinned, unverified, unregistered, non-dispatchable, and
production-false.

The contract keeps these distinctions fail-closed:

- every copied `comfyui_controlnet_aux` annotator and every downloaded
  checkpoint needs an independent pin, digest, and license review;
- ControlNet source-code terms cannot qualify model weights, annotators, or a
  base model;
- generic IP-Adapter cannot promote the official FaceID variant, whose model
  card describes it as research-only and non-commercial due to InsightFace;
- PuLID adapter terms cannot override FLUX.1-dev's non-commercial base-model
  restriction;
- PuLID and every other identity-conditioned route also require consent,
  likeness/deepfake, minor, retention, and documentary-fact-safety review; and
- PEFT/LoRA framework or mechanism terms cannot qualify a loaded adapter,
  training data, or base model.

The packet also freezes the current image-alpha planning requirement:

```text
gpt-image-2 opaque separable source
  -> qualified segmentation or matting
  -> edge decontamination
  -> true-alpha artifact
  -> multi-background and destination-composite QA
```

It does not call the provider, select a model route, create a mask, or approve
an asset.

## Closed gates after controlled-illustration qualification requirements

The qualification packet is controlled, source-only, and non-promotable. It
does not provide:

- exact package, container, source, model, adapter, checkpoint, or workflow
  versions;
- an artifact manifest or independent source/license verification record;
- a production tool or operation identity;
- installation, registry, dispatch, provider, model-weight, worker, queue, or
  runtime authority;
- measured benchmark, quality, privacy, security, identity, or commercial-use
  evidence;
- a selected Living Frame scene, estimate, approval, snapshot, timing,
  SoundSync, asset, QA, render, or private-review result; or
- production readiness.

The safe next action is exact-version qualification evidence through the
existing canonical tool/model-weight/security/operation authorities. This
contract does not duplicate any of them.

## Controlled upstream source-observation slice

The source-observation contract binds the existing qualification-requirements
digest to one dated, controlled packet covering the same six heterogeneous
candidates. It records:

- closed source-locator codes rather than URLs;
- observed immutable repository revisions;
- observed license/model-card document-content digests and declared labels;
- the original candidate classifications;
- every still-unresolved qualification artifact family and review gate; and
- explicit dependency-scope rules that prevent a generic source label from
  promoting copied annotators, downloaded checkpoints, FaceID, FLUX.1-dev,
  InsightFace-dependent identity routes, or a future loaded LoRA/base
  model/training-data combination.

The controlled fixture observes exact revisions dated 2026-07-26. Those values
are not “latest,” live, released, verified, or production-current. A future
canonical qualification service must independently reread the primary source,
fetch and hash the exact selected artifacts, close dependency and base-model
lineage, and perform legal, commercial-use, security, privacy, quality, and
runtime review. The browser-shareable packet carries no URL, path, source
bytes, package/container identity, provider/model/tool/operation ID, command,
credential, estimate, approval, work, asset, render, or runtime authority.

Candidate and source observations use explicit order. Set-like artifact
families, review gates, candidate references, source references, and
dependency-scope rules canonicalize before browser-safe async SHA-256. Changing
a dated revision or observation date changes the digest. Unsafe or cyclic
input, unknown keys, mutable revisions, scope collapse, and forged all-green
packets fail closed without echoing the rejected payload.

This slice does not:

- install a package, node, model, adapter, checkpoint, or workflow;
- add or modify a production tool, operation, provider, package lock,
  container, model-weight manifest, database migration, or dispatch route;
- resolve the known fail-closed `transparent-background`/`rembg` model-weight
  manifest gap;
- qualify native alpha for GPT Image 2, which remains on the opaque separable
  source plus qualified matting/alpha-QA path; or
- open selected-scene, timing, SoundSync, estimate, approval, snapshot, work,
  queue, asset, QA, Remotion, private-review, export, or production gates.

## Detailed Slice 2A parent-admission contract

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

`ProfessionalSkillPlan.livingFrame` remains absent for ordinary plans and for
plans without the explicitly selected parent. Caller-shaped values are removed
and cannot select the parent. When the parent is selected, only Slice 2B's
canonical async builder may add the deferred component described above.
