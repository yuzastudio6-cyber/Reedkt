# Living Frame selected-scene selective-motion reconciliation

Status: read-only, namespaced, non-authoritative reconciliation candidate.
Canonical motion planning, component-rig admission, rendering, work-graph
mutation, QA approval, review, dispatch, billing, and production authority
remain false.

## Purpose

Living Frame animates meaningful components, not every object in a scene. A
scene-level visual verb is narrative direction; it is not permission to apply
that transform to every component.

The current canonical scalar motion compiler receives one component at a time
but derives rotation from the scene-level `visualVerb`. In a scene whose verb
is `rotate`, the current compiler therefore creates a rotation track for:

- static background anchors;
- stable primary subjects;
- mechanical components that should rotate; and
- environmental effects that require particles or another environmental
  treatment.

That behavior contradicts the approved component roles and mini-skill
activations.

## Reconciliation rule

`living-frame-selected-scene-selective-motion-reconciliation-v1` independently
recompiles every current canonical component motion spec and compares it with
the selected scene's component role and linked mini-skill activations.

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

## Representative finding

The five-component selective mechanical-motion fixture currently produces:

| Component role | Current rotation | Required disposition |
| --- | ---: | --- |
| Static background anchor | yes | remove rotation |
| Stable primary subject | yes | remove rotation |
| Mechanical component A | yes | retain, subject to rig pivot |
| Mechanical component B | yes | retain, subject to rig pivot |
| Environmental effect | yes | remove rotation; add qualified environmental primitive or fallback |

The reconciliation observes five rotation tracks, while only two components
are eligible for mechanical rotation. It therefore blocks downstream
selective-motion admission for the three divergent components without
modifying the current specs.

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

At the canonical motion boundary:

1. derive per-component tracks from component role plus linked activation;
2. remove mechanical rotation from unselected and static components;
3. retain required mechanical rotation only for explicitly activated
   mechanical components;
4. bind those rotations to approved component-rig pivots before rendering;
5. route environmental motion to a qualified primitive or approved fallback;
6. preserve the five semantic MasterTiming phases;
7. preserve SoundSync and Caption Direction ownership; and
8. add private-review evidence proving the intended component moves while
   the anchors remain stable.

## Files

- `src/types/living-frame-selected-scene-selective-motion-reconciliation.ts`
- `server/living-frame/living-frame-selected-scene-selective-motion-reconciliation.ts`
- `server/smoke/living-frame-selected-scene-selective-motion-reconciliation-smoke.ts`
