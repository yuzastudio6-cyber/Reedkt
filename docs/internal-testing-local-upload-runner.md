# Internal Testing Local Upload Runner

This runner starts the browser app and the API together for the safe source-video Edit Brief test path.

```bash
npm run dev:internal-testing:local-upload
```

For a one-command verification of the same path, run:

```bash
npm run test:internal-testing:local-upload-e2e
```

The verifier starts the API and app, requires local `ffmpeg` for the tiny synthetic Playwright fixture, signs in through browser-local internal testing auth, uploads through the real local API upload-intent endpoints, saves the brief, approves the local test plan and credit estimate, runs the local preview smoke, records preview approval, runs the professional QA checkpoint, creates a private final export smoke artifact, verifies Qwen 3.7 Max is recorded as the reasoning identity without a live call, then shuts the stack down and removes local test artifacts.

Open:

- Sign in: `http://127.0.0.1:5179/sign-in`
- Projects: `http://127.0.0.1:5179/projects`
- Edit Brief source-video test: `http://127.0.0.1:5179/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`
- API health: `http://127.0.0.1:9781/health`

Start at the Sign-in route, enter any valid internal-testing email format plus an 8+ character password, and submit. In this runner only, `VITE_REEDITPRO_INTERNAL_TEST_AUTH=true` creates a browser-local mock auth session and opens `/internal-testing`. From there, open the Edit Brief route, select a source video, click `Upload for testing`, save the brief, click `Approve local test plan`, click `Run local edit preview`, click `Approve preview`, click `Run QA check`, then click `Create private export`.

## What It Enables

- Browser-local source video selection.
- Browser-local mock sign-in for repeated internal testing. It does not send credentials to Supabase or create backend auth records.
- Backend-local upload through the upload-intent, local-object PUT, and finalize endpoints.
- Backend-local storage metadata and canonical bucket/object metadata displayed in the Edit Brief UI.
- A visible local plan and credit estimate approval gate before preview smoke.
- A local edit preview smoke path that creates mock credit approval/reservation records, creates a mock approved snapshot, claims a local worker, and writes a canonical preview object when local media tools are available.
- Preview review, professional QA, and private final export smoke gates after the preview is explicitly approved.
- Mock auth for repeated internal testing.
- Local filesystem storage under `.reeditpro-local-upload-storage-dev`.

## What It Does Not Enable

The runner does not start provider calls, live Qwen calls, external beta, production, public delivery, Supabase auth writes, Supabase data writes, GCS writes, Stripe, or product-ready flows. The optional local edit preview smoke runs a preview-only local worker against backend-local test media after a mock approved snapshot and mock credit reservation exist; the private final export smoke runs only after explicit preview approval and QA, writes only backend-local private test storage, and does not create signed URLs or public delivery.

Qwen 3.7 Max remains the named main-brain reasoning identity in the Brief UI and diagnostics, but this local runner does not call Qwen. It proves the source video can move from browser selection to backend-local canonical upload metadata and then through gated preview, review, QA, and private export smoke for internal testing.

## Optional Real Local API Playwright Check

In one terminal, start the local stack:

```bash
REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT=.reeditpro-local-upload-storage-playwright npm run dev:internal-testing:local-upload
```

In another terminal, run:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5179 \
PLAYWRIGHT_INTERNAL_TEST_AUTH=true \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API=true \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL=http://127.0.0.1:9781 \
PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT=.reeditpro-local-upload-storage-playwright \
npx playwright test tests/e2e/project-source-video-backend-upload-local-api.spec.ts
```

The spec uses the real local API. It does not intercept upload, preview, review, QA, or private export routes. It asserts the source video reaches backend-local storage metadata, the local plan and credit estimate are approved before preview, the local preview reaches preview-ready metadata, preview review and QA pass, the private final export object is written to backend-local storage, and no provider, live Qwen, public delivery, Supabase, GCS, beta, production, or product-ready signal appears.
