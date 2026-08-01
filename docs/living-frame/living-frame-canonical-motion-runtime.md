# Living Frame Canonical Motion Runtime

## Status

Private/internal deterministic Remotion execution is connected and
subject-neutral. Public delivery, external beta, production runtime, provider
generation, customer charging, and deployment remain unauthorized.

## Why this boundary exists

Living Frame is not a static transparent overlay and it is not a universal
2.5D filter. Its selected components must perform an approved visual idea with
exact timing, coordinated attention, adaptive depth, and deterministic
rendering.

The canonical bridge is:

```text
selected Living Frame scene
→ exact five-phase MasterTiming binding
→ terminal approved component lineage
→ canonical-living-frame-motion-spec-v3
→ existing prepare_remotion_layer work item
→ tool-free layer-manifest artifact
→ existing final Remotion overlay binding
→ private streaming Remotion runtime
→ canonical private-review evidence
```

No alternate planner, clock, work graph, asset manifest, approval flow,
renderer, review system, or billing lane is created.

## Adaptive depth

The server derives one of three depth styles:

- `flat` for intentionally graphic or single-plane treatments;
- `shallow_2_5d` for controlled foreground/background separation,
  camera choreography, or object-orbit expectations;
- `deep_multiplane` for approved archive, hybrid, or hero scenes with at least
  three meaningful depth planes.

2.5D is therefore a scene decision. Character illustration, maps, diagrams,
archive scenes, objects, and A-roll integrations do not all receive the same
depth treatment.

The current compiler derives this value from canonical component and motion
signals. The approved Visual Continuity Pack can also direct `dimensional`,
which the current canonical motion and renderer contracts do not support.
The namespaced read-only selected-scene motion-style reconciliation therefore
compares the exact approved scene depth with the independently recompiled
canonical motion observation before a future canonical owner admits motion.
Supported depths must match exactly. Divergence fails closed, and dimensional
scenes remain blocked until a dimensional runtime exists or a new plan version
explicitly approves a downgrade. The reconciler cannot mutate either source.
See
`docs/living-frame/living-frame-selected-scene-motion-style-reconciliation.md`.

## Closed motion language

Targets:

- `layer`
- `virtual_camera`
- `source`

Renderable scalar properties:

- normalized X/Y position;
- rotation;
- uniform scale;
- opacity;
- blur;
- light intensity; and
- shadow opacity.

Allowed target/property combinations are closed. Virtual camera tracks may
control position and scale. Source tracks may control position, scale,
opacity, blur, and light. Layer tracks may use the complete renderable set.
Only one track may control a given target/property pair in one motion spec.

Every track contains bounded scalar keyframes, a closed easing identifier, a
compiled sample count, and a compiled-sample digest. The complete spec contains
its selected-scene digest, timing-binding digest, deterministic-motion-bundle
digest, scene/component identities, exact visual range, depth style, depth
band, parallax factor, semantic references, metrics, and a content digest.

The payload contains no executable renderer code, CSS, command, path, URL,
credential, provider route, arbitrary property, or free-form instruction.

## Segment phases versus visual lifetime

MasterTiming retains two related ranges with different responsibilities:

- the ordered `prepare → activate → demonstrate → resolve → settle` phases
  exactly and contiguously partition the complete segment range; and
- the Living Frame layer exists only for the shorter visual range spanning
  `activate → demonstrate → resolve`.

The v3 motion spec does not collapse those authorities into one range. It
requires `prepare.end` to equal visual start, `activate` to equal the reveal
interval, `demonstrate` to equal the hold interval, `resolve` to equal the exit
interval, and `settle.start` to equal visual end.

Six strictly increasing keyframes are then derived only from the visual
interval: visual start, reveal midpoint, reveal end, exit start, exit midpoint,
and the final included visual frame. The canonical 30 FPS integration fixture
therefore keeps the full segment at `0..150`, the visual layer at `12..72`,
and emits absolute keyframes `[12, 16, 20, 64, 68, 71]`. Remotion never expands
the layer into the prepare or settle padding.

