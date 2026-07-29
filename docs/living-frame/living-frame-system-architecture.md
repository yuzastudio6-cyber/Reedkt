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
- The workflow-neutral `canonical-source-speech-evidence-package-v1` now
  defines the private, exact-source, GPU-only evidence and backend-local
  content-addressed repository boundary. The persistence service accepts only
  a server-owned capture locator through a process-bound private reader and
  rejects caller-supplied evidence. The canonical Living Frame semantic
  admission service now injects and rereads this package with the current
  handoff, selects only bounded redacted untrusted segments referenced by the
  semantic request, and grants the transcript no instruction authority.
- The workflow-neutral
  `canonical-preapproval-route-data-assurance-v1` contract now binds current
  organization/project evidence, processing region, retention, training use,
  sensitivity, confidential-source, likeness, minor, rights, and fact-safety
  policy to the exact Kimi-to-Qwen-to-DeepSeek route. It is private,
  request-bound, content-addressed, and non-promotable. The canonical Living
  Frame semantic admission service now consumes this record only after it
  builds and hashes the actual provider-neutral payload. No provider envelope,
  transport, or model call is authorized.
- `canonical-living-frame-semantic-reasoning-admission-v1` is the server-owned
  join across current pre-approval input, bounded Slice 3D-A request, current
  speech evidence, and current route assurance. Its
  `ready_for_provider_envelope` status is a precondition for a later envelope,
  not permission to call a provider or select a scene.
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
| Treat a provider route name as proof of privacy or data handling | Rejected; the shared route-data assurance record is separate from the still-future provider-envelope and transport authorities. |
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
- What released server policy-evidence adapter will populate current,
  independently verified organization, project, provider-region, retention,
  training-use, likeness, minor, rights, and fact-safety evidence for
  `canonical-preapproval-route-data-assurance-v1`?
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

### Canonical server admission after Slice 3D-A

`canonical-living-frame-semantic-reasoning-admission-v1` resolves the two
shared prerequisite markers without mutating the source-only Slice 3D-A
contract.

- The service rebuilds the current pre-approval input authority, rereads the
  current unpublished handoff, and validates the exact Slice 3D-A request.
- It rereads the workflow-neutral source-speech package and projects only the
  bounded, redacted, untrusted speech segments explicitly referenced by
  semantic contexts. Raw transcript and source-instruction authority remain
  false.
- It constructs and hashes the actual provider-neutral payload. This digest is
  separate from the pre-approval authority, original semantic payload, whole
  Slice 3D-A request, visual evidence, and strict output-schema digests.
- It then rereads route-data assurance bound to that exact complete payload
  digest. Metadata-only request digests cannot substitute for the payload.
- Owner/workspace scope, stale locators, missing speech segments, blocked or
  expired policy, and handoff races fail closed.
- The output status is `ready_for_provider_envelope`, but the provider
  envelope remains absent and transport, run, result, selected-scene, timing,
  estimate, approval, work, render, runtime, and production authority remain
  false.

The source-only request remains useful as an immutable planning input. The
server admission is the only current boundary that may claim its shared
speech and route-assurance prerequisites have been satisfied.

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

The canonical backend owns three workflow-neutral prerequisites:

1. generic source-speech evidence and its current server reader;
2. route data assurance for the canonical reasoning route; and
3. durable preplan run/result lifecycle plus deferred-handoff supersession.

Living Frame now consumes namespaced projections of the first two through
`canonical-living-frame-semantic-reasoning-admission-v1`. It must not
implement a private transcriber, provider repository, selected-handoff
publisher, idempotency store, checkback loop, or attempt-cost ledger to bypass
the remaining lifecycle authority.

The first prerequisite now has a backend-local, content-addressed contract and
reader in `server/source-speech-evidence/` and
`server/services/canonical-source-speech-evidence-service.ts`. It binds exact
source checksums, private transcript and word-timestamp artifact digests,
source-audio extraction evidence, passed transcript QA, internal pre-approval
budget evidence, GPU-only faster-whisper execution evidence, and bounded
redacted transcript projections with literal zero instruction authority.
Immutable evidence snapshots and monotonic revisions prevent latest-pointer
rollback. A process-bound reader and double-read race check prevent
caller-shaped records from minting the package. It deliberately does not run
transcription, expose
transcript text to the browser or satisfy Living Frame's namespaced
reasoning-input blocker by itself. The canonical semantic admission service
now consumes it together with current route assurance. A provider envelope
and released durable preplan lifecycle remain open.

The second prerequisite now has a workflow-neutral contract and private local
repository in `server/model-data-assurance/` plus a process-bound persistence
and reread service in
`server/services/canonical-preapproval-route-data-assurance-service.ts`.
It binds the exact request and canonical route to current organization,
project, provider-region, retention, training-use, sensitivity,
confidential-source, likeness, minor, rights, and fact-safety evidence.
Missing, expired, conflicting, or review-required evidence cannot become a
ready record; explicit policy conflicts block the route. Immutable versions,
monotonic revisions, checksummed latest pointers, owner/workspace scope, and
double-read race checks prevent caller-shaped or rolled-back records from
minting authority. The record remains text-projection-only and grants no
provider-envelope, transport, credential, run, result, scene, estimate,
approval, work, render, runtime, or production authority. The canonical
semantic admission service consumes its current namespaced projection only
after the complete provider-neutral payload digest exists.

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

The first canonical portion of Slice 3C-B is now implemented. A private
process-bound selector may compile an admitted candidate or deliberate
non-use decision into a separate server-derived selected-scene binding while
the original deferred Living Frame user-intent component remains unchanged.
The binding, selected-scene admission, and semantic-plan projection are stored
as three content-addressed component references in the existing canonical
presented plan and included in its hash. The server additionally derives a
fourth content-addressed `livingFrameExecutionRequirements` record. It maps
each scene to one exact current canonical segment and projects the closed
named-work, timing, SoundSync, asset, QA, and private-review requirements
through the existing work-admission catalog. A fifth content-addressed
`livingFrameTimingBinding` record resolves the five semantic phases and
requested SoundSync cues to exact frames derived from that same canonical
segment and freezes the reference into the existing timing hash.

The server now also derives a sixth content-addressed
`livingFrameAssetWorkInputBinding` record. It recomputes the selected
synthesis route and asset-intent graph, binds approved-source intents to the
exact current source-media and cleanup authority, and refines broad
capability-derived work requirements against the actual selected asset chain.
This prevents over-broad work from entering the estimate: the controlled
source-derived scene fixture needs mask generation, RGBA processing, and
Remotion layer preparation, but no reconstructed background plate.

A seventh content-addressed
`livingFrameEstimateWorkAssetProjection` record consumes that exact input
binding. It binds every refined named work type to one existing exact-50 tool
cost owner, a conservative mock-safe cost range, explicit resource placement,
deterministic dependency ordering, exact asset-intent inputs/outputs, and one
expected output for the existing approved asset manifest. The current mask
requirement is GPU-only on Google Cloud Run with no CPU fallback. Neither
record adds a tool identity.

The server now derives an eighth content-addressed
`livingFrameCanonicalWorkGraphProjection` record after recalculating the
customer estimate and WeEditPro service fee. It adds the three refined
requirements to the one canonical plan work graph with exact source, cleanup,
asset-intent, dependency, output, and credit-budget lineage. The graph also
adds the exact FFmpeg source-frame dependency required by mask generation.
The mask requirement now reuses the existing `rembg` identity and operation
as a fixed Google Cloud Run GPU/NVIDIA L4/CUDA-only work item. CPU fallback,
runtime download, and network fetch are literal false. This does not add a
tool: the production registry remains exactly 50.

Operation admission is not runtime authority. The rembg work item remains
`privateExecutionReady = false` until the existing canonical CUDA image,
model-artifact mount, source-frame reread, GPU attempt/cost receipt, private
output verification, artifact commitment, and mask QA gates pass. The older
CPU rembg fixture cannot satisfy this gate.

The existing Sharp identity and operation now own the component-image step
without adding a tool. Its exact server-derived item depends on the approved
FFmpeg source-frame PNG and QA-selected rembg grayscale-mask PNG. The confined
runner performs real straight-alpha RGBA construction, clears transparent
RGB, deterministically encodes PNG, decodes it, and requires byte-exact pixel
agreement. It cannot run before both dependency artifacts are committed and
selected by the immutable worker lease.

