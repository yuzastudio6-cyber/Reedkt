# Living Frame selected-scene selective-motion reconciliation

Status: read-only, namespaced, non-authoritative reconciliation candidate.
Canonical motion planning, component-rig admission, rendering, work-graph
mutation, QA approval, review, dispatch, billing, and production authority
remain false.

## Purpose

Living Frame animates meaningful components, not every object in a scene. A
scene-level visual verb is narrative direction; it is not permission to apply
that transform to every component.

The canonical v3 scalar motion compiler now receives one component at a time
and derives its tracks from that component's role, focal role, exact linked
mini-skill activations, factual scale guard, and scene visual verb. A scene verb
can influence only a component whose role and activation make that motion
eligible.

## Reconciliation rule

`living-frame-selected-scene-selective-motion-reconciliation-v2` independently
recompiles every canonical v3 component motion spec and compares it with the
selected scene's component role and linked mini-skill activations.

Mechanical rotation is allowed only when:

1. the component role is `mechanical_component`;
2. the component is explicitly linked to a
   `mechanical_part_motion` activation; and
3. the selected scene visual verb requires rotation.

Static anchors remain unrotated. A primary subject that is not linked to the
mechanical activation remains unrotated. An environmental component linked to
`environmental_motion` must use a qualified environmental primitive or an
approved fallback; it must not inherit mechanical rotation merely because the
scene verb is `rotate`.

The reconciliation does not choose exact rotational speed, direction,
acceleration, blur, particle density, or fallback. Those remain canonical
motion/style decisions bound to MasterTiming, the component rig, and review.

## Representative regression

The historical five-component mechanical-motion fixture now produces:

| Component role | Current rotation | Required disposition |
| --- | ---: | --- |
| Static background anchor | no | correct |
| Stable primary subject | no | correct |
| Mechanical component A | yes | retain, subject to rig pivot |
| Mechanical component B | yes | retain, subject to rig pivot |
| Environmental effect | no | qualified environmental primitive or fallback still required |

The reconciliation now observes exactly two rotation tracks, both on the two
eligible components. It detects no scene-verb broadcast or static-anchor
rotation. The environmental component remains blocked only because its
qualified procedural primitive/fallback is a separate downstream contract.

An active non-character Living A-Roll regression also proves that the source
plate and temporal subject-mask geometry remain transform-stable, exact map
scale remains literal, and no component receives a rotation track merely from
the scene-level visual direction.

## Component-rig boundary

An eligible mechanical rotation still cannot claim physical correctness until
the existing component-rig owner supplies:

- the approved pivot;
- parent and anchor relationships;
- component geometry;
- motion-track binding;
- alpha/mask readiness; and
- pivot-physics QA.

This candidate records that requirement. It does not fabricate a center pivot
or infer one from a component name.

## Environmental-motion boundary

The current canonical renderable property set does not include
`particle_emission_normalized`, although the earlier deterministic-motion
contract recognizes that semantic property. The reconciliation therefore
records an environmental runtime gap instead of treating a rotating dust
layer as downwash.

The canonical owner may later resolve this with:

- a qualified deterministic particle primitive;
- a separately approved environmental effect asset;
- a simpler deterministic opacity/path treatment that honestly represents
  the approved intent; or
- an approved static fallback.

The fallback must preserve the Living Frame motion budget and cannot silently
upgrade to generated video.

## Authority boundary

This candidate:

- does not alter the selected scene;
- does not alter any canonical motion spec;
- does not add a new timing system;
- does not set exact motion values;
- does not create component-rig evidence;
- does not add renderer code;
- does not create work items or assets;
- does not register or dispatch an operation;
- does not authorize cost, billing, approval, QA, review, or production; and
- remains subject-neutral.

## Canonical-owner continuation

At the remaining canonical boundaries:

1. keep the v3 role/activation-selective scalar compiler and regression;
2. route environmental motion to its qualified primitive or approved fallback;
3. preserve the five semantic MasterTiming phases;
4. preserve SoundSync and Caption Direction ownership;
5. bind the v3 motion digest into admitted work/manifest/renderer lineage; and
6. add active non-character private-review evidence proving that only intended
   components move while anchors and protected geometry remain stable.

Mechanical rigging is paused by the owner. The historical mechanical portion
of this regression remains negative/compatibility evidence and cannot authorize
active work or count toward active Living Frame completion.

## Files

- `src/types/living-frame-selected-scene-selective-motion-reconciliation.ts`
- `server/living-frame/living-frame-selected-scene-selective-motion-reconciliation.ts`
- `server/smoke/living-frame-selected-scene-selective-motion-reconciliation-smoke.ts`
