# Living Frame Release Completion Audit

Status date: 2026-07-30

Feature branch:
`codex/living-frame-gpu-operation-preflight-v1`

Latest frozen feature state:
tracked by the clean branch head and exact backend handoff hash

Overall status:
`private_internal_e2e_in_progress_customer_release_deferred`

This audit measures the current repository against the complete Living Frame
product direction. It does not redefine success around the latest renderer
slice and it does not treat a passing private fixture as production release.

## Product interpretation lock

Living Frame is the composite storytelling skill. It is not:

- a universal 2.5D filter;
- a Ken Burns preset;
- a transparent sticker system;
- a single image generator;
- an AI-video synonym; or
- a second editing pipeline.

The parent capability decides why a scene should become a Living Frame and
assembles the minimum coherent mini-skill set. Its five modes remain:

- `living_a_roll`;
- `living_still`;
- `living_archive`;
- `living_diagram`; and
- `hybrid_expansion`.

Flat, shallow 2.5D, and deep multiplane treatments are scene decisions.
Illustration style remains a versioned continuity/style decision. A character
scene may be cinematic anime, ink, graphic novel, archival, photographic, or
another approved language without changing Living Frame's parent contract.

Named design examples are regression fixtures only. No named person, vehicle,
location, war, genre, or topic may change routing, cost, timing, or release
authority.

## Status vocabulary

- `verified_source_contract`: typed, validated, and regression-covered source
  behavior exists.
- `verified_private_runtime`: an isolated, private execution path produced and
  verified real bytes.
- `qualified_local_candidate`: a pinned local package or artifact session ran,
  but no distributed or production operation is released.
- `external_release_open`: source work exists, but backend, infrastructure,
  legal, security, model, dispatch, or production evidence is still missing.
- `not_required_as_separate_owner`: the capability correctly reuses another
  canonical ReeditPro authority.

## Requirement-by-requirement audit

