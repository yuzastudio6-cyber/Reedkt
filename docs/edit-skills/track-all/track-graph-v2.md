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
