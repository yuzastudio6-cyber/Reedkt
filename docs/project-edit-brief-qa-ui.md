# Project Edit Brief QA UI

The RP-EDITBRIEF-10 UI adds a Brief QA summary card, Run QA Check button, selected-marker QA panel, conflict list, conflict cards, QA badges, and mock/local boundary copy inside the existing Brief workspace and marker drawer.

The UI uses browser-safe Project Edit Brief client helpers only. It does not import backend repositories, route handlers, MockDatabase, Supabase clients, provider SDKs, worker code, media tools, or `ChatNativeEditor`.

The UI may save mock conflict records and marker QA statuses through existing mock routes. It does not auto-fix marker instructions, apply markers to plans, start progress, render, export, reserve credits, call Qwen, call DeepSeek, call providers, run workers, process media, fetch URLs, read file bytes, or run a Supabase command.

owner review remains pending before RP-EDITBRIEF-11 can introduce planner application.

Marker QA boundary summary: mock/local, no Qwen, no DeepSeek, no providers, no workers, no render, no credits, no Supabase command, no planner application, owner review pending.
