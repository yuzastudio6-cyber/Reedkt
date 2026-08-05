# CAP-20 — Private Internal Release Report

Milestone: `CAP-20`

Status: `ready_for_shared_pipeline_integration`

Target terminal status: `caption_specialist_private_internal_qualified`

Terminal status reached: **not yet**

## Outcome

CAP-20 closes all remaining Caption-owned release work and publishes a strict
private-internal release candidate for the canonical backend workflow. The
candidate contains the final per-job report, security review,
dependency/license review, bounded performance/cost evidence, complete
CAP-00R–20 regression catalog, and future Orchestra mounting guide.

The currently admitted surface has 29 jobs and no blocker:

- 25 jobs have actual private Caption evidence;
- four typed boundary jobs have contract qualification because their correct
  output is a byte-free coordination artifact, not media execution.

Twelve enhanced jobs are excluded from the current admitted surface and remain
conditional on five shared owners. Their Caption-side planners, validators,
fallbacks, and support adapters exist, but whole-pipeline execution evidence is
not yet available. CAP-20 therefore does not claim the target terminal status.

This is the right handoff state for internal end-to-end backend integration. It
is not a public SaaS production release.

## Exact job disposition

The final report preserves all 41 declared Caption job types in canonical
order.

| Disposition | Jobs | Meaning |
| --- | ---: | --- |
| Admitted with private evidence | 25 | Caption-owned behavior and bounded private media evidence passed |
| Admitted typed boundary | 4 | Correct output is a versioned non-executing handoff contract |
| Conditional, not admitted | 12 | Caption code is complete; authenticated shared-owner evidence is missing |

The 12 conditional jobs are:

- `plan_caption_blocking_preview`;
- `resolve_multi_track_caption_scene`;
- `resolve_spatial_typography`;
- `resolve_subject_occluded_typography`;
- `resolve_front_of_subject_typography`;
- `resolve_object_anchored_typography`;
- `resolve_environmental_typography`;
- `provide_typographic_transition_support`;
- `prepare_caption_boundary_timing_requirements`;
- `provide_caption_safe_region_constraints`;
- `provide_typographic_transition_component`; and
- `provide_caption_broll_composition_constraints`.

They require authenticated evidence from Track All, the B-roll owner,
SoundSync, the canonical transcript/diarization owner, or Visual Intelligence.
The seven CAP-18 missing-integration fixtures map to these 12 jobs. There is no
Caption-owned blocker and no external provider/model evidence blocker in the
Caption release itself.

No conditional job is silently marked supported. The release manifest has
`currentAdmittedSurfaceQualified=true`,
`conditionalSharedOwnerSurfaceQualified=false`,
`privateInternalSpecialistQualified=false`, and
`finalGoalCompletionClaimed=false`.

## Security review

The point-in-time production dependency audit covered 319 production
dependencies and reported zero info, low, moderate, high, or critical
vulnerabilities. This is one dated input, not a permanent guarantee.

The release also binds:

- strict unknown-field, unsafe-text, inherited-property, accessor, and cycle
  refusal;
- tenant, approved-snapshot, confirmed-frame, and timing scope enforcement;
- no serialized raw chat, transcript bodies, media bytes, filesystem paths,
  URLs, credentials, or browser-local completion;
- frontend/server import-boundary enforcement;
- current-tree and reachable-history secret scans with no secret value printed;
- authenticated canonical reread requirements;
- the CAP-19 retired-owner boundary; and
- offline, confined Caption fixture runtimes.

Canonical provider lifecycle persistence, private review, and authenticated
shared-result integration remain backend-owner gates. Provider/model calls,
operation dispatch, billing, public delivery, and production authority are
false.

## Dependency and license review

The frozen private fixture inventory covers:

