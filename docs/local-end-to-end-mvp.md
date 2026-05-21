# Local End-To-End MVP

ReeditPro now has a browser-local MVP path that connects the existing mock-safe foundations into one usable flow.

## What Works Locally

1. Create a project from `/projects/new`.
2. Select local source files. ReeditPro creates upload plans and source clip metadata without uploading files.
3. Open the project in `/editor?projectId=...`.
4. Review and confirm source order.
5. Confirm output frame, cleanup preference, edit level, and visual preference.
6. Review the mock edit plan and credit estimate.
7. Approve the plan and credits.
8. The local MVP runs mock credit reservation, credit gate, job queue, worker lease, heartbeat, dispatch, completion, and preview-ready steps.

## Runtime Safety

- No file upload is attempted.
- No remote Supabase mutation is attempted.
- No provider API is called.
- No Stripe call is made.
- No Cloud Run, Pub/Sub, Supabase Edge Function, FFmpeg, Remotion, render worker, or real worker is started.
- Missing Supabase env values are safe; the app stays in local demo mode.

## State

Local MVP state is stored in browser `localStorage` and includes:

- demo user and workspace;
- local project records;
- source clip metadata and upload plans;
- approval gate status;
- mock credit reservation and runtime job events;
- preview-ready status.

## Remaining Production Work

The local MVP proves the product loop, but production still needs:

- Supabase local/staging validation and deployed migrations;
- Cloud Run deployment and request authentication;
- Secret Manager and backend service-role handlers;
- real storage upload/download routes or reviewed RLS;
- transactional credit ledger handlers;
- production worker lease persistence and cloud dispatch;
- real provider integrations;
- real rendering/export pipeline;
- Stripe checkout and webhooks.