| Requirement | Current status | Authoritative evidence | Remaining work |
| --- | --- | --- | --- |
| Composite parent skill and deliberate non-use | `verified_source_contract` | `src/lib/professional-skills/professional-skill-registry.ts`, `src/lib/living-frame/living-frame-selection-policy.ts`, `src/types/living-frame.ts` | Backend must preserve the selected/non-use decision when integrating the frozen component. |
| Five Living Frame modes | `verified_private_runtime` | `src/types/living-frame.ts`, subject-neutral capability matrix, and `server/smoke/living-frame-five-mode-private-render-smoke.ts` | One real 240-frame private render now proves all five modes, low-risk subject/contact-object occlusion, safe-space and static-card fallbacks, plus deliberate non-use. Real-project fixture breadth remains internal-test work. |
| Reusable mini-skill family | `verified_source_contract` | `src/types/living-frame.ts`, `src/lib/living-frame/living-frame-contract.ts`, `server/living-frame/living-frame-semantic-plan-projection.ts` | No new skill taxonomy is needed. |
| Narrative and animation-aware illustration | `verified_source_contract` | mini-skill identities, component asset intent, synthesis routing, work admission, controlled-illustration qualification, and the selected-scene private conditioning binding | The private conditioning source now derives exact style, scene, component, separability, depth, frame, and truth instructions from the validated Visual Continuity Pack and proves their digest equality at the real selected-scene prompt materializer. Production generation remains gated by the controlled ComfyUI operation or another approved route. |
| Visual Continuity Pack | `verified_source_contract` | `src/lib/living-frame/living-frame-visual-continuity-contract.ts`, `docs/living-frame/visual-continuity-pack.md`, selected-scene read-only pack binding candidate, continuity measurement, and fixtures | Production persistence, reference retention, consent, fairness, and identity-review policy remain backend/release gates. The namespaced candidate now revalidates the complete pack payload against the exact selected scene and emits a digest-only binding, but the canonical selected-scene interface or immutable private pack-artifact bridge and any persisted reference-artifact binding remain canonical-owner gates. |
| Character/object/environment/style consistency | `verified_source_contract` | continuity pack sheets, controlled generic IP-Adapter binding, optional AuraFace measurement-only path | Real project-calibrated continuity thresholds and review evidence remain open. |
| Component decomposition and rigging | `verified_source_contract` | component asset intent, geometry, rig, background-plate reconstruction, artifact reconciliation | Rich production scene benchmarks remain open; no claim is made that all stills can be safely decomposed. |
| Alpha, masks, edge cleanup, and destination composite | `verified_private_runtime` for still alpha and bounded known-cutout occlusion; `shared_interface_conflict` for temporal masks | generated-still alpha work graph, rembg route, Sharp RGBA route, selected-scene private opaque-output observation, exact-output alpha-source handoff, selected-scene full-frame evidence readiness, alpha measurement, edge decontamination, multi-background/destination-composite evidence, five-mode low-risk A-roll cutout fixture, and `server/smoke/living-frame-temporal-mask-canonical-work-graph-conflict-smoke.ts` | The namespaced handoff now proves and privately leases the exact isolated output index/asset-intent from a multi-output selected generation item. The canonical work-graph owner must consume that selector when admitting the existing rembg → Sharp work items; this branch does not mutate the shared graph. Full-frame plates bind to existing artifact, continuity, fact-safety, manifest, review, and Remotion owners without entering alpha. The real 240-frame private render proves source → explanatory graphic → known subject-plus-contact RGBA cutout → captions and independently measures both foreground occlusion regions. A new read-only selected Hormuz probe proves that `temporal_subject_mask_sequence` collapses into the undifferentiated `generate_mask_asset` input and is then assigned to `rembg` with one PNG output instead of `tool.sam2.segment_and_track_subject.v1` with a temporal mask-sequence/analysis/QA output set. Advanced temporal A-roll therefore cannot reach an executable SAM2 work item until the canonical work-input and work-graph owner adds an asset-kind/operation discriminator. |
| Semantic scale | `verified_source_contract` | Living Frame semantic-scale requests and canonical motion guard preserving literal/data scale | Production QA must continue distinguishing literal, proportional, perspective, and symbolic scale. |
| Attention, focus handoff, camera, and visual orbit | `verified_private_runtime` for the bounded scalar subset | choreography binding, canonical motion spec, actual 640×360 render | More complex deformation, path, particle, and true 3D primitives remain separately gated. |
| Adaptive flat / shallow-2.5D / deep-multiplane rendering | `verified_source_contract` for approved-depth preservation and fail-closed reconciliation; `verified_private_runtime` for shallow and deep execution | selected-scene private conditioning, read-only selected-scene motion-style reconciliation, `canonical-living-frame-motion-spec-v1`, offline Remotion composition, same-scene differential-parallax pixel validation | The canonical motion owner must consume the exact approved scene-design depth instead of independently inferring a conflicting style. Dimensional motion/renderer support or a newly approved downgrade remains required. Mode-specific production-footage benchmarks remain release work. |
| Selective deterministic motion | `verified_private_runtime` for the bounded scalar renderer, namespaced real PixiJS environmental-particle runtime, exact selected-scene full-range PixiJS execution, bounded PixiJS-to-Remotion composite, exact 105-frame selected-scene Remotion review, canonical create-only private artifact persistence, and persisted procedural scene QA; `verified_source_contract` for role/activation divergence detection, environmental-particle admission, the subject-neutral particle kernel, closed request materialization, and controlled observer | canonical motion compiler, independent sample-digest verification, Remotion sampler, actual pixel-displacement measurement, selected-scene selective-motion reconciliation, selected-scene environmental-particle admission, environmental-particle kernel, operation materialization, controlled sequence observation, real private internal PixiJS runtime, selected-scene full-range internal test, private single-use sequence/final-output/persisted-artifact leases, existing Remotion streaming runtime, canonical private Remotion artifact storage, private media runtime | The current canonical compiler broadcasts a scene-level `rotate` verb to every component. The read-only reconciliation proves that static anchors, stable subjects, and environmental effects receive mechanical rotation even when only explicitly activated mechanical components should rotate. The environmental admission binds the exact selected component, MasterTiming phases, confirmed frame, procedural geometry, existing PixiJS identity, and required particle primitive. The adjacent kernel provides seven typed subject-neutral profiles plus deterministic, style-bound, motion-density-capped, one-shot particle state tracks. A process-bound materializer converts only a verified kernel into one closed, single-use private PixiJS request with exact canvas/frame lineage and a transparent frame-sequence policy. The controlled fixture verifies the strict byte observer. The namespaced internal runtime executes the real `pixi.js@8.19.0` `Application.init` entrypoint and host-remeasures eight actual 3840×2160 RGBA PNGs with transparent endpoints, six active frames, seven distinct digests, and alpha-centroid movement inside a non-root, read-only, zero-network container. The selected-scene wrapper revalidates the actual `helicopter.downwash` component, canonical frame/timing/geometry/selective-motion lineage, and Visual Continuity Pack, then executes all 105 exact 1920×1080 frames from frame 30 through exclusive frame 135 in one real PixiJS attempt. Its explicit namespaced profile binding avoids component/subject inference and has no canonical selection authority. The full-timeline adapter consumes that lease once, executes seven bounded real `remotion@4.0.487` chunks, packages 105 already composited frames, and independently verifies exact duration, visible motion, source-plate preservation, caption priority, and review-scale perceptual fade behavior. A separate single-use final-output lease is consumed through `persistCanonicalPrivateRemotionArtifactStream`; create-only storage and exact digest/length readback are verified without exposing bytes or paths. A persisted-artifact lease then re-opens that exact MP4 through the existing private media runtime and proves H.264, 640×360, 30 FPS, 105 frames, procedural-alpha behavior, destination composition, caption priority, and timing lineage. The generic scene-evidence v1 contract still has only a primitive expectation and no actual procedural-QA discharge; the namespaced QA report records this exact shared-interface conflict without mutating the shared owner. Remaining internal integration is private-review evidence plus canonical manifest/procedural-discharge reconciliation. Customer billing and production release are later gates, not prerequisites for internal scene testing. |
| Sound choreography | `verified_source_contract` for one-to-one semantic trigger coverage and fail-closed phase reconciliation; `verified_private_runtime` for one exact narration-protected mechanical cue; `not_required_as_separate_owner` for exact sound | semantic sound requests, choreography binding v2, canonical timing binding, semantic sound timing reconciliation v1, and `server/smoke/living-frame-five-mode-private-render-smoke.ts` | Every request binds to one attention event and component-linked motion. The reconciliation independently recompiles canonical timing and proves both a phase-compatible handoff and a real order-spacing divergence where a `hold` trigger that belongs in `demonstrate` lands in `activate`. The five-mode private render now streams a 48 kHz stereo PCM SFX through the existing supplemental-audio owner on the exact Living Still range; decoded frequency measurements prove that it is absent before the cue, present during the rotor motion, and subordinate to the preserved source narration-proxy tone. This closes one bounded runtime fixture, not project-wide professional sound admission: canonical v1 still lacks the trigger identity, motion lineage, exact hit, asset, and mix needed for arbitrary selected scenes. SoundSync remains the sole exact cue/mix/ducking owner. |
| StoryTiming ownership | `verified_source_contract` | canonical Living Frame timing binding and five exact semantic phases | No Living Frame clock may be introduced. |
| Caption coordination | `verified_private_runtime` for z-order | canonical render path and cyan/magenta pixel fixture | Caption Direction remains a separate parent system; spatial/attention negotiation continues through shared occupancy and timing. |
| Maps, charts, diagrams, and exact labels | `not_required_as_separate_owner` | Living Frame modes route exact components through existing map/dataviz/Remotion owners | Do not replace exact content with generated images. |
| Canonical selected-scene lineage | `verified_source_contract` | selected-scene admission, publication, approved-lineage binding | Backend integration must reread the current immutable snapshot. |
| Estimate, credits, and actual-cost semantics | `verified_source_contract` | estimate basis, canonical estimate/work/asset projection, cost/work binding, actual-cost attribution, settlement contribution | No customer charge or wallet mutation is authorized by Living Frame. |
| Approval and immutable snapshot | `verified_source_contract`; `not_required_as_separate_owner` | existing canonical approval/snapshot authorities and Living Frame bindings | Backend remains sole approval and reservation authority. |
| Async work graph and asset manifest | `verified_source_contract` | canonical work-graph projection v10, generated source → mask → RGBA → layer manifest → final composition lineage | Released distributed dispatch is still open. |
| Asset QA and private review | `verified_private_runtime` for the representative static-RGBA trace and the namespaced selected procedural-particle trace | generated-still QA projection, destination composite evidence, canonical static-RGBA private-review evidence, persisted selected-particle scene QA, process-private selected-particle review evidence | Actual ComfyUI output must pass the same gates after L4 release. The canonical review compiler also needs an approved procedural-timeline artifact contract before it can consume the selected particle trace generically; the namespaced proof records the conflict without replacing the canonical owner. |
| Remotion final composition | `verified_private_runtime` | actual 640×360 scalar-motion render, actual five-mode 240-frame private render, actual confirmed-ratio 360×640 and 480×600 renders, selected-scene particle renders, and actual 3840×2160 H.264/AAC streaming render | Public delivery and production promotion remain intentionally deferred; they do not block internal E2E testing. |
| Documentary/factual integrity | `verified_source_contract` | source-truth mode, provenance, documentary fact-safety dependencies, selected-scene private documentary fact-safety binding, full-frame continuity/fact reconciliation | Generated illustration must never be presented as authentic evidence. The new process-private binding revalidates an immutable approved fact-safety packet, exact scene expectation/claim mapping, and source-truth disposition, then adds generic status-derived constraints to the real selected-scene prompt without copying raw claims or claiming fact verification. The canonical snapshot reader and scene-to-claim join remain explicit shared-owner bridges. |
| Subject-neutral behavior | `verified_source_contract` | capability matrix and serialized-evidence name scans | Named examples remain fixtures only. |
| Backend workflow coordination | `handoff_delivered` | material frozen commits are handed to canonical backend task `019f4c76-4ec8-75f3-9cc6-39399dbee47d`; the exact clean head is recorded in each handoff | Backend task must reconcile without changing canonical ownership. |

