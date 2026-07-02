# Project Edit Brief Marker AI Mode Policy

Marker AI mode remains mock/local metadata in RP-EDITBRIEF-07.

Modes:
- `off`: save marker-scoped user message, extract/save intent, no assistant response.
- `confirm_only`: save user message, extract/save intent, append deterministic confirmation response, and save confirmation when clear.
- `ask_clarifying_questions`: append deterministic clarification when the message is vague or missing required detail.
- `suggest_options`: append deterministic option suggestions and keep the marker in draft unless explicitly confirmed.

Safe marker status updates are limited to `draft`, `needs_asset`, `needs_clarification`, and `confirmed`.

Marker Chat cannot set `ready_for_plan`, `applied_to_plan`, or `changed_after_plan`.

Boundary: no Qwen, no provider, and no Supabase behavior is introduced by Marker Chat AI modes.
