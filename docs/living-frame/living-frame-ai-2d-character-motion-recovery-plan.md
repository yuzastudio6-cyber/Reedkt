# Living Frame AI-assisted 2D character-motion recovery plan

Status date: 2026-07-31

Status:
`source_only_strategy_contract_active_runtime_feasibility_not_started`

## Decision

The generic articulated-still Blender character route failed the professional
quality bar. It is quarantined. The actual rendered airship-navigator clip
proved that technical alpha, mask, depth, connectivity, motion, and restoration
metrics can all pass while the character still looks visibly wrong.

Living Frame itself is not discarded. Character motion becomes an optional,
separately gated capability. Maps, diagrams, mechanical parts, environmental
motion, camera/parallax, spatial overlays, speaker occlusion, attention
handoffs, semantic scale, captions, sound, and Remotion composition continue
to use their existing routes.

## Correct motion model

Meaningful illustrated-character pose changes use complete key poses:

```text
structured narrative action
  -> complete source-character reference
  -> action-mechanics choreography
  -> only the required complete key poses
  -> StoryTiming-owned non-generic frame placement
  -> visual acceptance of every complete pose
  -> bounded 2D interpolation candidate
  -> rendered-clip visual acceptance
  -> optional cadence smoothing
  -> supporting PixiJS effects
  -> Remotion final composition
```

The system must never create a character animation by independently generating
every frame. It must never promote detached limb pieces, exposed puppet joints,
or an unreviewed rigid-puppet result merely because the file rendered.

## Tool responsibilities

| Owner | Exact responsibility | Prohibition |
| --- | --- | --- |
| Head Intelligence | Select the minimum professional strategy, direct the action, inspect actual key poses and rendered motion, and return `accepted`, `repair_required`, or `rejected` | Cannot accept a result from numeric metrics alone |
| GPT Image 2 | Design or repair a complete coherent character source and complete key-pose candidates | Does not own timing, animation interpolation, or final canvas |
| ComfyUI | Host one controlled pose/depth/reference workflow using approved ControlNet, generic IP-Adapter, and optional LoRA inputs | Does not generate every frame independently and does not own the final canvas |
| ToonCrafter candidate | Evaluation-only generative cartoon interpolation between already accepted complete key poses | Not registered, dispatched, billed, or considered qualified yet |
| RIFE candidate | Evaluation-only cadence smoothing after motion and anatomy already pass | Cannot invent action, anatomy, hands, identity, or attachments |
| OpenToonz | Animate an illustration deliberately authored as a clean 2D mesh/cutout asset | Cannot rescue an unsuitable arbitrary merged still |
| PixiJS | Animate rigid editorial elements, particles, smoke, glows, routes, masks, and other support motion | Cannot deform complex character anatomy |
| Blender | Professionally authored rigs, 3D objects, cameras, environments, and selected non-character 2.5D work | Never the generic still-character route |
| Remotion | Own final canvas, layer ordering, layout, depth, captions, audio, timing projection, and composition | Cannot reinterpret rejected motion as accepted |

ComfyUI remains one supervised workflow-host attempt. ControlNet, IP-Adapter,
LoRA, and preprocessing are capabilities inside that attempt, not separate
tool identities or charges.

ToonCrafter is an Apache-2.0 research project for interpolating two cartoon
images, but its maintainers explicitly warn that success is not guaranteed.
It must pass independent licensing, model-weight, runtime, quality, cost, and
fallback qualification before a production identity or operation can exist:

```text
https://github.com/Doubiiu/ToonCrafter
```

RIFE is frame interpolation only. It may improve cadence after accepted motion
exists; it cannot repair malformed anatomy:

```text
https://github.com/hzwer/ECCV2022-RIFE
```

OpenToonz Plastic supports deformable meshes, skeleton vertices, angle bounds,
rigidity, and stacking order, but its own workflow assumes a suitable drawing
and deliberately built mesh/skeleton:

```text
https://opentoonz.readthedocs.io/en/latest/create_animations_using_plastic_tool.html
```

## Complete-key-pose contract

Key poses are selected from the mechanics and meaning of the particular action,
not from a generic `start / middle / end` template. A prop interaction may need
`start / anticipation / contact / settle`; a body turn may need
`start / passing / action_apex / settle`; an impact may require anticipation,
contact, follow-through, and recovery. The bounded feasibility route currently
admits three or four complete poses only. When Head Intelligence determines that
the action cannot be expressed professionally within that count, the route must
decline or select a different animation strategy rather than compressing or
omitting necessary mechanics.

