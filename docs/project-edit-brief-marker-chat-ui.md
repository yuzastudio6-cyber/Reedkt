# Project Edit Brief Marker Chat UI

The marker drawer now shows:
- marker-scoped message list;
- mock/local boundary notice;
- message input;
- structured intent summary;
- confirmation summary;
- compact AI mode label.

The UI imports only browser-safe Project Edit Brief client and adapter helpers. It does not import backend repositories, route handlers, `MockDatabase`, Supabase code, provider SDKs, worker code, or media tools.

Successful sends refresh the selected marker drawer, selected marker detail, marker counts/status, and the Brief status banner. They do not pollute the main Edit Chat.

Boundary: the default Marker Chat UI uses deterministic local fallback and makes no Qwen call, no provider call, and no Supabase behavior. Live Qwen beta can be used only through the backend route when `doctor:qwen-beta` passes; frontend code never receives provider secrets or raw provider payloads.
