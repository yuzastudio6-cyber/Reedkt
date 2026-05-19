# SFX Timing, Trim, And Hit Alignment

## Purpose

RP-SFX-06 adds mock-only timing, trim, and hit-alignment planning for the SoundSync SFX Director. It proves the workflow ReeditPro needs before real audio workers exist:

```text
prompt plan -> mock generated asset -> duration plan -> waveform analysis -> transient detection -> trim plan -> hit alignment -> frame placement -> timing validation -> mix planning
```

This does not process real audio, call Mirelo, call MMAudio, connect to Supabase, run migrations, deploy Google Cloud, upload files, render media, or build UI.

## Generate Longer Than Needed

Generated SFX should not be placed directly into the edit. ReeditPro plans extra duration so later workers can choose the best clean region:

| Final need | Mock generated duration |
| --- | --- |
| 0.3-0.7 sec short hit/reveal/transition | 2.5 sec |
| 1-2 sec motion/title/object gesture | 4 sec |
| 3-5 sec ambient bridge/source repair | 7 sec |

The extra duration gives room for weak starts, late hits, messy tails, fades, and clean hit alignment.

## Hit Point Rule

The hit point is more important than the file start.

For a transition cut at `12.420s`, a generated `2.5s` whoosh might be trimmed from `0.78s` to `1.38s`, with the hit at `1.00s`. The final start becomes `12.200s`, so the hit lands exactly on `12.420s`.

## Mock Waveform And Transient Analysis

RP-SFX-06 uses deterministic mock metadata:

- `whoosh_rise_hit_tail` for transition whooshes.
- `draw_texture` for Stroke Motion line drawing.
- `single_hit` for title/chapter/montage/stroke completion accents.
- `soft_pop` for Graphic Design and CTA reveals.
- `object_movement` for Real Motion movement and settle sounds.
- `ambient_swell` for ambient bridges with no sharp transient.

No waveform samples are read. The analysis only creates planned trim/hit metadata for later real workers.

## Trim Planning

Trim planning chooses a clean window, preserves the hit, and applies fades:

- short hit: `10-20ms` fade in, `60-120ms` fade out
- whoosh: `20-60ms` fade in, `100-250ms` fade out
- ambient bridge: `300-800ms` fade in/out
- stroke draw: `20-50ms` fade in, `80-180ms` fade out

The trim plan marks manual review when the clean region is uncertain, too short, outside the generated duration, or has an invalid hit offset.

## Anchor Alignment

Timing alignment converts trim metadata into timeline placement:

```text
start_time = anchor_time - hit_offset_inside_trim
end_time = start_time + trimmed_duration
```

Cut, title, chapter, graphic, CTA, montage, and Real Motion settle sounds align their hit to the anchor. Stroke Motion start sounds align texture start to the stroke path. Ambient bridges can align a clean region across the transition without a sharp hit.

## Frame Placement

The mock placement layer supports `24fps`, `25fps`, `30fps`, and `60fps`, defaulting to `30fps`. Frame-accurate or beat-aligned SFX are snapped to frame boundaries. Later StoryTiming and MasterTiming workers should provide the authoritative frame base.

## Validation

Timing validation catches:

- missing anchor
- hit late or early
- tail too long
- pre-roll too short
- trim too short or too long
- bad hit offset
- placement not frame accurate
- speech overlap risk
- music beat mismatch
- manual review needed

Warnings are not final QA. They prepare RP-SFX-07 mix/ducking and RP-SFX-08 QA.

## RP-SFX-07 Handoff

RP-SFX-07 takes the generated asset metadata, trim plan, and timing alignment from this stage and creates voice-first mix planning metadata: volume profile, target gain hint, ducking, fades, EQ, stereo width, room/reverb match, and mix validation. It still does not process real audio.

## RP-SFX-08 QA Handoff

RP-SFX-08 checks the trim and timing metadata before preview/export. Late hits, early hits, bad trim windows, long tails, missing anchors, speech-overlap risk, and frame-accuracy problems can trigger `trim_again`, `use_with_mix_adjustment`, `regenerate`, or `remove_sfx` recommendations.

## RP-SFX-10 Chat UI Handoff

RP-SFX-10 shows timing and trim metadata in a compact chat card. The summary emphasizes that the hit point is more important than file start, while generated duration, trim window, hit offset, pre-roll, tail, fades, and validation warnings stay available in collapsed details.

## Examples

Transition whoosh:

```text
Anchor: cut at 12.420s
Generated: 2.5s
Trim: 0.78s-1.38s
Hit offset: 220ms
Final placement: start 12.200s, hit 12.420s, end 12.800s
```

Stroke Motion draw:

```text
Anchor: stroke starts at 8.200s
Generated: 3.0s
Trim: 0.39s-1.56s
Final placement: start 8.200s, texture follows the stroke path
```

Real Motion settle:

```text
Anchor: object settles at 15.600s
Generated: 2.5s
Trim: 0.90s-1.45s
Final placement: start 15.400s, hit 15.600s, end 15.950s
```

Ambient bridge:

```text
Anchor: transition begins at 22.000s
Generated: 8.0s
Trim: 1.12s-5.92s
Final placement: crossfade through transition, no sharp hit required
```

## Mock-Only Boundary

RP-SFX-06 creates local timing metadata only. RP-SFX-08 can QA that metadata but still does not inspect real audio. Real waveform analysis, transient detection, audio trimming, normalization, mixing, provider generation, storage, rendering, and export remain future worker milestones.