The Remotion-layer requirement is now admitted as a tool-free, server-owned
manifest-compilation item. It depends on the exact Sharp RGBA output and
freezes the selected scene, layer identity, MasterTiming range, confirmed
output frame, full-frame fit, opacity, and the rule that captions remain
above Living Frame. The server also rewrites the one existing final Remotion
work item to depend on both the RGBA component and manifest, and adds the
overlay below the caption plane.

The canonical internal job runner now has an exact tool-free operation for
that manifest. It may run only with an active lease whose dependency authority
selects the one QA-passed and reconciled Sharp component. The resulting
private JSON binds the current plan/source/asset-manifest hashes, scene and
timing digests, frame and output dimensions, component artifact/version/hash,
dependency job, QA/reconciliation records, attempt, and immutable source
lease. Worker-lease verification reopens and rehashes the manifest before a
downstream job can consume it.

The one existing final Remotion coordinator now rereads that manifest and its
exact RGBA component, streams the PNG in server-owned commitment order, and
renders its approved window above source and below the existing caption plane.
The confined runner verifies the input hash and timeline again. A real private
4K streaming regression exercises source, Living Frame RGBA, captions, and
approved audio in one H.264/AAC composition. This does not create a second
renderer, a new production-tool identity, public delivery, or production
authority.

This is not a second Living Frame workflow. The existing WeEditPro estimate,
approval, work graph, asset manifest, QA, review, and renderer pipeline remains
the only owner of those stages. Deliberate non-use may continue through
ordinary approval. A selected scene may now be approved only after its exact
estimate, four-item work graph, manifest payload, and final-composition
dependencies are frozen into the immutable plan. Approval does not pretend
that GPU work has run: dispatch, final render, and delivery remain blocked
until rembg runtime evidence, dependency artifacts, artifact QA, and private
review pass. Approval and execution reload both the content-addressed
projection, every matching plan work item, and the final Remotion binding;
they cannot silently omit or rewrite the selected skill in an otherwise valid
final-render graph. See
`docs/living-frame/living-frame-selected-scene-binding.md`.
The exact requirements record is documented in
`docs/living-frame/living-frame-execution-requirements.md`.
The exact timing bridge is documented in
`docs/living-frame/living-frame-canonical-timing-binding.md`.
The exact source/asset/work input bridge is documented in
`docs/living-frame/living-frame-canonical-asset-work-input-binding.md`.
The exact cost/work/asset requirements projection is documented in
`docs/living-frame/living-frame-canonical-estimate-work-asset-projection.md`.
The exact pending canonical work-graph projection is documented in
`docs/living-frame/living-frame-canonical-work-graph-projection.md`.
The exact Sharp component operation is documented in
`docs/living-frame/living-frame-canonical-sharp-alpha-component.md`.
That projection now carries the exact scene-start MasterTiming frame mapped
back to the verified source-cleanup span. The resulting source-frame digest is
server-derived and remains non-executable until the existing GPU/tool runtime
admits the matching private source input.

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

#### Hidden-background-plate reconstruction planning

`living-frame-background-plate-reconstruction-v2` plans the general operation
needed when separating any component would expose pixels that were hidden in
the original still. It is subject-neutral: the removed component may be a
mechanical part, arm, prop, foreground object, clothing layer, diagram piece,
or any other alpha-isolated component. Musashi, helicopter, and every other
named example remain test stories rather than routes.

The compiler consumes a validated component rig and bounded hole expectations.
It requires an opaque, static plate node plus a removable component with a
future QA-passed still-alpha artifact. It classifies only small, ordinary,
interior holes as bounded OpenImageIO push-pull `fillholes` profile
candidates. It fails closed for frame-edge holes, large holes, complex or
unknown texture, identity or likeness regions, documentary evidence, and exact
map or data regions. Reconstruction never invents identity, factual evidence,
labels, geography, or data.

The ordered fallback ladder is:

1. keep the separated component static over the original plate;
2. reframe so the unreconstructed region is not exposed;
3. use an opaque full scene or panel; and
4. omit the depth effect.

The output expects the admitted `reconstruct_background_plate` work-item name,
an opaque source-plate dependency, a component-alpha-mask dependency, and a
`living_frame_reconstructed_background_plate_png` processed artifact. Required
QA includes unchanged pixels outside the mask, dimension and color-profile
identity, seam continuity, residual-mask inspection, non-invention safety, and
destination-composite review.

This slice deliberately creates no pixels. The existing OpenCV operation is
analysis-only and explicitly forbids derived-pixel output, so it is not the
reconstruction owner. The pinned OpenImageIO runtime exposes `oiiotool
--fillholes`, but there is no admitted Living Frame operation profile that
binds QA-passed source-plate and mask artifacts to it. That profile and the
current dependency artifacts therefore remain hard blockers. A future
execution slice must extend the existing tool-operation, dependency-read,
private artifact, cost, and QA authorities. It must not launch arbitrary
commands, add a Living Frame worker, or bypass the approved snapshot and
existing work graph.

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

- a separately bound provider envelope and provider transport;
- provider credentials, attempts, retries, and durable results;
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
| AuraFace | identity-continuity measurement capability |
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
- AuraFace is measurement-only: it cannot generate a likeness, condition an
  image model, select a scene, or approve identity continuity;
- AuraFace model-card and license labels do not prove training-data rights,
  consent, fairness, privacy compliance, or production suitability;
- AuraFace and every other identity-related route still require consent,
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

PuLID is a superseded proposal and is not part of the v2 candidate set.
Generic IP-Adapter plus the approved Visual Continuity Pack provide reference
conditioning. AuraFace supplies only a separately qualified continuity
measurement signal.

### Exact AuraFace artifact expectation

`living-frame-auraface-artifact-requirements-v1` gives the sixth capability a
concrete but non-promotable artifact boundary. It binds the pinned controlled
source observation and records exactly two ONNX identities: the
`glintr100` embedding model and `scrfd_10g_bnkps` detector/alignment model.
The gender/age model and identity-generation adapters are excluded.

The files are not downloaded or mounted. Publisher license/model-card labels
remain observations rather than legal or training-data-rights approval. The
contract keeps AuraFace measurement-only, prevents embedding/reference
persistence, requires project-calibrated thresholds and review for no-face or
multiple-face cases, and preserves consent, minor, impersonation, retention,
fairness, public-figure, and documentary-safety gates.

Future execution must reuse the shared model-artifact repository and
read-only mount authority on a bounded private CPU attempt. AuraFace remains
outside the shared ComfyUI L4 attempt and is costed separately only when it
actually runs. No operation, work, dispatch, cost receipt, QA approval, or
runtime authority is opened. See
`docs/living-frame/living-frame-auraface-artifact-requirements.md`.

### Controlled AuraFace continuity measurement

`living-frame-auraface-continuity-measurement-v1` implements the deterministic
comparison primitive without pretending that AuraFace inference is live. A
process-bound, single-use server reader supplies two controlled 512-component
`Float32` embedding fixtures. The contract validates exact artifact,
continuity-entry, preprocessing, and inference-output digests; requires
exactly one detected face in each input; rejects shared buffers, wrong vector
shapes, non-finite values, and zero norms; and returns integer-scaled cosine
similarity.

The score remains private sensitive evidence. Embeddings are never copied
into the serializable result, and the result itself has no browser-sharing or
persistence authority. It accepts no caller threshold, applies no universal
threshold, and cannot approve identity, likeness, scene selection, QA, or
historical truth. Project calibration, fairness review, consent, public-figure
and documentary safety, minor protection, impersonation safeguards, and user
review remain mandatory.

AuraFace still represents one optional CPU measurement attempt outside the
shared ComfyUI L4 attempt. The measurement primitive contains no attempt
amount, customer price, credit, or service fee. Existing tool-cost evidence
owns actual failed/completed/unknown attempt cost; the canonical estimate
aggregates and rounds customer credits once and applies the service fee once.
See
`docs/living-frame/living-frame-auraface-continuity-measurement.md`.

## Controlled-illustration operation preflight

The non-executable operation preflight fixes how the six capabilities enter
the existing backend spine:

```text
approved Living Frame lineage
  -> selected component asset intent
  -> one future ComfyUI generate-image operation
  -> one bounded L4 GPU host lifetime
  -> conditional ControlNet / IP-Adapter / LoRA capabilities
  -> external control-image preparation when needed
  -> separate AuraFace CPU continuity measurement when needed
  -> canonical component asset QA and actual-cost evidence
```