Each pose must:

- contain one complete coherent character;
- preserve the same face, body proportions, clothing, prop, lighting, and
  illustrative style;
- preserve correct hands, limb count, and attachment geometry;
- avoid visible seams, socket joints, floating secondary parts, and cropped
  anatomy;
- bind to the source reference, pose control, scene, confirmed frame, and
  private artifact lineage; and
- pass professional visual inspection before interpolation begins.

## Mandatory rendered-motion gate

Technical checks remain necessary but are never sufficient. The Head
Intelligence must inspect the actual clip and representative frames for:

1. anatomy and limb count;
2. joint and silhouette continuity;
3. face and identity continuity;
4. clothing and body-proportion continuity;
5. hand-to-prop attachment;
6. secondary-part attachment;
7. flicker and texture crawl;
8. intentional and physically plausible motion;
9. frame layout, depth, caption, and safe-zone integration; and
10. style, lighting, and color continuity.

The only dispositions are:

```text
accepted
repair_required
rejected
```

`pending`, `repair_required`, and `rejected` results cannot become canonical
QA, private-review approval, asset-manifest readiness, final render readiness,
public delivery, or production evidence.

## Bounded feasibility sprint

The automated character branch must pass three fixtures:

1. complete character interacting with a prop;
2. complete character performing a meaningful pose change; and
3. complete character integrated into an A-roll or documentary composition.

For each key-pose role, allow no more than three controlled attempts. All poses
must pass before interpolation. All three rendered fixtures must pass actual
professional visual review.

The branch fails and remains disabled when any of these conditions occurs:

- identity, anatomy, clothing, or prop continuity cannot pass within the
  attempt limit;
- interpolation produces persistent deformation or temporal instability;
- routine manual repaint is necessary for normal scenes;
- a rejected output is promoted by automated metrics; or
- the three-fixture set does not pass the approved visual bar.

Failure disables automated character animation, not the rest of Living Frame.
The professional fallback is a coherent still character with motivated camera,
parallax, environmental motion, rigid prop motion, graphic explanation, and
sound—or deliberate no animation.

## Current authority boundary

`living-frame-ai-2d-character-motion-strategy-v1` is source-only planning
evidence. It creates no ToonCrafter or RIFE registry identity, operation,
runtime, model mount, dispatch, artifact, cost, billing, public-delivery, or
production authority. ComfyUI key-pose execution, OpenToonz runtime
qualification, ToonCrafter/RIFE evaluation, and the three real visual fixtures
remain open.

The executable responsibility boundary is separately frozen as
`living-frame-character-motion-tool-policy-v1`. It fixes the nine owners,
their permitted inputs and outputs, forbidden claims, exact AI-2D handoff
order, authored-rig alternatives, and failure behavior. It places mandatory
Head Intelligence visual decisions after complete keyposes, after interpolated
motion, and after final Remotion composition. No downstream stage may treat a
failed or missing visual decision as success.

The companion `living-frame-complete-character-keypose-plan-v2` compiles one
unit per exact action-directed complete keypose. It does not prescribe a generic
middle pose: the action choreography supplies the required phase role, semantic
reason, body mechanics, prop constraint, StoryTiming frame, and minimum hold.
Every unit is a complete 1024-square character candidate, binds exact
source/style/pose/work/choreography/timing lineage, and keeps interpolation,
RIFE, and Remotion blocked until professional visual acceptance exists for every
pose.

Source-only regressions:

```text
npm run smoke:living-frame-ai-2d-character-motion
npm run smoke:living-frame-professional-visual-review
npm run smoke:living-frame-complete-character-keypose-plan
npm run smoke:living-frame-character-action-choreography
npm run smoke:living-frame-character-motion-tool-policy
npm run smoke:living-frame-ai-2d-feasibility-sprint
npm run smoke:living-frame-ai-2d-interpolation-qualification
npm run smoke:living-frame-ai-2d-interpolation-source-audit
npm run smoke:living-frame-complete-character-keypose-review
npm run smoke:living-frame-complete-character-interpolation-admission
```