## Six controlled-illustration capabilities

The six product-design candidates are not six production tools.

| Capability | Intended placement | Current evidence | Release status |
| --- | --- | --- | --- |
| ComfyUI | One shared NVIDIA L4 controlled-image host | Pinned source, locked wheel closure, strict protocol, canonical five-model mount session, digest-bound non-root runtime-confinement requirement, operation-scoped `sam2` import guard, local installed-layout observation, exact 761-package SPDX inventory, and 1,582-file static source-corpus scan | `qualified_local_candidate`; image defaults to root/unspecified, inherited direct-VCS `sam-2` remains present despite the proven local guard, and explicit disposition plus actual released-platform confinement/guard observation and canonical image/L4 release stay open |
| `comfyui_controlnet_aux` | External deterministic pose/depth/canny preparation | Pinned custom-node/source expectation plus deterministic ReeditPro control-image implementations | `verified_source_contract`; production package/license admission open |
| ControlNet | Mounted conditioning model inside the shared host | Exact artifact identity, byte observation, workflow binding, model-family binding | `qualified_local_candidate`; L4 compatibility run open |
| Generic IP-Adapter | Mounted reference-conditioning model inside the shared host | Exact artifact identity, byte observation, generic-only extension and merged workflow | `qualified_local_candidate`; FaceID remains forbidden |
| PEFT/LoRA | Mounted adapter loaded inside the shared host | Exact artifact identity, safetensors inspection, byte/behavior observations, workflow binding | `qualified_local_candidate`; loaded adapter/base/training rights still require approval |
| AuraFace | Separate CPU post-generation continuity measurement, never generation conditioning | Exact two-model expectation, pinned CPU image, atomic mount/host session, real network-isolated local inference, post-consumer mutation rejection | `qualified_local_candidate`; distributed mount, policy calibration, fairness/privacy/release gates open |

