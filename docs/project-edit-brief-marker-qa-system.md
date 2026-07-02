# Project Edit Brief Marker QA System

RP-EDITBRIEF-10 adds Marker QA as a mock/local deterministic safety and readiness check for Edit Brief markers. Marker QA reviews marker notes, structured intent, metadata-only attachments, neighboring markers, and session-level Export Settings to decide whether a marker is clear, safe, complete, conflicting, or blocked before a future planner bridge can use it.

Marker QA is not execution. There is no Qwen call, no DeepSeek call, no providers, no embeddings, no vector DB, no workers, no render, no export, no credits, no file bytes, no URL fetch, no media processing, no Supabase command, and no planner application.

The planner priority reminder stays active: safety and do-not-copy policy outrank confirmed Edit Brief markers, then main Edit Chat instructions, Edit Preference / Preference DNA, Auto Professional suggestions, and default editing style.

owner review remains pending before RP-EDITBRIEF-11 applies QA-passed markers to any edit plan.

Marker QA boundary summary: mock/local, no Qwen, no DeepSeek, no providers, no workers, no render, no credits, no Supabase command, no planner application, owner review pending.
