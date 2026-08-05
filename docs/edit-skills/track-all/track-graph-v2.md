# Track Graph V2

## Ownership and compatibility

The shared owner is `server/edit-skills/shared/track-graph/`. B-Roll now
re-exports the frozen `track_graph_v1` compatibility schema from that owner;
V1 was not mutated. Track All creates `track_graph_v2` and can project V1 for
the frozen B-Roll consumer.

V2 binds tenant, project, edit session, assignment, plan, manifest, source,
timing, and exact authorized range. It represents shots, bounded chunks,
Object Multiplex budgets, target rules, anonymous temporal identities,
parent/child relationships, visibility and occlusion, re-entry evidence,
identity-switch warnings, camera normalization, stitching, attempts, repairs,
and final QA.

References are typed: boxes, masks, landmarks, anchors, planar geometry,
occlusion logs, camera motion, attempts, and QA cannot be substituted for one
another. Every range remains inside assignment authority and every referenced
artifact must remain in the same tenant/project scope.

## Chunk and identity projection

TRACK-10 implements deterministic projection from bounded per-chunk/per-bucket
observations. It compares exact overlap frames using masklet box IoU and center
geometry, applies bounded gap/re-entry scoring, and assigns stable anonymous
IDs without trusting local SAM object numbers. It rejects duplicate
observations, invalid bucket authority, reordered or out-of-range samples,
cross-tenant mask/evidence refs, and incoherent parent-target lineage.

Independent buckets can reconcile the same object without creating a duplicate
identity. Two same-bucket objects cannot collapse into one stable identity.
Overlapping geometry conflicts and close competing associations emit identity
switch warnings. Missing spans become explicit `lost` intervals; a later
qualified match becomes `reacquired` and receives content-addressed occlusion
and re-entry evidence.

Shot cuts reset association by default. An explicit target policy plus an exact
cross-shot evidence hash may create an uncertain link, but it emits a warning
and `track_identity_lineage_v1` still records `crossShotCertain: false`.
Parent/child tracks are assigned only from frame-overlapping containment
geometry. Similar local object IDs, local ID renumbering, or semantic class
alone never prove continuity.

The projector emits strict track samples, box sequences, private mask-sequence
manifests, occlusion logs, identity lineage, Track Graph V2, and the unchanged
Track Graph V1 compatibility projection. Injected observations remain
test-only and do not qualify actual SAM output.

## Private mask boundary

Track Graph contains references, hashes, dimensions, ranges, and formats. It
does not embed mask bitmap arrays. Mask chunks and sequences are strict private
artifact manifests with `publicUrlPresent: false`, `privateBinaryOnly: true`,
and `publicMaskPublished: false`.

## Active artifacts

Every Track All planning, tracking, treatment, QA, repair, handoff, and result
artifact resolves to its own strict schema. The registry rejects the former
generic lineage-shaped payload for every produced type. Large binary media and
masks remain outside JSON and are reachable only through private,
checksum-bound references.