Cost ownership is also frozen:

- the first five capabilities are one shared ComfyUI GPU attempt and are not
  charged five times;
- optional AuraFace is one separately attributable CPU QA attempt;
- attempt costs aggregate before customer-credit conversion;
- the ReeditPro service fee is applied once by the existing commercial
  authority; and
- planned usage is never relabeled as an actual-cost receipt.

## Canonical motion runtime evidence

Commit `2b19519b` adds:

- work-graph projection v10;
- Remotion layer input v2;
- the closed `canonical-living-frame-motion-spec-v1`;
- layer, virtual-camera, and source-plane scalar tracks;
- adaptive flat, shallow-2.5D, and deep-multiplane decisions;
- independent per-track sample-digest recomputation;
- manifest/final/private-review motion lineage;
- actual source/camera/focus/depth execution; and
- source → Living Frame → caption z-order.

The real 640×360 fixture verifies shallow motion by measuring the component's
rendered pixel centroid at separated frames. It also renders separate far and
near RGBA planes in one deep-multiplane scene and proves differential parallax:
the background plane moves about 41 pixels while the foreground plane moves
about 93 pixels under the same virtual-camera track. The 4K fixture verifies
committed server-injected source, Living Frame RGBA, caption, and audio inputs
through the private streaming renderer, H.264/AAC output, complete BT.709
metadata, content-addressed persistence, and independent FFprobe.

