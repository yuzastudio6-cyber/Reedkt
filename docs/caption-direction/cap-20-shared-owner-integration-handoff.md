# CAP-20 Shared-owner integration handoff

## Outcome

CAP-20 is frozen at commit
`a07219c141bb5f2b7628949ffcbcc7bfbfd06108`. This additive handoff maps its
12 conditional Caption jobs to the exact five shared owners and the existing
Caption public contract surfaces. It does not change the CAP-20 admitted job
surface and does not claim the terminal private qualification status.

The machine-readable contract is
`caption-shared-owner-integration-handoff-v1`.

## Exact owner boundaries

### Visual Intelligence

- Caption request: `CaptionVisualIntelligenceSupportPayload`,
  `caption-visual-intelligence-support-payload-v1`.
- Neutral mediation: `SkillSupportRequest`, `skill-support-request-v1`.
- Owner result consumed by Caption:
  `CaptionVisualIntelligenceEvidencePacket`,
  `caption-visual-intelligence-evidence-packet-v1`.
- Caption projections: `CaptionVisualOccupancyManifest` and
  `CaptionFinalVisualHierarchy`.
- Caption parsers are in
  `server/captions-specialist/caption-visual-intelligence-support.ts`.
- Remaining integration: authenticated private owner result injection and
  canonical reread.

### Canonical transcript

- Required initial artifact type: `canonical_transcript`.
- Public value: `CaptionCanonicalTranscript`,
  `caption-canonical-transcript-v1`.
- Qualification and Caption projection:
  `CaptionAlignmentQualification` and `CaptionPhraseLineageProjection`.
- Caption parsers are in
  `server/captions-specialist/caption-transcript-lineage.ts`.
- Remaining public owner gap: an authenticated canonical transcript reread
  binding. This is an initial-call prerequisite, not a direct peer dispatch.
  The backend must not route a missing transcript to the timing owner.

### Track All

- Caption request: `CaptionTrackAllSupportPayload`,
  `caption-track-all-support-payload-v1`.
- Neutral mediation: `SkillSupportRequest`, `skill-support-request-v1`.
- Owner result: `CaptionTrackAllEvidencePacket`,
  `caption-track-all-evidence-packet-v1`.
- Caption admission: `CaptionTrackAllAdmission`,
  `caption-track-all-admission-v1`.
- Caption parsers are in
  `server/captions-specialist/caption-track-all-support.ts`.
- Remaining integration: authenticated Track All artifact persistence,
  reread, injection, and private evidence.

### SoundSync

- Caption request: `CaptionSoundCueRequest`,
  `caption-sound-cue-request-v1`.
- Neutral mediation: `SkillSupportRequest`, `skill-support-request-v1`.
- Owner result: `CaptionSoundSupportResult`,
  `caption-sound-support-result-v1`.
- Caption admission: `CaptionSoundAdmission`,
  `caption-sound-admission-v1`.
- Caption parsers are in
  `server/captions-specialist/caption-sound-support.ts`.
- Remaining integration: authenticated SoundSync result persistence,
  reread, injection, dialogue-protected mix QA, and private evidence.

### B-roll owner

- Caption read target: `CaptionBrollOwnerReadBinding`,
  `caption-broll-owner-read-binding-v1`.
- Caption parser: `parseCaptionBrollOwnerReadBinding` in
  `server/captions-specialist/caption-multi-track-scene-graph.ts`.
- Remaining public owner gap: the B-roll owner's versioned authenticated
  request/result adapter that supplies selected media-manifest, occupancy,
  crop/timing, and visible-text evidence refs. Caption remains a consumer and
  does not select, crop, time, fetch, or mutate B-roll media.

## Exact 12-job map

| Caption job | Required shared owner evidence |
| --- | --- |
| `plan_caption_blocking_preview` | Visual Intelligence |
| `resolve_multi_track_caption_scene` | canonical transcript |
| `resolve_spatial_typography` | canonical transcript + Visual Intelligence |
| `resolve_subject_occluded_typography` | Track All |
| `resolve_front_of_subject_typography` | Track All |
| `resolve_object_anchored_typography` | Track All |
| `resolve_environmental_typography` | Track All |
| `provide_typographic_transition_support` | SoundSync |
| `prepare_caption_boundary_timing_requirements` | SoundSync |
| `provide_caption_safe_region_constraints` | Track All + Visual Intelligence |
| `provide_typographic_transition_component` | SoundSync |
| `provide_caption_broll_composition_constraints` | B-roll owner |

Each job remains fail-closed with
`caption_fail_closed_without_required_integration`. An authenticated owner
result must match the exact tenant, approved snapshot, output frame, scene,
timing, support request, and original-call replay lineage before Caption may
re-evaluate that job.

## Backend connection rule

The backend workflow may import the public types and consume the named Caption
parsers. It must own authentication, owner dispatch, persistence, exact reread,
artifact injection, and same-call resume. It must not copy a Caption server
implementation, fabricate browser-local completion, build a Caption-specific
peer dispatcher, or reinterpret a shared owner's result.

The shared owner result does not replace deterministic Caption QA, direct
visual inspection when media exists, complete-time qualified visual review, or
independent final QA/private review.

When one Caption job requires more than one owner, the internal harness proves
sequential mediation rather than treating parallel peer calls as an implicit
Orchestra. The first injected test artifact becomes a reread input to the next
bounded call; only the currently approved support artifact is injected on each
resume. The exact immediate call and support-request lineage is retained at
every step. Real authenticated status still requires the shared owner and
backend persistence/reread evidence. This is test-only coordination and grants
no scheduling or dispatch authority to Caption.

## Authority boundary

No provider/model, operation/runtime, asset, final-QA approval, billing,
public-delivery, production, central-Orchestra, or direct-peer-dispatch
authority is granted by this handoff.
