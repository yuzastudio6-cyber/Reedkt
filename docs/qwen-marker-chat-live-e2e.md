# Qwen Marker Chat Live E2E

The live Marker Chat path is:

`Marker Chat browser UI -> Express beta route -> auth/workspace/runtime gates -> Secret Manager -> Qwen provider transport -> structured validation -> marker assistant message -> marker intent -> confirmation or clarification -> marker status refresh`.

The browser uses the live server route only when configured with non-secret live flags. Otherwise it uses the browser-safe deterministic mock client.

The server route handles existing `project.editBrief.markerMessages.append` semantics without adding a new route ID. Marker Chat remains marker-scoped and does not create main Edit Chat messages, edit plans, render jobs, workers, media jobs, or credit records.

`tests/e2e/project-edit-brief-marker-chat-live.spec.ts` is opt-in and requires a running beta API server plus live Qwen configuration.
