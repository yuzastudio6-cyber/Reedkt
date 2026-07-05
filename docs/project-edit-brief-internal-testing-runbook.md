# Project Edit Brief Internal Testing Runbook

Edit Brief is optional. Chat remains default. Marker Chat is marker-scoped. Attachments are metadata-only. Plan hints are not execution. Production ready: false. Owner approval pending. No migration. No Supabase command.

## Runbook

1. Open `/projects/mock-project-edit-chat-foundation`.
2. Select `Founder Story YouTube Cut` and open Edit Chat.
3. Open the Brief tab.
4. Confirm the mock video/timeline shell and boundary copy.
5. Add `RP12 E2E marker`, edit it, and confirm it.
6. Send a Marker Chat message and verify structured intent appears in the marker drawer only.
7. Select a local source video, open a saved marker, run Analyze Visual Context, and verify a structured visual summary or explicit Qwen2.5-VL fallback appears.
8. Confirm Marker Chat shows visual context available or fallback-used without sending raw frames to Qwen 3.7 Max prompts.
9. Add a metadata-only B-roll attachment and confirm upload controls stay disabled.
10. Review and save Export Settings as mock metadata.
11. Run Brief QA and inspect findings/conflicts.
12. Prepare Brief Plan Hints and inspect included/skipped counts plus application log.
13. Return to Chat and confirm no progress/render/export/provider/credit UI appears.

## Expected Outcome

The flow proves internal testing coverage for the optional Edit Brief layer while preserving all mock/local boundaries.

Visual Context beta testing must preserve: no full-video upload, no raw frame persistence, no backend file-byte read, no media tools/workers, no render/export, no credits, no Supabase CLI, no migrations, no DeepSeek, and no Qwen 3.7 Max visual processing.