It expects the existing `generate_image_asset` work type and one future
server-owned `tool.comfyui.generate_controlled_image.v1` operation. It does
not add six production tool IDs, mutate the current 50-tool registry, create
a work item, dispatch a worker, mount a model, mint an attempt-cost receipt,
or grant runtime authority. See
`living-frame-controlled-illustration-operation-preflight.md`.

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

## Subject-neutral synthesis-routing slice

Living Frame examples such as an illustrated historical figure, a vehicle with
selectively moving parts, or an exact geographic explanation are regression
fixtures only. They are not built-in subjects, categories, prompt routes, or
runtime branches. The synthesis-routing compiler operates only on verified
Living Frame semantic-plan components and applies the same closed strategy
ladder to every subject:

```text
reuse an approved asset
  -> construct deterministically
  -> generate or edit an approved still
  -> create a controlled still variation when continuity requires it
  -> use bounded generated video only as a justified last resort
  -> simplify the visual or deliberately use no extra visual
```

The compiler emits one abstract candidate route per component. It never emits a
provider, model, tool, operation, work item, job, queue, price, cost, command,
path, URL, media byte, or executable renderer instruction. Exact maps and data
graphics remain deterministic and cannot fall back to generated video.
Identity-conditioned and unqualified adapter routes fail to the simpler-visual
fallback. Alpha and temporal-mask needs retain their existing artifact and QA
gates.

The ordered ladder is semantic and digest-bearing. Reordering it changes the
digest and fails validation when it violates deterministic-first or
video-last rules. Set-like capability and blocker codes canonicalize
independently. Deliberate non-use produces no component routes and is a correct
outcome.

This slice remains non-promotable. Canonical selected-scene admission, current
asset and continuity evidence, Tool Strategy projection, provider
qualification, estimates, approval, immutable snapshot lineage, named work
creation, asset-manifest entries, artifact QA, Remotion review, and production
execution remain downstream shared authorities.

## Subject-neutral component asset-intent slice

The component asset-intent compiler converts each verified abstract synthesis
route into an ordered, dependency-safe list of asset *expectations*. It does
not create an asset, work item, manifest row, tool route, provider request, or
queue entry.

The compiler uses the existing named `EditWorkItemType` vocabulary only:

- approved-source reuse has no new work expectation;
- deterministic vectors and effects expect
  `prepare_remotion_layer`;
- exact geography expects `render_map_asset`;
- exact data graphics expect `render_chart_asset`;
- opaque still sources expect `generate_image_asset`;
- still or temporal masks expect `generate_mask_asset`;
- alpha-processed still components expect `process_image_asset`;
- bounded video, when the upstream synthesis policy has justified it as the
  last resort, expects `generate_ai_video_asset`; and
- a reconstructed plate expects the already admitted
  `reconstruct_background_plate` work type.

`custom` is forbidden. Every named work expectation must already occur in the
verified Living Frame work-admission catalog, and later canonical planning must
revalidate it before creating any real `EditWorkItem`.

Asset intents distinguish source anchors, generated opaque anchors, mask
companions, processed RGBA components, deterministic specifications, bounded
video clips, and reconstructed plates. Dependencies are ordered and
acyclic. A processed RGBA component, for example, depends on exactly one
opaque/reused still source and its still-alpha mask. Final render placeholders
are always forbidden; preview placeholders are expectations only.

This boundary preserves the current alpha policy:

```text
opaque source intent
  -> mask intent
  -> processed RGBA component intent
  -> future canonical asset-manifest projection
  -> artifact and destination-composite QA
```

The examples continue to be fixtures only. No person, vehicle, place, genre,
or narrative topic has a special asset route, and the contract explicitly
rejects subject-specific routing fields.

The bundle binds the semantic-plan projection, projected Living Frame
component, synthesis-routing plan, and work-admission catalog by SHA-256. Its
standalone validator proves closed structure, dependency semantics, and the
absence of promoted authority. The compiler additionally rereads all upstream
objects and proves their cross-object lineage; a caller cannot establish that
lineage by supplying matching booleans or a self-signed packet.

The resulting bundle remains planning-only and non-promotable. These gates stay
closed:

- current source-asset and continuity evidence;
- canonical selected-scene admission;
- Tool Strategy and provider/model-weight qualification;
- estimate, customer credits, approval, and immutable snapshot binding;
- exact MasterTimingPlan and SoundSync authority;
- actual work-item creation, dependency graph mutation, queue dispatch, or
  asset-manifest mutation;
- component artifact generation, alpha/mask/reconstruction QA, and final asset
  reconciliation; and
- Remotion execution, private review, export, runtime, and production
  readiness.

## Existing-QA-plan expectation projection

Living Frame does not own another QA plan or another pass/fail authority.
`living-frame-qa-expectation-v1` compiles the verified semantic plan and
component asset-intent bundle into closed expectations for the existing
`EditQAPlan` categories and the existing editing-agent QA gate sequence.

The projection covers:

- narrative relevance, focal hierarchy, visual-density restraint, and
  generated-video restraint;
- caption, face, and gesture safe regions;
- component separability, continuity, alpha, temporal-mask, pivot, and
  reconstructed-plate measurements;
- semantic timing, attention restoration, narration protection, and final
  destination-composite review;
- semantic-scale, documentary, exact-geography, and exact-data truth;
- canonical selected-scene and asset-intent lineage revalidation; and
- the prohibition on required final-render placeholders.

Each expectation maps to an existing `QACategory`, one existing agent gate
stage (`preflight_gate`, `asset_quality_gate`, `merge_gate`,
`render_preflight_gate`, or `final_qa_gate`), a severity expectation, and a
closed evidence requirement. Every expectation remains
`future_canonical_check_required`; this compiler can neither create a
`SegmentQAPlanItem` nor mark one passed.

The bundle is content-addressed and binds the exact semantic-plan projection,
projected Living Frame component, and component asset-intent bundle. A
deliberate non-use decision produces no QA expectations and is valid. Named
fixtures continue to test only broad capability families; there is no
subject-specific QA routing.

The canonical `createEditQAPlan` owner must later reread this projection and
instantiate the checks inside the one QA plan during selected-scene planning.
Artifact measurements and destination-composite review must come from the
existing private artifact and review authorities. A caller-signed or all-green
packet cannot grant QA, approval, work, render, runtime, or production
authority.

## Component artifact-intent reconciliation

`living-frame-component-artifact-reconciliation-v1` closes the structural gap
between the subject-neutral asset-intent compiler and the measured scene
evidence package. It answers one bounded question:

> Is each measured component artifact structurally compatible with the
> component's ordered asset-intent chain?

The compiler rereads and verifies both source packets, selects exactly one
scene, groups intent chains by component, and matches their expected terminal
form to the measured artifact class:

- approved or generated opaque anchors may match an opaque raster;
- an opaque still plus still mask plus processed output must match a measured
  RGBA still;
- source A-roll plus a temporal-mask intent must match source A-roll and an
  independently referenced mask artifact;
- deterministic graphics, maps, and data specs may match their admitted
  raster or alpha-primitive form;
- reconstructed plates must match an opaque plate; and
- bounded generated video is deliberately rejected because the current scene
  evidence and deterministic Living Frame renderer contracts do not admit a
  generated-video artifact primitive.

This is a structural candidate, not provenance. Matching an artifact ID and
digest to an expected intent does **not** prove that an approved work item
created it. Canonical work-output lineage, asset-manifest lineage, current
artifact reread, and artifact QA therefore remain mandatory blockers even when
every component is structurally compatible.

The component binding records ordered intent IDs, expected artifact and mask
intent references, measured artifact references, the closed compatibility
class, and any incompatibility blockers. It cannot create work items, manifest
entries, tool or provider routes, estimates, approvals, timing, renderer
layers, or execution requests. A deliberate non-use asset bundle accepts no
scene evidence and produces an empty valid reconciliation.

All matching rules are subject-neutral. Historical figures, vehicles,
geographic explanations, and the other named examples remain regression
fixtures only; no subject name, topic, genre, or category may alter the
reconciliation algorithm.

## Remotion motion-sample binding

