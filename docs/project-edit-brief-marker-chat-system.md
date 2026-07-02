# Project Edit Brief Marker Chat System

RP-EDITBRIEF-07 adds mock/local Marker Chat inside an existing Edit Brief marker drawer.

Marker Chat is scoped to one `ProjectEditBriefMarker`. It saves marker messages through the existing marker message route, extracts deterministic structured intent, and can append a mock assistant response or confirmation based on the marker AI mode.

Boundaries:
- no Qwen or DeepSeek call;
- no provider/model call;
- no planner execution;
- no upload, file-byte read, signed URL, external URL fetch, or media processing;
- no Supabase command, migration, remote read, or remote write;
- no worker, render, progress, credit, staging, commit, cleanup, or `ChatNativeEditor` change.

Main Edit Chat remains separate. RP-EDITBRIEF-07 does not create `ProjectEditSessionMessageRecord` rows for Marker Chat turns.

## RP-QWEN-BETA-01 Update

## RP-QWEN-BETA-02 Update

Marker Chat can request Qwen 3.7 only through the backend Express beta route. Browser code never imports provider runtime or Secret Manager modules. The UI may show “Qwen 3.7 understood this marker” for live validated responses or local fallback copy when Qwen is unavailable. Marker Chat remains marker-scoped and does not write to main Edit Chat, planner, render, media, worker, Supabase, or credit systems.

Marker Chat can now request the backend-only Qwen 3.7 beta bridge through the existing marker-message route. The default browser mock client remains deterministic. Beta output is marker-scoped, schema-validated, and fallback-safe. Production ready: false.
