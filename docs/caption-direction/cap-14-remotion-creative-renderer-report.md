# CAP-14 — Remotion Creative Renderer Report

Milestone: `CAP-14`

Status: `private_runtime_and_direct_golden_raster_qualified_external_owners_closed`

## Outcome

CAP-14 extends the existing canonical Remotion operation with the additive
`caption_direction_creative_scene_group_v1` composition profile. It does not
create another renderer, worker, queue, timeline, final-canvas owner, or Caption
delivery path.

The scene group consumes the frozen CAP-11 multi-track graph, CAP-10 semantic
style plan, CAP-12 StoryTiming resolution, motion plan, and motion lock. It
renders twelve deterministic layers covering stable speech captions, semantic
cards, hero typography, persistent-list treatment, depth placement, one
fixture-only mask/anchor dependency, typed motion, and reduced-motion
counterparts.

The older `approved_full_frame_rgba` and
`approved_timed_full_frame_rgba_track` profiles remain unchanged as the simple
transparent-overlay fallback. Remotion remains the only final compositor.

## Exact frame boundary

The approved fixture remains bound to the exact confirmed customer frame
`1920x1080@30`. Private runtime qualification renders a disclosed `640x360`
one-third-scale proxy with the same `16:9` ratio. The proxy cannot claim to be
the final customer canvas.

Caption motion and font sizing are derived from the active canvas dimensions;
the renderer does not hard-code preview dimensions when calculating final
typography or travel. StoryTiming frame ranges remain the sole clock.

## Runtime evidence

The authoritative clean-window run used:

- pinned source-bound image:
  `sha256:8ffd2bf37cc9429c696b6efd76c97e08113241c9ef8e6c485899a82b16629776`;
- source-tree SHA-256:
  `5d4a489cbe4d627d6c78178728f55976dbb69a3c6003b4092a618042f968e0e1`;
- Remotion package version: `4.0.487`;
- full-motion MP4 SHA-256:
  `9f703008b429a60c31d7139d364b128312c7c297a5314600fb739ab9d9b039f5`;
- reduced-motion MP4 SHA-256:
  `f201ec3683dc068534743e4ed86089697b2511c9394619668cb39a37aabb914f`.

The two 360-frame MP4s have different digests, while all eight stable golden
frames have identical full/reduced raster hashes. This is the intended parity:
motion changes, wording, layout, hierarchy, and settled visual identity do not.

| Frame | Golden PNG SHA-256 | Direct inspection |
| ---: | --- | --- |
| 0 | `9386add1b0364e0372676fad4d16fa9649a5e187afc36a07bcf975d89002e02c` | pass — opening stable caption is readable and inside the safe frame |
| 29 | `06a04c14b7e9e2d80866de83db2bc3934a1e35e7ee3a6435c98d7aea713dd649` | pass — semantic card and complete speech rail have clear hierarchy |
| 89 | `d586e0becf66f17ed47d6f88793be66bcb5b5594d5edd6610144ca4ee33696de` | pass — hero word remains legible and clear of the subject |
| 149 | `ef7ae4a0af6643c07fc2f896ca9a298b86f3380b819b03152c7a545fee675e18` | pass — list card, marker, subject, and speech rail do not collide |
| 209 | `0e511006506d88aa87c351d3b48da9df13da92db9cb2efb03004528576ca9283` | pass — environmental treatment is balanced and within safe margins |
| 269 | `b948428c2f9d0c46f2f46d190b9c281882b7bb5811c815bf04f3c0269a8df0e6` | pass after repair — `Anchored` stays whole; the object label remains readable |
| 329 | `d37ea1bf7ae49f783bdc570d6020f219ce91ad968993c0bed89ece602e6912ea` | pass — foreground hero and speech rail preserve hierarchy and margins |
| 359 | `da8b1f0cdfc276f894acf4ef4204e148ac0a04ebdbf8e1e350abb34a5a44412b` | pass — clean exit frame contains no stale caption layer |

Both the full and reduced PNG at every listed frame were opened and inspected
directly after all render children exited. The stable lower rail deliberately
retains complete spoken wording while the upper layer demonstrates the
scene-selected creative treatment. It is not a rule that every production
caption must duplicate this fixture arrangement.

The first non-authoritative attempt exposed an unacceptable intra-word split at
frame 269. The run was rejected, the object-label geometry and whole-word CSS
policy were repaired, and a new clean-window render was produced and
re-inspected. Deterministic technical success was not used to override the
visual defect.

## Closed boundaries

- the fixture mask is deterministic private evidence only and does not claim
  Track All or SAM 3.1 runtime evidence;
- Caption remains above Living Frame by default, subject to the already-typed
  StoryTiming-bound information-owner handoff;
- approved fonts, multilingual shaping, libass parity, sidecars, and FFmpeg
  packaging remain CAP-15 work;
- complete-time independent visual QA, repair admission, and final QA approval
  remain CAP-16 and later owner gates;
- asset creation, provider dispatch, final delivery, billing, public rollout,
  and production authority remain false.

## Verification

`smoke:captions-specialist-cap-14` passes 46 source and adversarial assertions.
The private runtime smoke rebuilt and activated the exact current source image,
rendered both variants, and persisted the sixteen requested private golden
frames. Server typecheck is green after the direct-inspection repair.

CAP-01 through CAP-14 regression smokes, the hardened 46-check CAP-14 smoke,
server typecheck, focused and repository-wide lint, production build,
frontend/server boundary scan, repository secret scan, authentication boundary,
edit-execution security boundary, syntax check, and diff check are green. Full
MP4 playback review is retained for the complete QA and real-media
qualification milestones; CAP-14 qualifies the deterministic renderer and its
directly inspected golden raster set.

## Next

CAP-15 adds the stable/accessibility/localization/export lane: dynamic
canvas-aware ASS, approved font assets, SRT/WebVTT, multilingual shaping,
output-specific recomposition, and FFmpeg packaging without changing the
creative Remotion owner.

## 2026-08-05 real-source appearance correction

The synthetic night-sky/person fixture documented above remains engineering
regression evidence only; it must not be presented as the intended Caption
product appearance. A separate additive V2 profile now renders the same closed
Caption layer vocabulary over exact private talking-head footage with source
audio, full/reduced motion, fixed-frame extraction, and direct visual
inspection. The first real-source attempt was rejected for collisions and
overflow; the repaired attempt passed. Exact source, render, frame, technical,
inspection, repair, and limitation evidence is recorded in
[the real-source appearance correction](cap-14-real-source-professional-appearance-correction-2026-08-05.md).
