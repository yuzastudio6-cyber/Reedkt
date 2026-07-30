# Motion Grammar

## Typed primitives

Caption motion is described with allowlisted typed primitives such as reveal, fade, scale, slide, wipe, tracked movement, depth transition, emphasis pulse, brush reveal, list append, hero expansion, and handoff morph. Each primitive carries exact frame ranges, easing, travel, overshoot, stagger, opacity/transform values, interruption behavior, and reduced-motion replacement.

Models may select or parameterize allowed primitives through structured proposals. They never emit executable Remotion or browser code.

## Semantic rules

- Motion follows meaning and speech, not random beats.
- Normal subtitles are stable and restrained.
- Active-word color usually needs no physical motion.
- Hero motion is scarce and justified by narrative importance.
- Repetition limits prevent every phrase from using the same entrance.
- Camera, caption, B-roll, Living Frame, and transition motion share an attention budget.
- Caption-to-Visual transformations preserve semantic continuity and typed ownership handoff.

## StoryTiming

Caption Direction proposes phrase grouping, emphasis, motion intent, and handoffs. StoryTiming resolves `caption_on`, `caption_off`, emphasis, phrase/word motion, hero hits, depth transitions, handoffs, sound-hit frames, and cut/transition relationships.

Effective stable reading duration is:

```text
total_cue_duration
- unstable_entry_frames
- unstable_exit_frames
- frames_where_text_is_not_sufficiently_readable
```

QA uses effective stable duration, not merely cue duration. Occlusion, blur, extreme transform, low contrast, and rapid motion may subtract readable frames.

## Reduced motion

Every motion primitive has a deterministic reduced-motion substitution that preserves meaning, order, and stable reading time. Reduced motion does not mean loss of accessible content or hierarchy.

## Motion lock

`CaptionMotionLock` freezes scene graph version, StoryTiming references, renderer spec, and effective-read calculations before sound cue planning. Any later caption-motion change invalidates linked sound plans and mixes.