`living-frame-ai-2d-feasibility-sprint-v1` freezes the three non-waivable
fixtures before any runtime begins. It requires exact coverage of prop
interaction, meaningful pose change, and A-roll/documentary integration. A
three-pose fixture has at most nine controlled keypose attempts and a four-pose
fixture has at most twelve. Rejected attempts cannot become fallback assets,
fixture results cannot be averaged, and automated character animation remains
disabled until all three final composites pass actual visual inspection.

`living-frame-ai-2d-interpolation-qualification-v1` separately records
ToonCrafter and RIFE as source-reviewed but blocked evaluation candidates. The
upstream repositories declare Apache-2.0 and MIT source licenses respectively,
but that observation is not a release decision for their model weights,
dependencies, or runtime. Each candidate still requires a pinned and scanned
source archive, independent source and model-weight license disposition,
offline non-root runtime, fixed request adapter, supported-hardware evidence,
private inference, resource/cost evidence, persistence/reread, and professional
visual QA. Neither candidate currently creates a registry identity or operation.

`living-frame-ai-2d-interpolation-source-audit-v1` pins the official source
commits and independently repeated GitHub commit-archive bytes for both
candidates. It records archive inventories, exact license and dependency-file
digests, and static risks without checking source archives into the repository.
The ToonCrafter audit records its runtime Hugging Face download path, unpinned
dependencies, large pickle checkpoint, and official approximately 24–27G
memory report;
the RIFE audit records its upstream shell-based FFmpeg path, unpinned
dependencies, and unresolved external model archive. Those upstream paths are
not eligible for ReeditPro execution. Both require fixed offline adapters and
separate model, license, image, hardware, resource, private-output, and visual
qualification. Source pinning is complete; runtime qualification is not.

`living-frame-character-action-choreography-v1` prevents generic
start/middle/end pose selection and default evenly spaced timing from entering
the character route. Head Intelligence must classify the action, identify its
actual mechanics, select only the narratively and physically necessary phases,
and explain why each complete-character keypose exists. Prop actions require
explicit contact and hand/prop continuity; anticipation, contact, and
follow-through phases become mandatory when the action mechanics require them.
Exact keypose frames come only from a content-addressed StoryTiming artifact.
Every transition must fall inside its action-specific frame range and motion
curve. Uniform spacing is rejected unless the action has an explicit mechanics-
based justification. Technical timing validation cannot approve professional
motion; the finished motion and final composite still require actual visual
inspection.

The still-image gate is `living-frame-complete-character-keypose-review-v1`.
It binds the actual decoded private PNG to its exact keypose plan and unit,
approved work item, planned manifest entry, output key, object identity, and
technical-image QA. It requires Head Intelligence inspection across eight
visual checks and derives only `accepted`, `repair_required`, or `rejected`.
A companion review-set contract requires exactly one matching review for every
planned pose in canonical order and rejects cross-pose artifact reuse.
ToonCrafter admission may be materialized only when every pose is accepted.
Decode, exact 1024-square dimensions, and crop checks must all pass before
visual acceptance is even eligible; those technical checks still cannot unlock
interpolation without the eight Head Intelligence visual checks.

`living-frame-complete-character-interpolation-admission-v2` consumes one
exact all-accepted keypose review set, its exact feasibility fixture, the
source-reviewed ToonCrafter qualification record, and a StoryTiming-owned
keypose-frame artifact whose exact frame list is content-addressed and bound to
the fixture MasterTiming digest. Workspace, project, edit session, approved
snapshot, selected scene, component, keypose plan, review set, confirmed frame,
and style lineage remain frozen. It produces one non-executable transition
candidate per adjacent accepted pose pair. It does not derive a parallel clock
or a model request. Caller seed, prompt, model, dimensions, paths, URLs, bytes,
credentials, commands, and environment are absent and rejected as extra input.
Any eventual ToonCrafter motion prompt must be deterministically derived by the
server from the accepted keypose and semantic-motion plan; it is not caller
supplied.
The candidate stays blocked until ToonCrafter source/model/runtime qualification
is released; its eventual outputs still require private persistence, technical
QA, actual rendered-motion inspection, temporal masking when isolation is
needed, and Remotion final composition and visual inspection. Runtime remains
blocked until the canonical work-graph and asset-manifest owners add an exact
approved interpolation work item and planned output entry.