The existing Living Frame Remotion profile records layer and camera motion
track IDs, but a renderer cannot execute IDs alone. The
`living-frame-remotion-motion-sample-binding-v1` compiler rereads the exact
non-executable profile and deterministic motion bundle, proves their scene,
output-frame, and MasterTiming lineage agree, and binds every referenced track
to its complete frame-sampled scalar values.

For each layer or virtual camera, the binding retains:

- the ordered source-profile track IDs;
- the exact compiled track owner, property, role, easing, source keyframes,
  frame range, restoration expectation, and per-frame samples;
- the source profile's expected sample count;
- the independently derived compiled sample count; and
- closed blockers for missing tracks, owner mismatch, or count mismatch.

This closes only the abstract motion-sample projection gap. It does not admit
the payload to the offline Remotion protocol. Current profile reread,
MasterTiming and output-frame revalidation, committed artifact bytes, mask
artifacts, artifact QA, protocol-profile admission, private execution, and
private review remain mandatory downstream gates.

The binding contains no media bytes, paths, commands, tool or provider route,
job, queue, cost, or commercial data. It cannot create artifacts, work items,
manifest entries, approvals, snapshots, or renderer execution. The existing
MasterTimingPlan and non-executable Living Frame Remotion profile remain the
only authorities. Matching is component- and track-based, never
subject-specific; named scenes remain regression fixtures only.

## Canonical preapproval reasoning preparation

The canonical server now has a private prepared-run boundary between semantic
admission and any future provider transport. It rebuilds the current
preapproval-input authority, generic source-speech evidence, complete
provider-neutral semantic payload, and exact route-data assurance before
creating a prepared run.

The additive workload class
`pre_plan_living_frame_semantic_reasoning_prepared` binds the complete semantic
payload digest as its request digest. It does not reuse the older metadata
expectation digest as provider request authority, and it does not change the
existing controlled Living Frame fixture or Edit Reference V6 receipt lane.

The server prepares exactly the first Kimi K3 envelope, including the bounded
semantic payload and strict output JSON schema, but does not issue submission
authority. The private repository persists an immutable content-addressed
version under a cooperative lock, atomically updates a checksum-protected
current pointer, and rereads the record twice. This is restart-safe for one
backend host only; distributed attempt durability remains explicitly false.

Provider adapter, credential capability, one-use submission authority, and a
distributed CAS attempt lifecycle remain required before transport. No
provider call, attempt receipt, actual attempt cost, result, selected scene,
timing, SoundSync, estimate, credits, approval, snapshot, work, queue, tool,
asset, render, runtime, or production authority is created here. See
`docs/canonical-living-frame-preapproval-reasoning-lifecycle.md`.

## Canonical preapproval attempt reservation

The server now reserves the exact first Kimi attempt as a separate,
content-addressed control-plane record. It rereads the prepared run, rebuilds
the complete current semantic admission, derives every route and request
binding server-side, persists the digest-only reservation under a cooperative
lock, rereads it twice, then repeats the source reads to reject a race.

Reservation does not mean execution. The one-use submission authority remains
`not_issued`, provider submission count remains zero, no provider-request
record or request ID exists, and credential, transport, observation,
checkback, fallback, attempt-cost, and result authorities remain false. The
caller cannot supply an attempt ID, provider, route, credential, submission,
cost, work item, queue item, or runtime field.

The repository is restart-safe for one backend host only. A later distributed
CAS lifecycle must own provider-request reservation, one-use submission
consumption, append-only observations, checkback leases, terminal
attempt-and-cost atomicity, exact durable-response replay, and unknown-outcome
reconciliation. See
`docs/canonical-living-frame-preapproval-reasoning-attempt-reservation.md`.

## Canonical Kimi request material

The server can now compile the verified prepared run plus its exact first
attempt reservation into deterministic private Kimi request material. The
material uses one fixed server-owned instruction, the complete validated
provider-neutral semantic payload, the exact strict output JSON schema, and an
empty tool set. Stable JSON byte length and SHA-256 bind the whole internal
material to the run, envelope, reservation, route, assurance, idempotency, and
budget records.

This is not a Kimi API request. The live provider API contract version,
immutable provider model revision, and provider model aggregate remain
`null`. No request body is created or persisted, and the material is neither
browser-shareable nor loggable. Credential, one-use submission, distributed
CAS, provider request, observation, checkback, fallback, attempt cost, result,
commercial, selected-scene, timing, work, render, runtime, and production
authorities remain false.

A later reviewed adapter must qualify the exact current provider API and model
identity, reread all current source and assurance authority, then consume this
material only inside a durable distributed one-use/unknown-outcome lifecycle.
See
`docs/canonical-living-frame-preapproval-kimi-request-material.md`.

## Canonical Kimi API source observation

The current official Kimi K3 Markdown and OpenAPI sources are now represented
by a separate controlled, content-addressed source observation. The observed
wire shape is compatible with the existing private request material:
non-streaming `POST /v1/chat/completions`, `model = kimi-k3`, top-level
`reasoning_effort = max`, stable string messages, strict JSON Schema response
format, omitted tools, and omitted fixed sampling fields. Only final
`choices[0].message.content` may later enter semantic-result parsing;
`reasoning_content` is never the result.

This source match is not runtime qualification. The provider model list does
not expose an immutable revision or aggregate identity. The synchronous Chat
Completions operation documents neither provider idempotency nor a completion
retrieval endpoint. The exact Living Frame schema has not yet passed MFJS plus
target-model validation, and the adapter has not bound a canonical
`max_completion_tokens` ceiling instead of K3's large default.

Current-source reread, account/model access, immutable model identity,
schema/live-probe evidence, bounded output tokens, distributed one-use state,
credential capability, and unknown-outcome operator reconciliation all remain
required. The compatibility assessment creates no provider body, request,
credential, call, cost, result, commercial, selected-scene, work, render,
runtime, or production authority. See
`docs/canonical-living-frame-preapproval-kimi-api-contract-observation.md`.

## Canonical Kimi MFJS provider-schema projection

The exact canonical semantic-result schema contains 13 `const` and 24
`pattern` constraints. Pinned official Walle `v0.1.13` accepted that schema at
its provider-required permissive `strict` level but rejected `const` at its
comprehensive `ultra` level. The server therefore derives a separate
content-addressed provider projection:

- every `const` becomes a same-type singleton enum;
- regex patterns are omitted from constrained decoding;
- object shape, required fields, types, array bounds, numeric bounds,
  text-length bounds, and existing enums remain unchanged; and
- the original canonical schema remains mandatory after final-content parsing.

The 15,145-byte projection passes both pinned Walle levels. It is not a second
result DTO or acceptance contract. It cannot bypass the original Zod and
semantic cross-validation gates. Current API and validator reread, the live
target-model probe, current account/model access, immutable model identity, a
request-specific completion-token ceiling, distributed one-use state,
credential capability, and unknown-outcome reconciliation remain required.
No provider body or transport authority exists. See
`docs/canonical-living-frame-preapproval-kimi-mfjs-schema-projection.md`.

## Canonical Kimi request-specific output budget

The server now derives one request-specific constrained-decoding profile from
the exact MFJS projection and current provider-neutral semantic payload. It
does not introduce another result DTO: the original Zod schema and semantic
cross-validator remain the only result-acceptance authorities.

The controlled profile permits one bounded scene with at most eight
components, 28 component dependencies, 12 mini-skill activations, five timing
constraints, five attention constraints, eight scale constraints, six sound
constraints, and 19 QA expectations. Decision kinds, scene modes, segment
references, and evidence references are narrowed to exact current request
values. The adapter profile is for one preapproval attempt only and does not
claim complete multi-scene batching.

A canonical-profile calculator counts every required property and every array
maximum, the longest enum serialization, a conservative 32 bytes per
unrestricted finite number, six UTF-8 bytes per unrestricted string code unit,
and one byte only for canonical ASCII safe-ID and SHA-256 strings. It also
proves every counted object is closed and every property is required. It does
not use graph or semantic cross-validation rules to reduce the bound. The
controlled request is bounded at 118,246 canonical minimal-JSON bytes.
Equivalent raw JSON with excess whitespace, redundant escapes, or unusual
numeric lexemes is not bounded and must fail closed if truncated or invalid.

