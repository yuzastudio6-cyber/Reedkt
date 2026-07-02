# Project Edit Brief Marker Intent Contract

Marker Chat stores raw scoped conversation for one Marker. Structured marker intent stores the local/mock interpretation that a future planner may use after repository, API, and owner-review milestones.

The intent contract includes action, status, time range, visual behavior, audio behavior, caption behavior, asset requirements, provided metadata-only assets, priority, confidence, blocking needs, do-not-copy notes, and planner hints.

Raw chat and structured intent stay separate so future clarification can be audited. A marker note may remain ambiguous while intent is `needs_clarification`; a marker may request an asset while intent is `needs_asset`; a conflict may block planner use until owner review.

This contract does not run Qwen, DeepSeek, provider calls, workers, media analysis, planning, rendering, uploads, Supabase, or credits.

Boundary: Edit Brief is optional inside `ProjectEditSession`; each Marker stays mock/local; there is no repository, no API handler, and no Supabase command.
