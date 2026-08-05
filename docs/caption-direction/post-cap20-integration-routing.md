# Post-CAP-20 Shared-Owner Integration Routing

Milestone: `POST-CAP-20-INTEGRATION-ROUTING`

Status: `source_complete_authenticated_owner_evidence_pending`

- integration manifest hash:
  `03ab9332e2c097b9ed72a61987d0ed5fc1e89ef46fd2b7a4444a03631e8b234d`;
- integration qualification digest:
  `facd5d56f517c1efe64425aaed663f42cc6fa4e86f45576598d3fee1900ebd46`.

## Outcome

The frozen CAP-01 planning manifest remains byte-for-byte unchanged. An
additive `captions.specialist.integration.manifest` now projects the later
CAP-13/CAP-20 dependency requirements into the top-level Caption call and
resume lane.

This closes a real integration defect: the original planning manifest knew
about general transcript, frame, timing, Visual Intelligence, Track All, and
Living Frame inputs, but it could silently complete the later SoundSync,
B-roll, and safe-region support jobs without the exact evidence added by later
milestones. The additive manifest merges the frozen CAP-20 conditional-job map
without changing any older wire identity or digest. The runtime also applies a
backward-readable fail-closed hardening: a missing canonical transcript is
blocked in both profiles instead of being misrouted to the timing owner.

## Exact behavior

- all twelve CAP-20 conditional jobs declare the exact shared-owner artifact
  types from `caption-shared-owner-integration-handoff-v1`;
- `caption_sound_support_result` routes to SoundSync through an HQ-mediated
  support request;
- `caption_broll_owner_read_binding` routes to the B-roll owner through an
  HQ-mediated authenticated-read request whose exact public wire identity is
  `b_roll_caption_owner_read_request_v1`;
- `provide_caption_safe_region_constraints` requests both Track All and Visual
  Intelligence and resumes sequentially;
- `canonical_transcript` and its exact
  `canonical_transcript_authenticated_read_binding` remain initial inputs and
  fail closed if either is missing instead of being misrouted to the timing
  owner;
- the exact immediate support request and origin call remain required on every
  resume; and
- prior injected evidence becomes a canonical reread input for the next
  sequential call.

## Compatibility

The CAP-01 identities and hashes remain frozen. Existing valid calls remain
readable; only the invalid missing-transcript path is tightened:

- manifest:
  `35581a7e584dadb397302ebddf83bdc811442d141c060b4ba2ba1263acb2af2d`;
- planning qualification:
  `4d988d1dd94f13ff3ef95cedbd2b69d4c80f81458f8bb29f391ba18d2bb1b268`.

The additive integration manifest and qualification use distinct IDs and
digests. Both qualify planning and dependency routing only. Preview, private,
final, and production execution remain blocked.

## Canonical backend bridge requirement

The active backend and Caption branches both contain the strings
`orchestra-skill-call-v1`, `skill-support-request-v1`, and
`orchestra-skill-job-result-v1`, but their closed wire shapes are materially
different. They are separate frozen records and are not cast-compatible.

The canonical backend must therefore publish an additive, distinctly versioned
bridge/projection that rereads the exact source record, recomputes the target
digest, and preserves original call/request/result lineage. Neither side may
relabel its V1 payload as the other V1. This Caption checkpoint changes none of
the frozen neutral contracts and imports no backend implementation.

The B-roll lane additionally binds the frozen public contract receipt and the
additive `caption-broll-owner-read-adapter-v1` receipt. The support request does
not embed or invent a partial B-roll request: the canonical mediator must build
the exact public request only after its approved snapshot, output frame, scene,
FPS, and MasterTiming authority refs are available.

## Existing owners reused

Caption still owns no transcript reader, tracker, SAM runtime, Sound runtime,
B-roll selector, Visual Intelligence provider, scheduler, dispatcher, asset
writer, final-QA decision, billing, or delivery owner. The test harness creates
only synthetic byte-free artifact references to prove the resume protocol.
Actual admission still requires authenticated backend rereads. The Caption
public B-roll adapter is now frozen, while owner-result persistence, reread,
and injection remain external.

The Caption canonical-transcript authenticated-read adapter is also frozen.
Actual transcript and binding persistence/reread/injection remain external.

The Caption consumer for the canonical backend sequential-resume ledger is
frozen against backend commit `832f56fc41c90413f6c99cc70d5cd658c8e44675`.
Actual persisted owner projections and resume records remain external.

## Tests

The focused integration smoke passes 28 checks for frozen-hash compatibility,
all twelve
conditional job requirements, SoundSync and B-roll routing, two-owner
safe-region sequential resume, missing-transcript fail-closed behavior,
cross-profile qualification refusal, and the closed authority boundary.

No media, model, provider, Docker, Python, Remotion, FFmpeg, browser, billing,
public, or production action is performed.

## Remaining blockers

This does not reduce the nine categories in the post-CAP-20 completion audit to
zero. It completes the Caption-side dependency-routing portion of the canonical
backend mount. Authenticated owner adapters/results, persisted backend rereads,
complete-time visual-AI review, independent final QA, and the final per-job
private qualification projection remain required.