The public `moonshotai/Kimi-K3` tokenizer observation contains all 256
single-byte tokens, so visible UTF-8 token count cannot exceed byte count for
that exact observed source. The live API exposes only a mutable `kimi-k3`
alias, however, and completion tokens include hidden reasoning. The observed
131,072-token default therefore remains a candidate ceiling, not transport
authority; its 12,826-token nominal headroom has not been proven sufficient
for hidden reasoning.

At the current immutable rate card, a deliberately conservative full
1,000,000-token cache-miss input plus the entire 131,072-token completion cap
costs at most 4,966,080 normalized USD micros, beneath the prepared
5,000,000-micro internal budget. This creates no customer price, service fee,
credit estimate, reservation, wallet change, or actual attempt cost.

Current API and tokenizer reread, authenticated account/model access, a
bounded live schema/completion probe, completion-ceiling qualification,
distributed one-use state, least-privilege credentials, and unknown-outcome
operator reconciliation remain mandatory. No request body, provider call,
result, selected scene, approval, snapshot, work, render, runtime, or
production authority exists. GPU-heavy inference remains restricted to
qualified Google Cloud Run GPU workers; this projection performs no inference
and adds no CPU fallback. See
`docs/canonical-living-frame-preapproval-kimi-output-budget-projection.md`.

## Controlled-illustration actual-cost attribution

### Dated Cloud Run L4 estimate-rate correction

The Living Frame controlled-illustration GPU estimate now uses a namespaced,
dated 2026-07-29 observation of the default public list prices for Cloud Run
CPU, memory, non-zonally-redundant NVIDIA L4 time, Cloud Run ephemeral disk,
and `europe-west1` Regional Standard Cloud Storage. It also accounts for one
Class A output write per generated asset.

The calculator applies Cloud Run's 60-second instance-based minimum and
100-millisecond rounding separately to every planned attempt. It holds the
public prices in integer USD nanos, aggregates the SKU contributions, and
rounds to USD micros once. It adds no synthetic renderer charge. At the
current controlled 8-vCPU, 32-GiB, one-L4, 90-second assumption, one generated
asset attempt is 35,598 expected internal USD micros including two GiB of
temporary disk and one approximately 100-MiB output retained for 24 hours.

ComfyUI, external preprocessing, ControlNet, generic IP-Adapter, and loaded
PEFT/LoRA continue to share that one host-attempt cost. Normal, Premium, and
Ultra Premium plan one, two, and three attempts per generated asset. AuraFace
remains a separately attributed optional CPU continuity measurement and
retains the generic placeholder estimate until its production placement is
qualified.

This is not a production rate card. Free-tier and account discounts are not
applied, and current Cloud Billing Pricing API reread, billing-account rate
binding, actual worker usage, invoice reconciliation, customer billability,
one-time credit rounding, the single Reeditpro service fee, approval,
reservation, wallet, and settlement remain owned by the existing canonical
authorities. See
`docs/living-frame/living-frame-cloud-run-l4-pricing.md`.

Living Frame now has a controlled, non-promotable bridge from the existing
private worker resource-usage evidence into capability-level cost
attribution. One observed ComfyUI GPU attempt owns the combined
ComfyUI/preprocessor/ControlNet/IP-Adapter/PEFT-LoRA cost; those capability
labels never become five independent charges. AuraFace remains a separately
measured optional CPU continuity check.

Completed, failed, and unknown attempts retain incurred internal cost. Exact
approved-asset reuse adds zero new attempt cost without deleting the original
attempt lineage. The bridge contains no customer price or credits: the
existing canonical settlement authority must first decide the billable
subset, perform canonical aggregate rounding, add the one approved service
fee, apply refund/overage policy, and enforce the reservation ceiling.

This is controlled fixture evidence only. Released observed-usage transport,
official cloud rates, invoice reconciliation, distributed attempt-cost
durability, canonical settlement-event projection, and customer billability
remain closed. See
`docs/living-frame/living-frame-controlled-illustration-actual-cost-attribution.md`.

## Controlled-illustration settlement contribution

The controlled actual-cost attribution now compiles into a non-promotable
settlement contribution that aggregates the completed-attempt subset in USD
micros before converting it to integer credits. Credits are then assigned to
completed attempts by deterministic largest-remainder allocation. This
prevents five capabilities inside one ComfyUI host from being rounded into
five separate charges and prevents optional AuraFace measurement from causing
per-event rounding inflation.

Failed and unknown attempts remain recorded as incurred internal cost but are
excluded from the customer-billable candidate total. Exact approved-asset
reuse creates no new settlement event. The adapter contains no service-fee
line or final charge. Current-evidence reread, official rates and invoices,
durable events, canonical billability, reservation reconciliation, one
service-fee calculation, overage/refund policy, wallet settlement, and export
unlock remain owned by the existing canonical settlement authority. See
`docs/living-frame/living-frame-controlled-illustration-settlement-contribution.md`.

## Controlled-illustration host catalog boundary

The server capability catalog retains exactly one non-E2E `comfyui`
execution-host identity for Living Frame qualification work. This does not
expand the exact 50 canonical private production tools and does not make
ComfyUI selectable, dispatchable, installed, approved, or customer-visible.

The remaining controlled-illustration pieces are deliberately not modeled as
five additional production tools. `comfyui_controlnet_aux` is an optional
external preprocessing bundle; ControlNet, IP-Adapter, and PEFT/LoRA are
model/adapter capabilities governed by a future operation's exact artifact
manifest; AuraFace is a separate post-generation continuity-QA capability.
One future ComfyUI GPU attempt therefore composes the first five capabilities
and is priced once, while optional AuraFace measurement is accounted for
separately. This preserves the exact production tool registry and prevents
capability labels from becoming duplicate customer charges.

The capability profile remains fail-closed on exact model/checkpoint and
adapter licenses, compatibility, dependency closure, signed GPU image, SBOM,
read-only content-addressed mounts, graph allowlists, private dispatch, output
QA, and observed attempt-cost receipts. Admission to `ProductionToolId` can
occur only after the existing canonical private end-to-end and job-adapter
evidence requirements are satisfied.

## Controlled stock ComfyUI graph expectation

Living Frame now has a source-bound, subject-neutral graph compiler for the
pinned stock ComfyUI node surface. It emits deterministic non-executable
`base_txt2img`, `lora_txt2img`, `controlnet_txt2img`, and
`controlnet_lora_txt2img` expectations. The graphs contain only closed
built-in node classes and opaque digest bindings; they cannot contain raw
prompts, filenames, paths, URLs, caller-selected providers/tools, custom
nodes, jobs, queues, `LoadImage`, or `SaveImage`.

ControlNet profiles accept only an externally prepared content-addressed
control-image expectation. This prevents `comfyui_controlnet_aux` or any
unreviewed annotator from entering the graph implicitly. LoRA uses the stock
loader but remains blocked on an exact approved adapter artifact. IP-Adapter
does not exist in the observed stock node set and therefore remains behind a
separately qualified extension/runtime binding. AuraFace stays outside the
generation graph as continuity measurement and QA.

The graph digest proves structure, ordering, closed input contracts, and
source-observation lineage only. It grants no installation, model artifact,
prompt, operation, dispatch, work, asset, estimate, approval, timing,
SoundSync, QA approval, render, runtime, or production authority. See
`docs/living-frame/living-frame-controlled-comfyui-workflow.md`.

## Generic IP-Adapter extension boundary

Because the observed stock ComfyUI revision has no IP-Adapter node, generic
reference conditioning is isolated behind a source-bound extension
evaluation. The narrow structural boundary admits only
`IPAdapterModelLoader` and `IPAdapterAdvanced`; unified loaders, FaceID,
InsightFace, embed file I/O, runtime downloads, caller filenames, and all
other arbitrary plugin nodes remain prohibited.

The evaluated extension source, its GPL deployment boundary, exact dependency
lock, ComfyUI compatibility, generic IP-Adapter and CLIP Vision weights, base
model compatibility, reference-image artifact, security confinement, and
quality/identity benchmarks all remain separately gated. AuraFace is not
injected as an adapter and cannot convert a FaceID workflow into an approved
generic route. The source evaluation proves only that a generic route can be
represented; it grants no package, artifact, tool, operation, dispatch, work,
cost, approval, QA, render, runtime, or production authority. See
`docs/living-frame/living-frame-ipadapter-extension-evaluation.md`.