| Dependency | Exact version/identity | License disposition |
| --- | --- | --- |
| Root production dependency graph | package-lock v3, digest `9c53f067360f43078c50cae36b519a34eabbbc31ac0ac47fda8c1386c6495c94` | pinned metadata; canonical legal review still required before public distribution |
| Remotion renderer | `4.0.487` | Remotion License; commercial/production owner review remains open |
| libass | `0.17.5` | ISC |
| Reviewed Noto Caption pack | release `2026-08-04-v1` | SIL OFL 1.1 only |
| FontTools | `4.38.0` | MIT |
| OpenType Sanitizer | `8.2.1` | BSD-3-Clause |
| FFmpeg packager | `tool.ffmpeg.execute_approved_media_recipe.v1` | canonical owner retains LGPL/codec/patent review |

The review started no runtime and downloaded no dependency. Runtime font
downloads and caller-selected binary/font paths remain prohibited. It approves
only the already-executed bounded private fixtures; it makes no public legal,
distribution, or production claim.

## Performance and cost evidence

The bounded private evidence includes nine media outputs, 1,200 rendered
frames, 44 seconds of total rendered media, and 35 frames opened and visually
inspected. The standard Remotion fixture profile was confined to two CPU cores,
4 GiB memory, and a 15-minute maximum runtime, with actual CPU execution and
deterministic technical QA observed.

There were zero provider/model calls, zero provider cost, and zero credit
reservation or spend actions. Local compute unit cost was not allocated, so
“zero provider cost” is not mislabeled as “zero total cost.” Customer-scale
throughput and full-resolution production benchmarks were not performed and
production performance qualification remains false.

## Visual QA

CAP-20 reuses, without relabeling, the directly inspected CAP-14/CAP-15/CAP-18
evidence. The final CAP-18 set contains real private MP4s at 16:9, 9:16, and
1:1; full and reduced creative variants; and French, Japanese, Arabic, and
Devanagari libass-to-Remotion composites. Thirty-five requested rendered frames
were opened and inspected.

Technical QA did not replace looking at the pixels. The evidence remains
controlled private fixture evidence: complete-playback qualified AI review,
independent final QA, customer-media claims, and production visual approval are
not inferred.

## Verification and release state

`smoke:captions-specialist-cap-20` passes 57 assertions over the release
manifest and its adversarial boundaries. The frozen receipt digests are:

- release candidate:
  `ea24f3593733c3f8c62a5758fdad099aa256c90dd7118903586628f453e8d8af`;
- final job report:
  `b1444a56f07c324109b6e947ecce82c170d896909d6e11e127ea3ada7364c8b1`;
- security review:
  `30609403d7749863a930d8c99a62bcb52ee14ee1dad7c3b69bb8e936f22627b3`;
- dependency/license review:
  `337d07af9e2f21a3cf4bec9e5e8eee49b6bf37885d7a7abf71b166e1d8b35143`;
- performance/cost evidence:
  `5bb6e3e19ba8bd85700cfb7e4a5f45ec786e44299d60e10a4515655b82887227`;
  and
- future Orchestra mounting guide:
  `9788d67274de02fd46981b410f143b8e0c5a8b3ef6a5d866e1ea7e8622efdf6e`.

The source-only aggregate runs CAP-01 through CAP-20;
CAP-00R is verified through its frozen documentation requirements. Repository
lint, build, server typecheck, frontend/server boundary, secret scans, package
audit, diff hygiene, and unchanged package lock are recorded in the publication
receipt.

The release status is `ready_for_shared_pipeline_integration`. The exact next
step is for the canonical backend workflow owners to consume the frozen public
types, supply authenticated shared-owner evidence, and rerun the final
qualification projection. Only when the 12 conditional jobs are admitted with
real shared evidence may a later manifest claim
`caption_specialist_private_internal_qualified`.

## Authority boundary

No central Orchestra, HQ reasoning loop, global scheduler, Caption-specific
dispatcher, provider writer, duplicate tracker, duplicate B-roll selector,
duplicate Sound owner, duplicate transcript owner, duplicate Visual
Intelligence owner, billing owner, public-delivery owner, or production owner
is implemented by CAP-20.
