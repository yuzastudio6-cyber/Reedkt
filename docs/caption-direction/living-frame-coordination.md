# Living Frame Coordination

The `captions` and Living Frame specialists are separate owners.

- Captions owns speech-derived typography, transcript lineage, caption mode, and caption motion through its internal `caption_design` composite.
- Living Frame owns visual explanation, controlled illustration/scene components, visual continuity, and its renderer/tool chain.
- StoryTiming owns final frames.
- Shared layout/depth owners coordinate occupancy, masks, and camera.

## Coordination contract

The frozen `caption-direction-living-frame-request-v1` and
`living-frame-caption-direction-response-v1` DTOs remain the compatibility
payload. A future neutral `SkillSupportRequest` carries that byte-free payload
and its digest lineage. CAP-11 is not a peer-dispatch or execution contract.

CAP-12 also exposes the separately versioned
`caption-direction-living-frame-request-v2` and
`living-frame-caption-direction-response-v2` domain-ref lane. The
`caption-direction-living-frame-v1-v2-compatibility-binding-v1` adapter pairs
complete V1 and V2 payloads and verifies their shared lineage without casting,
relabeling, or filling version-specific fields. One V1 request may still bind
multiple selected Living Frame scenes.

A handoff contains:

- source phrase and word IDs;
- source/target owner;
- semantic intent and continuity token;
- requested StoryTiming frame/anchor relationship;
- caption exit/transform behavior;
- target visual component request;
- shared occupancy/depth/mask requirements;
- sound cue intent;
- camera relationship;
- complete accessible wording;
- failure and reversion behavior.

## Attention and density

Both systems publish attention states and occupancy requirements. The planner rejects simultaneous excessive caption, Living Frame, B-roll, transition, and camera motion. A visual explanation should replace—not duplicate indefinitely—the caption concept when the handoff succeeds.

## Failure behavior

If the Living Frame asset is unavailable or fails QA:

1. preserve the accessible caption projection;
2. revert the creative phrase to an approved stable/hero treatment if allowed;
3. update StoryTiming and sound dependencies;
4. require review if the visual was structurally necessary.

Caption Direction must not create an untracked Living Frame asset as a fallback.

Illustrated-character animation and mechanical rigging are paused. Caption
coordination is limited to admitted non-character Living Frame modes while that
pause is active.