The corresponding generic workflow-extension contract connects a validated
stock ComfyUI graph to exactly three additional nodes:
`CLIPVisionLoader`, `IPAdapterModelLoader`, and `IPAdapterAdvanced`. It
supersedes the direct stock model-to-sampler edge with a digest-bound
reference-conditioning path. The IP-Adapter model, CLIP Vision model, and
reference image remain unresolved content-addressed expectations; no bytes,
filenames, paths, URLs, runtime selection, or executable prompt enters the
contract. See
`docs/living-frame/living-frame-ipadapter-workflow-extension.md`.

The merged-workflow compiler revalidates both parent contracts and
materializes one effective acyclic graph. It preserves every stock node,
adds the three reviewed generic IP-Adapter nodes, removes exactly the direct
stock model-to-sampler edge, inserts the reference-conditioning path, and
combines stock and extension binding expectations without duplicate or
dangling identifiers. The result is still non-executable and contains only
graph metadata and digests. See
`docs/living-frame/living-frame-ipadapter-merged-workflow.md`.

## Deterministic external ControlNet images

ControlNet does not depend on an unqualified in-graph
`comfyui_controlnet_aux` node. Living Frame has deterministic reference-pixel
contracts for three externally prepared control-image kinds:

- Canny: a fixed grayscale, blur, Sobel, non-maximum-suppression, and
  hysteresis pipeline over bounded RGBA input;
- depth: a fixed big-endian uint16 depth-sample packet normalized into a
  measured grayscale RGBA image; and
- pose: a deterministic COCO-17-style skeleton rasterizer over an already
  source-bound landmark packet.

These processors do not detect poses, estimate depth, choose the semantic
control mode, or claim source truth. They transform already admitted inputs
into deterministic bytes and reports. The control-image workflow binding
revalidates the matching report, exact output bytes, frame dimensions, and
the target stock ControlNet graph before replacing its unresolved
control-image expectation with content-addressed lineage.

No generated artifact is committed by these contracts, and no source
analysis, model weight, work, asset manifest, tool, dispatch, timing,
estimate, approval, QA approval, render, runtime, or production authority is
created. See `docs/living-frame/living-frame-control-image-canny.md`,
`docs/living-frame/living-frame-control-image-depth.md`,
`docs/living-frame/living-frame-control-image-pose.md`, and
`docs/living-frame/living-frame-control-image-workflow-binding.md`.

## Controlled ComfyUI dependency closure

The candidate ComfyUI host now has controlled, non-promotable dependency-lock
evidence for a Linux amd64 Ubuntu 22.04 / Python 3.10.12 / CUDA 12.4-family
worker image. The evidence binds 35 exact wheel artifacts by ordered name,
version, filename, byte length, and SHA-256, plus immutable source archives
for the ComfyUI host, the generic IP-Adapter extension, and the auxiliary
preprocessor bundle. The offline rebuild used no package index, no dependency
resolution, and no network.

A confined CPU-emulation probe verified the measured node schemas and repeated
five small deterministic stock/preprocessor graphs. This proves only the
observed dependency closure and deterministic bounded host behavior. The
candidate image is not canonical, scanned, signed, deployed, or approved; no
model generation or GPU execution occurred.

Canonical wheel/source repository admission, signed-image rebuild, exact
read-only model mounts, node allow/deny enforcement, GPU generation and
quality benchmarks, selected-scene snapshot binding, dispatch, work, asset
QA, cost evidence, and private review remain mandatory. See
`docs/living-frame/living-frame-comfyui-dependency-lock-evidence.md`.

## Controlled model-family coherence

The controlled generation graph now has one fail-closed model-family
coherence binding across the stock ComfyUI graph, deterministic ControlNet
input binding, LoRA slot, and optional merged generic IP-Adapter graph. It
derives the ordered artifact slots and their exact binding digests from the
already validated parents and rejects missing, extra, cross-family, or
wrong-CLIP-Vision declarations.

This is not a model manifest and cannot qualify an artifact from a caller
label. Current artifact metadata remains absent and exact compatibility
remains unproven until the workflow-neutral canonical model-artifact
repository, protected mounts, independent metadata verification, legal
review, and offline compatibility benchmarks exist. AuraFace remains
separate continuity QA; FaceID, InsightFace, and AuraFace generation
conditioning remain prohibited. See
`docs/living-frame/living-frame-controlled-model-family-binding.md`.

## Exact unresolved ComfyUI model-artifact requirements

The validated model-family binding now projects an ordered, subject-neutral
requirement set for the actual generation graph. A full controlled route
contains five GPU-required roles: base diffusion checkpoint, matching
ControlNet checkpoint, matching LoRA adapter, matching generic IP-Adapter
checkpoint, and matching CLIP Vision checkpoint. Each role retains its
original graph-binding digest, family expectation, CUDA placement, no-CPU
fallback, and no-download/no-network policy.

The projection also revalidates the controlled dependency-lock observation
and binds its exact digest. It is still unresolved: it contains no locator,
manifest, bytes, filename, path, URL, tool/provider route, work item, cost
event, approval, mount, or runtime authority. Resolution must use the shared
canonical model-artifact repository, then separately prove exact bundle
compatibility, licensing, signed-image construction, read-only mounts,
dispatch, output QA, observed cost, and private review. See
`docs/living-frame/living-frame-comfyui-model-artifact-requirements.md`.

## Canonical ComfyUI model-artifact binding

The unresolved five-role requirement set can now be bound to the existing
workflow-neutral canonical model-artifact repository through a process-bound
server resolver. For each role, the adapter forces a fresh full-object
checksum verification and matches the exact role, model family,
`safetensors` format, `comfyui.private-inference` consumer scope, byte length,
revision, GPU target, CUDA requirement, and no-CPU/no-download/no-network
policy.

The output contains repository locators and verification digests but no host
path, mount alias, credential, filename, or model bytes. It projects the
existing canonical GPU-bundle requirement shape rather than creating a
Living Frame bundle authority. Repository verification is not compatibility,
license approval, mounting, dispatch, inference, output QA, cost evidence, or
production readiness. Those remain separately fail-closed. See
`docs/living-frame/living-frame-comfyui-canonical-model-artifact-binding.md`.

## Single-use read-only model source presentation

The canonical repository binding can now be consumed through the existing
single-use read-only model-artifact lease. Each of the five ordered model
roles is verified before and after presentation to one process-bound
`comfyui.private-inference` consumer. The consumer receives a server-derived
alias only inside its callback; the returned evidence contains identities and
digests, never host paths, aliases, URLs, credentials, filenames, or bytes.

This proves local canonical source presentation, not a distributed Cloud Run
mount and not inference. Bundle compatibility, paid-use approval, a canonical
operation artifact set, signed GPU image, private distribution, selected
scene/snapshot/work dispatch, output QA, actual attempt-cost evidence, and
private review remain closed. See
`docs/living-frame/living-frame-comfyui-read-only-model-mount.md`.

## Exact controlled SDXL artifact candidates

The five unresolved ComfyUI model roles now have one exact, subject-neutral
SDXL candidate set rather than family labels alone. The server-only contract
binds immutable, dated upstream metadata for the SDXL 1.0 base checkpoint,
matching SDXL canny ControlNet, SDXL example LoRA, generic non-FaceID SDXL
IP-Adapter, and its OpenCLIP ViT-bigG-14 image encoder.

This is deliberately weaker than repository admission. The candidate packet
records upstream-reported revisions, sizes, LFS SHA-256 values, model-card
digests, and declared license labels, while stating that ReeditPro has not
yet independently read and hashed every full artifact, inspected every
`safetensors` schema, proven bundle behavior, or approved paid production
use. It cannot satisfy the canonical artifact repository, read-only lease,
GPU operation, selected-scene, snapshot, dispatch, cost, QA, or private-
review gates by itself.

The exact candidate definition prevents an SD1.5 ControlNet, FaceID route,
InsightFace dependency, AuraFace generation route, or mismatched CLIP Vision
checkpoint from silently entering the SDXL graph. AuraFace remains a
separate continuity-measurement capability only. See
`docs/living-frame/living-frame-controlled-sdxl-artifact-candidate-set.md`.

## Exact SDXL LoRA byte observation

The first candidate role has a reusable full-stream verifier and strict
`safetensors` inspector. It checks the exact byte length and SHA-256, parses
the bounded header, verifies every tensor span against shape and dtype,
requires contiguous non-overlapping offsets, and proves that the tensor
payload exactly accounts for the data section. It returns only measurement
digests and counts, never model bytes or a filesystem location.

