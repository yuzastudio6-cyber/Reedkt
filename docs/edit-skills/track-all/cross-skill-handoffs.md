# Track All cross-skill geometry handoffs

## Ownership boundary

Track All publishes content-addressed geometry evidence; it does not call peer
skills or take over their final design or render authority. Every handoff is
bound to the exact user, workspace, project, edit session, assignment, plan,
manifest, source checksum, authorized frame range, and Track Graph V2 hash.
Large mask data stays in private binary storage and crosses the boundary only
as strict private artifact references.

The handoff compiler rejects missing or mismatched box, mask, anchor, camera,
and planar artifacts. It also rejects cross-workspace lineage and geometry
outside the authorized range.

## Consumer projections

- B-Roll receives the frozen `track_graph_v1` compatibility projection,
  Track Graph V2, primary-subject safe tracks, inset avoidance, masks, anchors,
  camera motion, and planar geometry.
- Captions receives foreground, behind-subject, and face-safe track geometry.
  Captions retains final caption design and collision resolution.
- Graphic Design receives stable anchors and trajectory availability for
  callouts and leader lines. It retains final graphic design.
- Living Frame receives subject/depth ordering, foreground occluders, and
  camera-transform availability.
- 3D receives planar surfaces, occlusion tracks, camera transforms, and
  geometry-derived scale cues.
- Color receives selective-color and skin-protection track references. Color
  retains final selective-color authority.
- Sound receives interaction, entry/exit, and movement cue frames. Sound
  retains final sound-treatment authority.
- Transition receives foreground occluders, natural-wipe candidates, and shot
  boundary frames. Transition retains final transition design.
- Render receives an exact private layer manifest, frame-range requirement,
  mask-resolution requirement, and QA lineage. Render retains final export.

The handoff artifact uses a strict discriminated payload for each consumer;
there is no unrestricted generic payload envelope and no model-specific
downstream dependency.

## Frozen Caption CAP-20 coordination notice

Caption source branch `codex/captions-specialist-cap-00r-v1` is published at
`a07219c141bb5f2b7628949ffcbcc7bfbfd06108`. Its frozen CAP-20 state declares
29 admitted jobs and 12 conditional shared-owner jobs. Track All geometry is a
required owner dependency for:

- `resolve_subject_occluded_typography`;
- `resolve_front_of_subject_typography`;
- `resolve_object_anchored_typography`;
- `resolve_environmental_typography`; and
- affected safe-region and spatial jobs.

The source-only public owner type is the `captions` variant of
`track_all_cross_skill_handoff_v1`, bound to an exact `track_graph_v2`
reference plus foreground, behind-subject, face-safe, mask, anchor, camera,
planar, tenant, source, plan, manifest, and authorized-range lineage. Caption
owns typography/design and must not import Track All internals, execute SAM,
or claim Track All evidence. The B-Roll owner separately owns
`provide_caption_broll_composition_constraints`.

No authenticated owner-produced receipt has been sent from this freeze:
Track All is planning-qualified and its SAM-backed geometry remains blocked;
the current cross-skill lifecycle uses explicit injected private fixtures.
That evidence cannot unlock Caption's private specialist qualification. When
real private owner artifacts are dependency-complete, the coordination handoff
must contain only the exact Track All branch, commit, public artifact types,
and reread hashes through the backend one-writer workflow. Nothing is copied
between divergent worktrees and no Caption code is mutated here.

## Verification

Run:

```sh
npm run test:track-all-cross-skill-handoffs
```

The fixture constructs a strict Track Graph V2 with anonymous person, face,
and planar-screen tracks and proves all nine projections, frozen B-Roll V1
compatibility, exact hash uniqueness, peer ownership preservation, tenant
isolation, model-neutrality, and zero outside-range mutation.
