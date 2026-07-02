# Project Edit Brief Marker Plan Instructions

RP-EDITBRIEF-11 maps marker intent into mock planner instruction kinds:

- `add_broll` -> `broll_insert`
- `remove_or_cut` -> `cut_or_remove`
- `keep_or_emphasize` -> `keep_or_emphasize`
- `add_caption_or_text` -> `caption_or_text`
- `add_graphic_or_ui_card` -> `graphic_or_card`
- `add_music_or_soundtrack` -> `music_or_soundtrack_hint`
- `add_sfx` -> `sfx_hint`
- `add_voiceover` -> `voiceover_hint`
- `add_transition` -> `transition_hint`
- `adjust_speed_or_pacing` -> `pacing_adjustment`
- `adjust_color_or_tone` -> `color_tone_adjustment`
- `avoid_or_do_not_use` -> `restriction`
- `general_instruction` -> `general_note`

Music, SFX, and voiceover instructions are metadata-only hints. They explicitly carry no real planner, no sound runtime, no provider, no worker, and no render boundary text.