The retained controlled observation also exposes a material compatibility
warning: the selected LoRA metadata names `sdxl_base_v0-9` even though the
candidate is hosted at the pinned SDXL 1.0 repository revision. Therefore
the full bundle remains unqualified until an exact load and behavior
benchmark resolves that difference. The smoke only claims a new byte
verification when the exact server-owned artifact path is injected; a
missing artifact produces an explicit skip rather than a fabricated pass.
See
`docs/living-frame/living-frame-controlled-sdxl-lora-byte-observation.md`.

## Complete five-role SDXL byte-verification chain

Equivalent process-bound, single-use full-stream verifiers now exist for the
remaining ControlNet, generic IP-Adapter, CLIP Vision, and SDXL base roles.
Each verifier depends on the prior role observations, so a later role cannot
claim completion while an earlier artifact is missing or tampered. The
shared bounded `safetensors` inspector checks full SHA-256, tensor accounting,
dtype and shape spans, namespace summaries, selected compatibility shapes,
metadata digests, and exact end-of-data coverage.

The source-only smokes are intentionally conditional. When the canonical
server-owned artifact paths are not injected, each reports
`skipped_exact_server_owned_artifact_paths_not_injected`; it does not count
that as a controlled fixture or production proof. When all five exact
artifacts are supplied, the base smoke replays the entire dependency chain
and produces the complete-bundle byte observation. Compatibility, quality,
license, paid-use, GPU execution, output QA, cost, and private review remain
separate gates.

See:

- `docs/living-frame/living-frame-controlled-sdxl-controlnet-byte-observation.md`;
- `docs/living-frame/living-frame-controlled-sdxl-ipadapter-byte-observation.md`;
- `docs/living-frame/living-frame-controlled-sdxl-clip-vision-byte-observation.md`; and
- `docs/living-frame/living-frame-controlled-sdxl-base-byte-observation.md`.

## Exact SDXL candidate-to-repository binding

The complete five-role byte-observation chain can now be cross-validated
against the existing workflow-neutral canonical model-artifact repository.
The server adapter revalidates both parents and requires exact semantic order,
role, binding kind, artifact ID, immutable revision, model family, byte
length, SHA-256, repository admission, review state, and canonical GPU-bundle
slot identity for every object. The canonical repository performs another
full checksum verification rather than trusting the candidate packet.

This binding runs only when the five exact server-owned artifacts are
available; its smoke reports a fail-closed skip otherwise. Repository
identity still does not prove that the base, ControlNet, LoRA, IP-Adapter, and
CLIP Vision artifacts load or behave correctly together. Compatibility,
license, paid-use, signed-image, distributed read-only mount, selected scene,
snapshot, dispatch, cost, output QA, and private review remain closed. See
`docs/living-frame/living-frame-controlled-sdxl-canonical-artifact-binding.md`.

### Subject-neutral SDXL compatibility benchmark specification

The controlled illustration route now has a current-parent compatibility
benchmark specification:
`living-frame-controlled-sdxl-compatibility-benchmark-spec-v2`.

The specification consumes the five-role candidate set, the exact unresolved
artifact requirements, the current stock ControlNet/LoRA plus generic
IP-Adapter merged graph, the model-family coherence binding, and the pinned
offline dependency lock. It deliberately does not revive the superseded
Living Frame-specific preflight-package or runtime-evidence authorities.

Seven ordered GPU probes cover exact bundle loading, a base-only baseline,
isolated LoRA, ControlNet, and generic IP-Adapter effects, a full combined
generation, and a same-seed replay. The fixed measurements cover load
integrity, network-off confinement, output validity, effect strength,
determinism, peak memory, and load/generation duration.

This is a non-executable, subject-neutral specification. It contains no
Musashi, helicopter, Hormuz, or other content-specific routing. Exact
canonical repository identities, read-only mounts, GPU admission, measured
results, legal review, dispatch, assets, QA, selection, approval, and
production remain false. See
`docs/living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec.md`.

The companion
`living-frame-controlled-sdxl-benchmark-admission-audit-v2` reads the current
server tool catalog and operation registry directly. It confirms that
ComfyUI is an evaluation-only, non-E2E GPU capability candidate, not yet a
production tool or registered operation. The audit can later revalidate an
exact five-artifact canonical binding and its single-use read-only
presentation, but it still cannot treat that local presentation as a
distributed Cloud Run GPU mount. See
`docs/living-frame/living-frame-controlled-sdxl-benchmark-admission-audit.md`.

### Subject-neutral benchmark request blueprint

The next source boundary projects the seven compatibility cases into a
content-free request blueprint. Each case declares only its ordered,
server-owned binding slots: the exact model roles, positive and negative
conditioning, and control/reference image fixtures where applicable. Every
slot remains unresolved and contains no value.

The blueprint independently revalidates the benchmark specification and
current admission audit, binds their exact lineage, and preserves the current
`not_registered` operation state. It does not repeat or mint a ComfyUI tool or
operation identity, emit executable node JSON, materialize prompt text or
image bytes, create work, dispatch a GPU, or generate cost evidence. A future
private materializer must consume the canonical operation registry, exact
artifact mounts, signed GPU image, server fixtures, and current node-schema
evidence before an executable request can exist.

The seven cases contain 41 ordered unresolved slots across six distinct slot
sets. They are derived solely from capability composition, never from a
person, place, vehicle, historical topic, or example. See
`docs/living-frame/living-frame-controlled-sdxl-benchmark-request-blueprint.md`.

### Subject-neutral benchmark graph blueprint

`living-frame-controlled-sdxl-benchmark-graph-blueprint-v1` converts the
seven request recipes into exact, non-executable ComfyUI graph topologies.
It independently revalidates the request blueprint, stock
`controlnet_lora_txt2img` expectation, reviewed generic IP-Adapter extension,
and merged graph before it emits any topology.

The load-only case has no graph. The six generation cases contain
7, 8, 10, 11, 15, and 15 nodes respectively, for 66 total nodes and 36
external slot references. Base, LoRA, ControlNet, generic IP-Adapter, and
full-combined cases are rewired independently so a disabled capability cannot
remain connected by accident. The combined primary and deterministic replay
use the same graph policy.

Only the closed node allowlist is represented. FaceID, InsightFace,
unified/embedding loaders, in-graph preprocessors, arbitrary preview/save
nodes, and AuraFace generation conditioning remain forbidden. Control and
reference images are unresolved server-owned slots, and the sole output is a
`SaveImageWebsocket` bridge node.

The graph blueprint still contains no prompt text, image pixels, model alias,
filename, path, URL, credential, executable API-format prompt, tool or
operation identity, dispatch, work, cost, asset, or selected-scene authority.
Private slot materialization, current runtime node-schema evidence, a
registered canonical ComfyUI operation, exact read-only model mounts, signed
GPU image, attempt/cost receipts, metrics, QA, and private review remain
required. See
`docs/living-frame/living-frame-controlled-sdxl-benchmark-graph-blueprint.md`.

### Server-private ComfyUI prompt materialization

`living-frame-controlled-sdxl-private-prompt-materialization-v1` converts one
current generation-case graph into exact ComfyUI API-format prompt JSON. The
caller provides only a server-owned locator; a process-bound reader supplies
the current graph recipe and its private model, conditioning, control-image,
and reference-image slots.

The compiler preserves the closed node allowlist, topological edges, frozen
literal parameters, exact slot set, and websocket-only output. It stores the
raw prompt only in a process-bound single-use lease. The serializable receipt
contains digests, byte lengths, node counts, slot classes, and lineage, never
prompt text, model or image aliases, paths, URLs, credentials, or bytes.

This closes the graph-to-private-request source gap without registering a tool
or operation or dispatching a GPU. One future consumed lease maps to one
shared ComfyUI GPU attempt; ControlNet Aux, ControlNet, IP-Adapter, and LoRA
loading remain capabilities inside that attempt, while AuraFace remains
separate post-generation CPU QA. Pricing and actual-cost evidence continue to
come only from the canonical estimate and worker-resource cost authorities.

Current GPU node schemas, a signed dependency-locked image, distributed
read-only mounts, canonical operation registration, released attempt/cost
receipts, metric attestation, license review, selected-scene lineage, work,
asset QA, and private review remain closed. See
`docs/living-frame/living-frame-controlled-sdxl-private-prompt-materialization.md`.