These are private runtime proofs, not public or production authorization.

## Current closed release gates

The full objective is not yet production-complete because these proofs are
missing:

1. Canonical production registry admission for the single ComfyUI host tool
   and its bounded controlled-image operation. The exact non-executable
   admission candidate now freezes one tool identity, one operation, the
   supervised-entrypoint gap, the no-fanout cost policy, and the semantic
   registry-expansion policy. The current tool count is an observation, not a
   product cap; the future count is derived from genuinely distinct executable
   identities that independently pass release. The server-derived
   selected-scene request projection binds approved
   scene/component/continuity/frame/work lineage. Its full-frame ratio
   extension now derives exact confirmed `9:16`, `16:9`, and custom
   source/background qualification units without square substitution, while
   isolated components remain separately bounded. The selected-scene private
   prompt materializer now compiles the real selected-scene graph family and
   emits one process-bound single-use private request lease per exact approved
   generated output. The selected-scene private output observer rereads and
   verifies exact opaque RGB PNG bytes for both isolated and confirmed-ratio
   canvases without inferring worker completion, persistence, cost, QA, or
   review. The full-frame evidence-readiness projection now binds the exact
   confirmed-ratio output to the existing canonical private-image persistence,
   artifact-QA, continuity, documentary-fact, scene-evidence, asset-manifest,
   private-review, and Remotion owners without executing any of them. It
   rejects isolated-output, square-substitution, cross-output, and final-canvas
   claims. Its continuity/fact reconciliation prevents an overbroad assumption
   that every Visual Continuity Pack requires a raster reference: the current
   unconditioned background plate requires semantic style QA, while a persisted
   reference plus exact alignment registration is required only before the
   aligned-same-view measurement can become eligible. It also records that the
   selected-scene interface lacks the validated pack payload, canonical
   reference-artifact registration, semantic style-QA owner binding, and
   approved documentary fact-safety snapshot needed for later evidence. A
   process-private reference alias is never promoted into evidence. The
   selected-scene private conditioning binding now removes the generic-text
   gap before prompt materialization. It revalidates the exact selected
   semantic scene and component, complete Visual Continuity Pack payload,
   scene design sheet, animation separability, source truth, work/output
   lineage, and confirmed frame; emits only digest/length receipts plus
   process-bound single-use leases; and merges those private briefs into an
   alias-only packet with fixed pending sentinels. Its integration smoke proves
   exact conditioning-digest equality at the existing selected-scene prompt
   materializer for isolated 1024-square character/weapon sources and an exact
   3840x2160 deep-multiplane background plate. Its adaptive style grammar now
   emits distinct flat-layer, shallow-2.5D, deep-multiplane, and dimensional
   preparation classes plus treatment-specific photographic, archival,
   editorial, vector, collage, technical, cinematic, anime, ink, and
   graphic-novel direction. A four-profile private-brief matrix proves that
   flat stays flat and dimensional is not mislabeled as 2.5D. It does not
   promote controlled reference expectations to artifacts, accept caller
   prompts, or claim final-canvas authority. The read-only alpha
   work-chain reconciliation now proves that the
   isolated output cannot yet enter the existing canonical rembg → Sharp
   branch: the work graph currently rejects an exact generated source when its
   parent generation item has multiple expected outputs, and the selected
   fixture does not yet project the mask/Sharp named work. This is frozen as a
   canonical-owner conflict rather than bypassed with a parallel mask job. A
   new exact-output alpha-source handoff now revalidates the selected request,
   observation, conflict receipt, and work graph; proves one unique parent
   output index and generated asset-intent; rereads the exact opaque PNG/RGBA
   bytes; and emits one byte-free receipt plus one process-bound single-use
   private source lease. It still creates no rembg/Sharp work, artifact, or
   authority. The path is not the benchmark prompt path, does not dispatch,
   and preserves the confirmed frame, five-model atomic mount, confinement,
   `sam2` denial, and Remotion ownership boundaries. The backend registry owner
   must still implement canonical admission and bind the projection to each
   approved work item. A pre-existing canonical Living Frame estimate
   projection still enforces the observed count as a temporary runtime guard;
   the backend one-writer must reconcile that shared interface before registry
   expansion.
