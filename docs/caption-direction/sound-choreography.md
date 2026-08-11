# Sound Choreography

Caption sound is a late creative finish. It starts only after `CaptionMotionLock`.

```text
resolved caption motion
  -> caption sound opportunities
  -> CaptionSoundCuePlan
  -> SoundSync timing and mix
  -> dialogue-protected final mix
```

## Eligibility

Every motion event declares `sound_required`, `sound_optional`, or `sound_forbidden`.

Typical defaults:

- normal subtitle: silent;
- active-word color: silent;
- small phrase emphasis: usually silent;
- hero word: controlled impact when appropriate;
- brush reveal: restrained ink/brush texture;
- foreground depth move: subtle spatial cue;
- Caption-to-Visual handoff: designed transition cue;
- full-screen title: designed title sound;
- persistent list: silent or extremely restrained.

## Sound budget

The plan records primary cue, supporting cues, silent events, maximum cue density, narration-protection level, music relationship, SFX priority, frequency/space considerations, and lower-cost/silent alternative.

Narration is primary. Speech clarity outranks caption impact, beat sync, and decorative sound. A whoosh/pop per word is prohibited.

## Ownership

Caption Direction owns cue intent and eligibility. StoryTiming owns exact final frames. SoundSync owns asset selection/generation policy, trim, mix, ducking, loudness, and final audio QA. The asset manifest owns generated/selected sound artifacts.

## Invalidation

Motion-frame, renderer-duration, cue-eligibility, dialogue, music, or transition changes stale the relevant sound plan. Caption sound repair should be local unless the correction changes approved creative scope or cost.
