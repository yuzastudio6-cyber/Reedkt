# Living Frame canonical execution requirements

Living Frame is an optional WeEditPro editing skill inside the one canonical
edit pipeline. A selected scene cannot bypass that pipeline or silently
disappear from the approved work graph.

`canonical-living-frame-execution-requirements-v1` is a private,
server-derived bridge between selected-scene planning and later executable
authority. It:

- rereads the exact selected-scene binding and deferred parent;
- maps every selected scene expectation to one current canonical timeline
  segment by order and content digest;
- freezes the segment ID and exact start/end frame boundary;
- projects component capability and mini-skill requirements through the
  existing named-work admission catalog;
- records required named work-item types, unresolved operation codes,
  external gates, semantic timing requests, SoundSync requests, and QA
  expectations; and
- stores the result as `livingFrameExecutionRequirements` in the same
  content-addressed canonical plan hash.

For deliberate non-use, the record is empty and
`ready_without_living_frame_execution`. For any selected scene, v1 is
`blocked_until_canonical_execution_projection`. Approval remains blocked until
the separate canonical timing binding resolves exact visual phases and
SoundSync cue placement and later canonical compilers resolve the itemized
estimate, named work items, asset outputs, QA, and private-review dependencies
described by this record. Exact cue placement does not authorize an audio mix.

The requirements record is not an execution payload. It contains no raw chat,
transcript, media bytes, paths, URLs, credentials, provider prompt, model
route, tool route, queue instruction, or cost authority. It creates no work
item or asset-manifest entry and grants no approval, snapshot, QA result,
renderer, runtime, or production authority.

GPU-heavy requirements remain restricted to separately qualified Google Cloud
Run GPU execution. This compiler performs no inference and defines no CPU
fallback.