### Private ComfyUI GPU request and cost lineage

`living-frame-controlled-sdxl-gpu-runtime-protocol-v1` now binds one verified
prompt-materialization receipt and its single-use process lease to one
server-read current artifact packet. It requires exact materialization,
output-frame, artifact-set, slot, alias-digest, content-hash, byte-length, and
read-only-source lineage before it can compile a private ComfyUI worker
request.

The raw prompt and private aliases remain behind a second process-bound,
single-use request lease. The serialized receipt contains only hashes,
counts, stable record identities, closed worker expectations, and explicit
non-authority flags. It contains no prompt text, model or image aliases,
paths, URLs, credentials, commands, artifact bytes, price, credits,
service-fee amount, reservation, wallet, or ledger data.

The request makes the pricing unit explicit: one wire request represents one
future shared GPU-host attempt. ComfyUI, the externally prepared control
image/preprocessing capability, ControlNet, generic IP-Adapter, and loaded
PEFT/LoRA are capability attributions inside that attempt, not five
independently rounded GPU charges. The benchmark receives the preprocessing
output as a server-owned artifact rather than admitting a custom
preprocessor node. AuraFace continuity measurement stays outside the request
as an optional CPU QA attempt. Exact reuse adds no attempt; failed and
unknown attempt cost must remain attributable; customer credits round once
after bundle aggregation; and the canonical service fee applies once
downstream.

This does not register `comfyui`, register
`tool.comfyui.generate_controlled_image.v1`, dispatch a Cloud Run worker,
mint a GPU attempt or cost receipt, create an asset, or open production.
Canonical operation identity, signed image, distributed mounts, dispatch,
released attempt/completion and resource-cost evidence, estimate/settlement
reconciliation, license review, approved scene/snapshot/work lineage, QA, and
private review remain required. See
`docs/living-frame/living-frame-controlled-sdxl-gpu-runtime-protocol.md`.

### Private GPU output observation and opaque-source boundary

`living-frame-controlled-sdxl-gpu-output-observation-v1` adds the next
server-private boundary after the controlled ComfyUI request. A process-bound,
single-use reader returns the exact PNG associated with the verified request,
and a second process-bound consumer receives verified bytes out of band.
The serializable observation retains only request/output hashes, dimensions,
alpha measurements, cost lineage, and closed gates.

The fixed decoder accepts only a bounded 1024-by-1024, 8-bit,
non-interlaced RGB PNG. It validates chunk CRCs, critical-chunk policy,
bounded decompression, scanline filters, and exact decoded-byte accounting,
then reruns the existing alpha-measurement primitive. Every source pixel must
be opaque.

Opaque output is deliberately **not** promoted to a transparent component.
It must continue through qualified segmentation or matting, alpha-edge
decontamination, true-alpha artifact commit, multi-background and
destination-composite QA, continuity and documentary-safety QA, and the
existing canonical artifact authority. A source PNG with alpha is rejected
by this route, and an opaque checkerboard remains opaque content.

The observation preserves one-output/one-GPU-attempt lineage without minting
an amount. ComfyUI, external preprocessing, ControlNet, generic IP-Adapter,
and loaded PEFT/LoRA share that attempt; AuraFace remains separate optional
CPU QA. Actual cost still requires canonical worker-resource evidence.
Bundle aggregation, one-time credit rounding, the single downstream service
fee, approval, reservation, and settlement remain owned by the existing
commercial pipeline.

This contract does not prove dispatch, completion, actual cost, artifact
commit, transparency, QA approval, rendering, or production. See
`docs/living-frame/living-frame-controlled-sdxl-gpu-output-observation.md`.

### Opaque output to canonical rembg input

`living-frame-controlled-sdxl-rembg-input-binding-v1` adds a process-bound,
single-use handoff from the exact opaque GPU-output observation toward the
existing canonical rembg operation. It rereads the PNG and decoded RGBA bytes,
recomputes both hashes, enforces the fixed 1024-by-1024 shape, and confirms
that every source alpha byte is 255. Bytes remain out of serializable planning
state and are delivered only to a process-bound consumer.

The current canonical rembg admission is bound specifically to FFmpeg-extracted
source-video frames. A generated Living Frame still is not that source type.
The binding therefore records that a later shared-authority extension must add
a strict `living_frame_generated_opaque_still` branch alongside the unchanged
`canonical_source_frame` branch. It does not relabel the generated image,
create a rembg request, dispatch a worker, or commit a mask.

The intended continuation reuses the existing `rembg` L4 mask operation,
existing Sharp straight-alpha component composition, canonical asset
manifest, alpha/continuity/fact QA, and Remotion compositor. The ComfyUI GPU
generation attempt is not charged again; rembg remains one separate canonical
tool attempt whose amount is owned by the existing tool-cost authority.
Customer credits still aggregate and round once, and the service fee remains
single and downstream. See
`docs/living-frame/living-frame-controlled-sdxl-rembg-input-binding.md`.

### Generated-still rembg and true-alpha execution evidence

The namespaced
`living-frame-controlled-sdxl-rembg-gpu-runtime-v1` now binds a verified
opaque generated-still input to an already consumed canonical `rembg`
dispatch, the fixed CUDA/L4 `u2netp` runtime contract, an exact process-bound
model-mount observation, and a strict 1024x1024 gray8 mask verifier. It
preserves failed and outcome-unknown attempt cost lineage and cannot charge
the shared ComfyUI generation attempt again.

The subsequent
`living-frame-controlled-sdxl-rembg-alpha-bridge-v1` consumes the verified
source and mask through single-use leases, consumes the matching canonical
Sharp dispatch, executes the existing confined Sharp `0.35.3`
`approved_living_frame_alpha_component_v1` recipe, and measures the resulting
straight-alpha raster with the existing Living Frame alpha-measurement
primitive.

This is real private package-execution evidence, but not production
promotion. The shared canonical rembg and Sharp services still need an
explicit generated-still dependency/source variant, followed by artifact
commit, asset-manifest reconciliation, alpha QA, continuity/fact QA, private
review, and Remotion consumption. No source frame is relabeled, no tool ID is
added, and no second cost or credit authority is created. See
`docs/living-frame/living-frame-controlled-sdxl-rembg-gpu-runtime.md`.

### Controlled benchmark result and threshold binding

The source-only result binding accepts benchmark observations only through a
process-bound server reader. It reads the observation twice, rejects
instability, validates all seven ordered case observations and eleven ordered
metric observations, cross-checks load/output/memory/duration aggregates, and
evaluates the fixed specification thresholds.

Passing controlled thresholds remains deliberately weaker than a released GPU
attempt or compatibility approval. The binding cannot attest an operation,
mint actual cost, resolve the LoRA/base mismatch, select a scene, or open
runtime. Its passing and failing fixtures are controlled and non-promotable.
See
`docs/living-frame/living-frame-controlled-sdxl-benchmark-result-binding.md`.

### Controlled-illustration estimate-to-work admission

The canonical customer estimate now has an exact, content-addressed bridge to
the one existing edit work graph for Living Frame generated stills. The
bridge binds every generated opaque-still asset-intent ID to one shared
controlled-illustration GPU cost line and one named
`generate_image_asset` batch work item. If identity-continuity measurement is
required, its separate AuraFace CPU cost line binds to one dependent
`run_asset_qa` item.

The five controlled-generation capabilities—ComfyUI execution, externally
prepared control preprocessing, ControlNet, generic IP-Adapter, and loaded
PEFT/LoRA—remain attribution inside one GPU attempt. They do not become five
charges or five new ProductionToolIds. AuraFace remains a sixth, optional
post-generation CPU measurement. Exact reuse adds no generation attempt.
Internal micro-cost is aggregated before customer-credit rounding, and the
single downstream ReeditPro service fee remains unchanged.

Generated anchors now resolve as pending outputs of named work rather than as
untracked provider artifacts. The work graph keeps generation and AuraFace
items operation-pending: approved operation IDs, provider routes, executable
payloads, runtime leases, dispatch, and production authority are all absent.
Downstream mask, RGBA, and Remotion work remains dependency-bound and blocked
until the generated source operation and generated-source rembg variant are
qualified. This preserves one timing authority, one estimate and approval
path, one immutable snapshot lineage, one work graph, and one asset manifest.