## Component-selective derivation

The v3 compiler does not broadcast a scene verb to every layer. It combines
the selected component's role, focal role, linked active mini skills, Semantic
Scale guard, and visual verb:

- source A-roll, background plates, static anchors, masks/occluders,
  atmosphere, contact shadows, and environmental-effect holders do not receive
  generic layer transforms;
- Focus Handoff source blur is emitted only by the source A-roll component;
- virtual-camera tracks are emitted once from the focal-primary component;
- literal map/data scale remains fixed;
- position and scale require a matching linked motion activation; and
- rotation requires the exact eligible role and activation, never only a scene
  verb.

Environmental particles remain a separate typed primitive/fallback path.
Mechanical rigging is owner-paused and cannot be admitted from the generic
scalar compiler.

## Rendering behavior

The isolated Remotion composition samples keyframes on the current frame with
the same closed easing formulas as the server compiler.

It applies:

- layer translation, rotation, scale, opacity, blur, light, and shadow;
- virtual-camera translation and scale;
- depth-dependent parallax for each layer;
- source-plane camera movement;
- source focus/contrast treatment for an approved focus handoff; and
- source → Living Frame → captions z-order.

Multiple component layers may share the same scene identity. Layer,
manifest-output, and component-output identities remain unique and canonically
ordered. The source/camera attention treatment uses the first active canonical
scene layer, avoiding duplicate camera application when several planes belong
to one scene.

## Authority and integrity

The motion spec is server-derived from selected-scene and MasterTiming
authority. It cannot mutate timing, SoundSync, approval, work graph, provider,
queue, renderer code, or production state.

The same digest is required in:

- the `prepare_remotion_layer` work input;
- the layer-manifest semantic artifact;
- the final overlay binding;
- the offline Remotion planning manifest; and
- private-review composition evidence.

The canonical server verifier and isolated Remotion runner independently
resample every track from its approved keyframes, using the closed easing and
rounding rules, and recompute the per-track compiled-sample digest. Re-signing
the outer motion-spec digest cannot conceal a changed or invented sample
digest.

Changed digests, stale scene frames, unsupported fields, duplicate target
properties, unsafe identities, incorrect metrics, altered authority flags, or
manifest/final-binding divergence fail closed.

An inferred canonical depth style also cannot silently replace the approved
Visual Continuity Pack depth. Exact style binding remains an open
canonical-owner integration requirement.

## Validation

`server/smoke/living-frame-generated-still-canonical-alpha-work-graph-smoke.ts`
proves exact selected-scene → timing → component → motion → work graph → final
binding → private-review lineage and rejects a resigned motion-digest forgery.

`server/smoke/edit-planning-authority-smoke.ts` compiles motion from the real
`compileCanonicalLivingFrameTimingBinding` result used by the canonical
selected-scene authority proof. It verifies the exact v2 visual keyframes and
rejects phase gaps, visual-boundary drift, reveal/hold/exit drift, duplicate
derived frames, and forged timing lineage.

`server/smoke/offline-remotion-living-frame-motion-smoke.ts` performs an actual
private 640×360 render. It verifies:

- deterministic horizontal component displacement by pixel centroid;
- shallow-2.5D parallax and camera execution;
- a same-scene deep-multiplane foreground/background pair using separately
  committed RGBA inputs;
- differential deep parallax by measuring that the foreground plane responds
  more strongly than the background plane to the same virtual-camera track;
- source focus-handoff execution;
- Living Frame below the caption plane; and
- private, checksum-committed MP4 output.

`server/smoke/offline-remotion-streaming-output-smoke.ts` performs an actual
4K server-injected render and independent FFprobe validation while exercising
committed source, Living Frame RGBA, captions, supplemental audio, motion,
camera/depth, H.264/AAC output, complete BT.709 metadata, and private
content-addressed persistence.

These tests prove the private renderer contract. They do not release the
controlled-illustration GPU generation route or authorize production.
