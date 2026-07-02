# Music + SFX Timing Integration

RP-TIMING-06 adds the mock SoundSync timing layer for StoryTiming. It connects existing music cue, music mix, SFX event, SFX trim, SFX alignment, and SFX mix records into the Master Timing Map without replacing those source records.

This milestone is local/demo-safe. It does not call Lyria, Mirelo, MMAudio, Supabase, real audio analysis, FFmpeg, Remotion, cloud workers, or provider APIs.

## Why Music And SFX Timing Matter

Music and SFX can make an edit feel intentional, but only when they support meaning. Speech clarity still wins in dialogue, teaching, faith, documentary, and business sections. Music rhythm can lead in montage, fitness, and other non-speech sections. SFX hits should land on a visual, cut, title, transition, or music beat cue, and tails should stay away from important speech.

## Music Cue Timing

Music cue sheet items become StoryTiming events:

- `music_cue_start`
- `music_cue_end`

Cue labels, roles, energy, ambience notes, and adaptation notes are preserved on the event metadata/notes. Cue starts, drops, resolves, and downbeats become StoryTiming anchors when useful for transition, title, montage, or outro timing.

## Mock Beat Grids

Beat grids are mock estimates. If scenario input supplies BPM, the mock grid uses it. Otherwise BPM is inferred from cue energy:

- low / medium-low: 80 BPM
- medium: 104 BPM
- medium-high / high: 128 BPM

Beat grids create beat/downbeat/drop/resolve anchors for montage and transition planning. They must never be described as real beat detection.

## Music Ducking Timing

Music ducking plans are created for speech segments when music/mix context requires voice-first timing. Default mock timing is:

- duck start: 300ms before speech
- release: 500ms after speech
- emotional/faith sections may use slightly longer protection

Ducking creates `music_duck_start` and `music_duck_end` events plus dependencies that require ducking before speech captions enter.

## SFX Timing

SFX timing prefers `SFXTimingAlignmentRecord` because it already contains start, hit, end, pre-roll, tail, and frame-accuracy intent. When alignment is missing, the mock layer falls back to `SFXEventPlanRecord` and emits warnings.

StoryTiming creates:

- `sfx_start`
- `sfx_hit`
- `sfx_end`
- `sfx_hit` anchors
- `sfx_tail` anchors

SFX events retain source refs back to SFX Director records.

## Dependencies

SoundSync dependencies connect:

- SFX hit to SFX/cut/transition anchors
- montage SFX hits to nearby music beat/downbeat anchors
- transitions to downbeats when speech/story meaning is already complete
- music duck start before speech/caption events

Dependencies are advisory unless speech clarity, frame-accurate SFX, or render safety requires them.

## Conflicts

The mock SoundSync conflict layer detects:

- music ducking starts too late or too early
- SFX hit late/early
- SFX tail over speech
- too many SFX hits in one moment
- ambience masked by dense music/SFX

Conflicts propose non-mutating resolutions. They do not change source music, SFX, caption, cut, or timing records.

## QA

SoundSync timing QA produces checks for:

- music beat alignment
- music ducking timing
- SFX hit alignment
- SFX tail safety
- music/SFX density
- ambience preservation timing
- overall rhythm

These checks are focused on RP-TIMING-06. Full timing QA remains a later milestone.

## Examples

Lifestyle/vacation timing uses multiple cue changes, dialogue ducking, title hits, transition SFX, montage beat guidance, and ambience preservation for food/social scenes.

Dialogue timing keeps music under speech and uses subtle or no SFX.

Montage timing creates mock beat grids and can align cuts/SFX to downbeats when speech is absent.

Faith/serious timing keeps speech and emotional pauses ahead of music rhythm. SFX should be whisper-level or avoided.

## Mock-Only Limits

This layer does not detect real beats, analyze waveforms, process audio, generate audio, mix music, render media, or call providers. It creates deterministic StoryTiming records so future workers can execute approved SoundSync timing safely.
