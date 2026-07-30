# Living Frame Coordination

Caption Direction and Living Frame are separate parent creative skills.

- Caption Direction owns speech-derived typography, transcript lineage, caption mode, and caption motion.
- Living Frame owns visual explanation, controlled illustration/scene components, visual continuity, and its renderer/tool chain.
- StoryTiming owns final frames.
- Shared layout/depth owners coordinate occupancy, masks, and camera.

## Coordination contract

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
