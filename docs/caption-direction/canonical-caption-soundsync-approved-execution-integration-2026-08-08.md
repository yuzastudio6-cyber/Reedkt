# Canonical Caption SoundSync Approved-Execution Integration

Date: 2026-08-08

## Outcome

The canonical Caption execution owner can now continue exact approved boundary
work through one typed Transition handoff and the typed SoundSync support path
without creating a second Caption dispatcher or transferring Transition/audio
ownership to Caption:

1. reread the immutable approved snapshot, confirmed frame, PictureLock,
   finish readiness, MasterTiming, and StoryTiming lineage;
2. persist and reread one byte-free Caption-to-Transition V2 outbound handoff,
   bound to the frozen V1 compatibility contract, with Caption retaining
   information ownership and receiver execution false;
3. author one byte-free semantic Caption sound-cue request from the locked
   scene graph and motion plan;
4. stop the Caption job at one HQ-mediated SoundSync support request;
5. persist and reread the SoundSync-owned result as an authenticated evidence
   projection;
6. let the central Caption execution owner resume the same approved job;
7. preserve the exact package, work item, job, manifest, output, scene,
   boundary, frame range, and idempotency lineage through replay.

StoryTiming remains the sole frame owner. SoundSync remains the cue-selection,
sound-asset, trim, alignment, mix, loudness, dialogue-protection, and audio-QA
owner. Caption owns only its semantic request and its bounded continuation.
Transitions remains the transition-selection and execution owner; this
milestone proves only Caption's exact outbound handoff artifact.

## Approved execution campaign

The source/internal campaign now uses seven separate immutable approved
snapshots and execution packages. It does not fabricate one edit containing
mutually incompatible typography treatments.

- Supported Caption job types: 41
- Covered by approved source/internal execution: 26
- Still missing approved source/internal execution: 15
- Newly covered in this milestone:
  - `provide_typographic_transition_support`
  - `prepare_caption_boundary_timing_requirements`
- Previously covered advanced treatments retained:
  - `resolve_multi_track_caption_scene`
  - `resolve_spatial_typography`
  - `resolve_subject_occluded_typography`
  - `resolve_object_anchored_typography`
  - `resolve_environmental_typography`
  - `resolve_hero_typography`
  - `resolve_persistent_topic_typography`
- Campaign receipt digest:
  `4337e1dcd5e83beac62d4e900f3b292413b9acc3f74083eb2156a0029289d418`
- Exact reread verified: yes
- Identical replay verified: yes
- Terminal qualification claimed: no

## Fail-closed corrections discovered by the aggregate

The first aggregate refusal showed that the structural Sound fixture retained
CAP-12's original 0-360 choreography after the approved call had selected a
different authorized frame range. The fixture now proportionally remaps
StoryTiming events, cue/stable-read ranges, motion primitives, reduced-motion
ranges, and camera requests into the exact approved range. A focused 60-240
regression prevents fixture-frame reuse.

The Transition outbound source is also remapped to the exact approved frame
range. The V2 handoff carries the frozen V1 compatibility handoff rather than
silently replacing the published V1 wire. It explicitly requests no
information-owner transfer, no receiver execution, and no runtime or asset
authority.

The next aggregate refusal exposed a pre-existing approved-execution coverage
parser mismatch. Canonical Caption work and Orchestra calls allow a boundary
to remain bound to a scene, but the coverage parser had required every
boundary occurrence to have a null `sceneId`. Coverage validation now follows
the existing canonical scope rule: a boundary requires `boundaryId`, and may
also retain exact scene lineage. A digest-valid scene-bound boundary
regression is accepted; duplicate or malformed occurrences still fail closed.

## Remaining 15 approved-execution gaps

1. `resolve_front_of_subject_typography`
2. `repair_caption_scene`
3. `recompose_caption_output`
4. `inspect_caption_specific_result`
5. `plan_caption_to_visual_handoff`
6. `resolve_caption_mode_transition`
7. `inspect_caption_boundary_behavior`
8. `provide_speech_derived_typography_spec`
9. `provide_caption_phrase_lineage`
10. `provide_caption_safe_region_constraints`
11. `provide_caption_to_visual_handoff_spec`
12. `provide_accessible_text_projection`
13. `provide_typographic_transition_component`
14. `provide_caption_broll_composition_constraints`
15. `provide_caption_living_frame_handoff_constraints`

`plan_caption_to_visual_handoff` deliberately remains open. Its current
contract requires a complete eight-receiver coordination plan. One exact
SoundSync or Transition handoff cannot honestly satisfy that aggregate, and
the campaign does not invent missing receiver evidence.

## Test-fixture boundary

The SoundSync campaign fixture is structural source evidence only. It proves
closed request, owner projection, create-only persistence, exact reread, and
central Caption resume mechanics. It does not execute a sound provider, create
or inspect real audio, run final-mix QA, or qualify SoundSync for terminal
Caption evidence.

The silent fallback remains available and preserves Caption meaning and motion
timing when owner evidence is unavailable or rejected. It does not create a
sound asset or fabricate owner completion.

The Transition fixture is likewise source-contract evidence only. It does not
select or execute a transition, mutate the timeline, create an asset, or prove
the still-open `resolve_caption_mode_transition` job.

## Authority boundary

No Orchestra implementation was added. Caption receives no Transition or
SoundSync dispatch, provider, runtime, timeline, asset mutation, mix, cost,
billing, final-QA approval, public-delivery, or production authority. The
SoundSync record stays owner-produced; Caption consumes only its exact typed
projection. The existing Caption-above-Living-Frame ordering and opaque Living
Frame boundary are unchanged.

## Evidence

- `smoke:canonical-caption-broll-approved-run-harness`: passed with seven
  approved runs, 26 covered jobs, 15 missing jobs, exact campaign reread, and
  identical replay.
- `smoke:canonical-caption-soundsync-support`: 19 checks, passed.
- `smoke:canonical-caption-specialist-execution`: 54 checks, passed.
- `smoke:canonical-caption-source-led-professional-planning-owner`: 181
  checks, passed.
- Server TypeScript check with the repository-required 8 GB Node heap: passed.
- Provider/model/media runtime started by this milestone: false.
- Public delivery or production authority: false.

This is an internal pipeline-integration milestone. It is not complete-time
qualified visual review, independent final QA, terminal private
qualification, public delivery, or SaaS production readiness.