2. A signed, reviewed L4 worker image containing the exact pinned source,
   dependency closure, and approved custom nodes. The local candidate now has
   a bounded 761-package SPDX inventory, but its default user is
   root/unspecified, one inherited direct-VCS distribution remains
   undisposed, and independent SBOM validation, inherited-scope review,
   vulnerability disposition, image signature, and provenance remain open.
   The mounted-runner source contract now requires exact UID/GID `65532:65532`
   plus the complete sandbox and rejects root observations; only a released
   backend/L4 observation can satisfy that requirement.
3. Released distributed read-only model-artifact mounts for the exact five
   ComfyUI objects and exact two AuraFace objects.
4. A successful approved-L4 run of the exact five-model ComfyUI workflow,
   including image signature, latency, peak memory, deterministic request
   binding, and after-consumer artifact verification.
5. Released backend lease, dispatch, timeout, retry, checkback, idempotency,
   cancellation, and private artifact persistence.
6. Actual attempt-cost evidence from the released worker resource meter,
   followed by existing settlement-authority reconciliation.
7. Asset QA, continuity QA where requested, destination-composite QA, private
   review, and fallback evidence for a real controlled-illustration output.
8. License/commercial-use, dependency/SBOM, model-weight, training-data,
   consent, privacy, fairness, minor, public-figure, impersonation, and
   documentary-safety approvals appropriate to the operation.
9. Production security, retention, observability, rollback, and incident
   evidence.
10. Backend owner reconciliation of the frozen Living Frame contracts with no
    parallel planner, timing, SoundSync, work graph, asset manifest, approval,
    billing, renderer, or review lane.

No cloud resource, provider call, secret, database migration, customer charge,
public export, or production promotion should be used merely to make this
audit appear green.

## Verification executed for the frozen slice

Passed:

- full ESLint;
- frontend TypeScript build and Vite build;
- server TypeScript check;
- focused Living Frame contract, motion, choreography, geometry, renderer,
  capability-matrix, work-graph, cost, QA, and private-review smokes;
- actual 640×360 Living Frame Remotion shallow and deep-multiplane render with
  pixel-measured differential parallax;
- actual 3840×2160 streaming Remotion render and independent FFprobe;
- exact local ComfyUI image-derived SPDX package-inventory smoke, including
  repeated immutable-image observation, locked-wheel reconciliation,
  single-use document delivery, direct-VCS reachability and static-source
  measurement, refusal to claim runtime non-use, and forged release-policy
  rejection;
- atomic ComfyUI model-mount smoke with digest-bound runtime-confinement input,
  exact non-root observation, and adversarial root-observation refusal;
- fixed ComfyUI process/offline-package smokes with an exact non-empty denied
  import set, relaxed-policy refusal, and a live network-off container probe
  proving `sam2` is blocked while standard-library imports remain available;
- selected-scene private prompt materialization with one unit/lease per
  approved output, exact isolated and confirmed-ratio canvases, byte-free
  receipts, and adversarial benchmark/caller/node/lineage/authority refusal;
- selected-scene private animation-aware conditioning with exact semantic,
  component, Visual Continuity Pack, scene-design, depth, source-truth,
  output-frame, work/output, and planned-asset lineage; process-bound
  single-use private delivery; byte-free receipts; exact digest equality at
  the real selected-scene prompt materializer; isolated 1024-square and exact
  3840x2160 full-frame coverage; and adversarial caller/cross-pack/cross-frame/
  cross-work/reference-promotion/lease refusal;
- adaptive selected-scene private conditioning across flat editorial cutout,
  shallow-2.5D paper collage, deep-multiplane cinematic anime, and dimensional
  graphic-novel profiles, with exact motion-class metrics, treatment-specific
  source grammar, and regression refusal of the former universal-2.5D phrase;
- read-only selected-scene motion-style reconciliation that independently
  recompiles canonical motion observations, accepts only exact supported
  approved-depth matches, fail-closes on flat/shallow divergence, blocks
  dimensional scenes under the current motion/renderer contract, and never
  mutates either the approved style or canonical motion;
- read-only selected-scene selective-motion reconciliation that independently
  recompiles every component motion spec, proves a scene-level `rotate` verb
  currently creates five rotation tracks where only the two explicitly
  activated mechanical components qualify, blocks static-anchor, stable-body,
  and environmental mechanical rotation, preserves component-rig pivot
  ownership, and records the still-open environmental primitive/fallback
  requirement without mutating canonical motion;
