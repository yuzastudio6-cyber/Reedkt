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
8. For backend-local upload testing, run `npm run dev:internal-testing:local-upload`, open the Brief route at the printed local URL, select a source video, click `Upload for testing`, and verify backend-local source upload status changes to uploaded with canonical bucket/object metadata.
9. For local edit preview testing, click `Run local edit preview` and verify the preview-only local edit smoke reaches preview-ready metadata after mock credit approval/reservation and approved-snapshot gates.
10. Confirm Marker Chat shows visual context available or fallback-used without sending raw frames to Qwen 3.7 Max prompts. Qwen 3.7 Max remains the main-brain reasoning identity for Brief planning/Marker Chat text reasoning, not raw video processing.
11. Add a metadata-only B-roll attachment and confirm upload controls stay disabled.
12. Review and save Export Settings as mock metadata.
13. Run Brief QA and inspect findings/conflicts.
14. Prepare Brief Plan Hints and inspect included/skipped counts plus application log.
15. Return to Chat and confirm no provider/final export/production UI appears.

## Expected Outcome

The flow proves internal testing coverage for the optional Edit Brief layer while preserving all mock/local boundaries.

Visual Context beta testing must preserve: browser-local preview, explicit backend-local source upload, and explicit local edit preview smoke are internal testing only; no automatic upload, no raw frame persistence, no provider calls, no final export, no Supabase CLI, no migrations, no DeepSeek, no external beta/production, and no Qwen 3.7 Max visual processing.
