# Project Edit Brief Marker Status Model

Markers can be `draft`, `needs_clarification`, `needs_asset`, `confirmed`, `ready_for_plan`, `conflict`, `applied_to_plan`, `changed_after_plan`, or `archived`.

Marker priority is `must_follow`, `should_follow`, `optional`, or `avoid`. Future planning should preserve the RP-EDITBRIEF-01 priority order: safety and do-not-copy policy first, confirmed Edit Brief markers second, main Edit Chat instructions third, Edit Preference and Preference DNA fourth, Auto Professional suggestions fifth, and default style last.

Marker AI mode is metadata only: `off`, `confirm_only`, `ask_clarifying_questions`, or `suggest_options`. No model call, Qwen call, DeepSeek call, worker job, planner execution, render job, or credit effect is authorized by this type surface.

QA status is local fixture metadata: `not_checked`, `passed`, `warning`, `needs_clarification`, `needs_asset`, `conflict`, or `blocked`.

Owner decisions pending: exact UI labels, default AI mode, and review policy for conflict and needs-asset markers.

Boundary: Edit Brief is optional inside `ProjectEditSession`; each Marker stays mock/local; there is no repository, no API handler, and no Supabase command.
