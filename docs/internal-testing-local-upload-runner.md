# Internal Testing Local Upload Runner

This runner starts the browser app and the API together for the safe source-video Edit Brief test path.

```bash
npm run dev:internal-testing:local-upload
```

Open:

- Projects: `http://127.0.0.1:5179/projects`
- Edit Brief source-video test: `http://127.0.0.1:5179/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`
- API health: `http://127.0.0.1:9781/health`

On the Edit Brief route, select a source video and click `Upload for testing`.

## What It Enables

- Browser-local source video selection.
- Backend-local upload through the upload-intent, local-object PUT, and finalize endpoints.
- Backend-local storage metadata and canonical bucket/object metadata displayed in the Edit Brief UI.
- Mock auth for repeated internal testing.
- Local filesystem storage under `.reeditpro-local-upload-storage-dev`.

## What It Does Not Enable

The runner does not start media processing, workers, rendering, credits, external beta, or production. It does not write Supabase rows, create GCS objects, call providers, run Qwen, run tools, create signed URL source truth, or make the app product-ready.

Qwen 3.7 Max remains the named main-brain reasoning identity in the Brief UI and diagnostics, but this local upload runner does not call Qwen. It only proves the source video can move from browser selection to backend-local canonical upload metadata for internal testing.

## Optional Real Local API Playwright Check

In one terminal, start the local stack:

```bash
REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT=.reeditpro-local-upload-storage-playwright npm run dev:internal-testing:local-upload
```

In another terminal, run:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5179 \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API=true \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL=http://127.0.0.1:9781 \
PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT=.reeditpro-local-upload-storage-playwright \
npx playwright test tests/e2e/project-source-video-backend-upload-local-api.spec.ts
```

The spec uses the real local API. It does not intercept upload routes. It asserts the source video reaches backend-local storage metadata and that no media worker, render, provider, credit, beta, or production signal appears.
