# Project Edit Brief Internal Testing Runbook

Edit Brief is optional. Chat remains the default planning surface. Marker Chat is marker-scoped. Attachments are metadata-only. Plan hints are not execution. Production ready: false. Owner approval pending. No migration or Supabase command.

## Active Named-Edit Runbook

1. Run `npm run dev:internal-testing:local-upload`.
2. Open `/sign-in` and sign in with a browser-local internal-testing session. This runner-only mock sign-in does not call Supabase or create backend auth records.
3. Open Projects, create a project, choose `New video edit`, and name the edit.
4. Select a local source video and verify the backend-local source upload reaches canonical bucket/object metadata with no public or signed URL.
5. Confirm the active named-edit route shows the exact source in uploaded order.
6. Complete required setup and prepare the source before opening the inline Brief.
7. Open the Brief view, expand the direction section, enter a goal, and mark the Brief ready.
8. Before leaving the Brief, verify the durable Edit Brief authority reports `saved`. Returning to Chat before that response completes is not valid persistence evidence.
9. Return to Chat and create the edit plan.
10. Verify canonical plan publication reaches the waiting-for-approval state and displays the credit estimate.
11. Approve separately and verify an approved snapshot is available. Approval must not start provider, worker, render, or export work.
12. Reload the named edit and verify the exact uploaded source checksum and private storage identity are preserved.
13. Confirm no provider call, public delivery, signed URL, or production state appears.

The one-command automated check is:

```bash
npm run test:internal-testing:local-upload-e2e
```

## Optional Brief-Surface Checks

1. Add `RP12 E2E marker`, edit it, and confirm it.
2. Send a Marker Chat message and verify structured intent remains in the marker drawer.
3. Run Analyze Visual Context and verify a structured summary or explicit Qwen2.5-VL fallback.
4. Confirm raw frames are not sent to Qwen 3.7 Max prompts. Qwen 3.7 Max remains the main-brain identity for text reasoning, not raw-video processing.
5. Add a metadata-only B-roll attachment and confirm executable upload controls remain disabled.
6. Review and save Export Settings as mock metadata.
7. Run Brief QA and inspect findings/conflicts.
8. Prepare Brief Plan Hints and inspect included/skipped counts plus the application log.

## Separate Private-Review Evidence

Run the existing backend private-review/render smoke separately:

```bash
npm run smoke:editor-full-stack-private-review
```

This is not proof that the active named-edit browser journey dispatched work. The shared canonical work/asset/runtime bridge remains required before browser approval can reach private rendering.

## Expected Outcome

The active flow proves browser-local authentication, explicit backend-local source upload, durable Edit Brief authority, canonical plan publication, separate approval, approved-snapshot evidence, and exact source reload. It does not enable automatic upload, prompt-time raw-frame persistence, provider calls, public delivery, signed URLs, Supabase CLI, migrations, DeepSeek, external beta/production, or Qwen 3.7 Max visual processing.