- subject-neutral environmental-particle kernel coverage for seven typed
  effect families, Visual Continuity Pack style/depth/palette binding,
  deterministic one-shot state sampling, motion-density caps, exact
  confirmed-frame preservation, zero-opacity endpoints, changed-seed
  divergence, and adversarial profile/input/geometry/cross-pack/digest/
  authority refusal while selected-scene, timing, PixiJS, Remotion, work,
  asset, cost, QA, review, and production authority remain false;
- closed environmental-particle PixiJS request materialization from a verified
  kernel, with exact 3840×2160/44-frame transparent output intent, fixed
  `pixi.js@8.19.0` entrypoint, one process-bound single-use lease, byte-free
  receipt, seven-profile compatibility, unchanged current PixiJS operation,
  and adversarial caller-operation/dimension/kernel/authority/square/final-
  canvas/lease refusal while registration, dispatch, runtime, artifact,
  cost, billing, and production remain false;
- controlled environmental-particle private sequence observation with exact
  eight-frame 3840×2160 RGBA PNG byte decoding, CRC/inflate/digest checks,
  per-frame alpha measurement, fully transparent endpoints, temporal
  variation, alpha-centroid movement, and byte-free receipts; the fixture is
  explicitly non-promotable and keeps PixiJS entrypoint/runtime, artifact,
  canonical QA, review, cost, billing, and production evidence false;
- Living Frame choreography v2 with complete one-to-one semantic sound
  triggers, exact component-motion matching for motion-dependent
  component-linked requests, an explicit environmental-presence exception
  that does not force artificial motion, strict narration protection, and
  adversarial missing/duplicate/unrelated trigger refusal while exact
  SoundSync frames and mix remain unclaimed;
- read-only semantic sound timing reconciliation that independently
  recompiles the canonical execution requirements and timing binding,
  preserves exact request/cue metadata, observes one phase-compatible
  `handoff` → `activate` candidate, proves one real order-spacing divergence
  where `hold` → `demonstrate` is incorrectly placed in `activate`, and keeps
  every cue blocked from professional sound admission until canonical
  attention identity, motion lineage, exact hit/envelope, asset, mix, QA, and
  private-review evidence exist;
- selected-scene documentary fact-safety binding across a stylized historical
  illustration and an exact-geography background plate, with immutable
  snapshot/scene/claim lineage, raw-claim-free private constraints, real
  animation-aware prompt integration, single-use leases, and adversarial
  snapshot/scene/source-truth/expectation/claim/source/authority refusal while
  fact verification, exact map/data, approval, QA, review, and final canvas
  remain with their canonical owners;
- selected-scene private opaque-output observation for exact 1024×1024
  isolated and 1920×1080 confirmed-ratio RGB PNGs, plus read-only alpha-chain
  reconciliation that fail-closes on the shared multi-output generation →
  rembg interface conflict without mutating the canonical work graph, plus an
  exact-output alpha-source handoff that binds the unique parent output
  index/asset-intent and delivers verified opaque bytes through a
  process-bound single-use private lease without creating rembg or Sharp work,
  and
  full-frame evidence readiness that binds the confirmed-ratio plate to the
  existing artifact/QA/continuity/fact/manifest/review/Remotion owners, plus
  continuity/fact reconciliation that separates semantic style QA from
  reference-conditioned aligned measurement and preserves the missing
  canonical evidence bridges;
- selected Hormuz Living A-Roll temporal-mask work-graph conflict coverage,
  proving that the exact `temporal_subject_mask_sequence` intent currently
  collapses into generic `generate_mask_asset`, is costed and compiled as the
  existing `rembg` still-PNG operation, contains no SAM2 operation or temporal
  mask-sequence output, and keeps dispatch/runtime/production authority false;
- selected execution/security smokes;
- repository secret scan;
- frontend/server boundary scan; and
- Git whitespace/diff validation.

The source commit remains unpushed. External backend reconciliation proceeds
through the canonical backend task, not through direct cross-worktree copying.

## Completion decision

Current decision:
`keep_goal_active`

The source architecture, six-capability placement, representative private
alpha/component/render path, adaptive deterministic motion, cost semantics,
and backend handoff are materially implemented and verified. The requested
end state still includes released backend/GPU operation evidence. Until the
closed gates above are satisfied, Living Frame must not be described as
production-complete.
