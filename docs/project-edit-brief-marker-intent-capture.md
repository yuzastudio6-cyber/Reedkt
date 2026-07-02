# Project Edit Brief Marker Intent Capture

Marker Chat intent capture is deterministic, mock/local, and keyword-based.

Examples:
- `b-roll`, `clip`, or `cutaway` maps to `add_broll`.
- `caption`, `subtitle`, or `text` maps to `add_caption_or_text`.
- `music` maps to `add_music_or_soundtrack`.
- `sfx` or `whoosh` maps to `add_sfx`.
- `cut`, `remove`, or `take out` maps to `remove_or_cut`.
- vague messages map to `general_instruction` with low confidence.

B-roll without a provided/attached asset becomes `needs_asset`. Vague instructions in `ask_clarifying_questions` mode become `needs_clarification`.

The intent is planning metadata only. It never authorizes rendering, media processing, source copying, provider calls, or planner application.

Boundary: no Qwen, no provider, and no Supabase behavior is introduced by Marker Chat intent capture.
