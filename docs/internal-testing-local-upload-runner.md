# Internal Testing Local Upload Runner

This runner starts the private-workspace API and browser app for the safe, active named-edit source-video path.

```bash
npm run dev:internal-testing:local-upload
```

For a one-command verifier of the same path, run:

```bash
npm run test:internal-testing:local-upload-e2e
```

For the complete provider-free local path through canonical work execution,
private MP4 playback/download, and review acceptance, run:

```bash
npm run test:internal-testing:local-private-review-e2e
```

The private-review verifier requires a running Docker engine and may take
several minutes while it validates or builds the pinned Remotion image.

The verifier creates a tiny video-and-audio MP4 with local `ffmpeg` unless `REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH` names an existing MP4. It then:

1. signs in with the runner-only browser-local mock auth session;
2. creates a project and chooses `New video edit`;
3. creates an active named edit;
4. finalizes the source through the real local upload-intent API and rereads its exact private source authority;
5. publishes and separately approves a prompt-first canonical plan;
6. durably saves an inline Edit Brief before publishing and approving its canonical plan; and
7. reloads the named edit and proves the source checksum and private storage identity are preserved.

The private-review variant continues from the approved snapshot: it requests
the exact canonical execution package, runs only the server-derived work graph
through the confined local media runtimes, loads and downloads the no-store
private MP4, and records explicit review acceptance.

The runner shuts down both processes and removes its generated fixture and backend-local test artifacts when the verification completes.

Open:

- Sign in: `http://127.0.0.1:5179/sign-in`
- Projects: `http://127.0.0.1:5179/projects`
- Create a project: `http://127.0.0.1:5179/projects/new`
- API health: `http://127.0.0.1:9781/health`

Start at Sign in, enter any valid internal-testing email plus an 8-or-more-character password, and submit. In this runner only, `VITE_REEDITPRO_INTERNAL_TEST_AUTH=true` creates a browser-local mock auth session and opens `/internal-testing`. Continue to Projects, create a project, choose `New video edit`, name the edit, and upload the source on the active named-edit route.

## What It Enables

- Browser-local source selection and runner-only mock sign-in.
- Backend-local upload through upload-intent, local-object PUT, and finalize endpoints.
- Backend-local storage metadata with a private bucket/object identity and no public or signed URL.
- Exact private source readback and source-preparation evidence for the named edit.
- Prompt-first canonical plan publication followed by explicit approval and an approved snapshot.
- Durable Edit Brief persistence on the active named-edit route before plan publication.
- Reload proof for the source checksum, storage path, and private-artifact boundary.
- Reviewed `frontend_safe` browser transport to the private-workspace API.
- Local filesystem storage under `.reeditpro-local-upload-storage-dev`.

## What It Does Not Enable

The default runner does not start provider calls, live Qwen calls, external beta, production, public delivery, Supabase auth or data writes, GCS writes, Stripe, worker dispatch, private rendering, QA approval, or export. It proves the signed-in frontend-to-private-backend planning boundary through an approved snapshot.

Qwen 3.7 Max remains the named main-brain reasoning identity in the product architecture, but this runner does not call Qwen.

The opt-in private-review verifier adds only local, provider-free canonical
work execution and private review. It still does not authorize provider calls,
live Qwen, public delivery, external beta, production, billing, or customer
export.

The broader maximum-source and revision path retains its standalone backend
coverage:

```bash
npm run smoke:editor-full-stack-private-review
```

Plan publication and approval still never perform rendering automatically.
The browser must explicitly request the package and then start the approved
private edit.

## Optional Real-Video Acceptance

Use an existing MP4:

```bash
REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH="/absolute/path/to/video.mp4" \
npm run test:internal-testing:local-upload-e2e
```

The convenience wrapper defaults to `~/Documents/test video/internal testing.MP4`:

```bash
npm run test:internal-testing:real-video-upload-acceptance
```

## Optional Manual Playwright Check

In one terminal:

```bash
REEDITPRO_LOCAL_UPLOAD_STORAGE_ROOT=.reeditpro-local-upload-storage-playwright \
npm run dev:internal-testing:local-upload
```

In another terminal:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5179 \
PLAYWRIGHT_INTERNAL_TEST_AUTH=true \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_REAL_API=true \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL=http://127.0.0.1:9781 \
PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT=.reeditpro-local-upload-storage-playwright \
PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_FIXTURE_PATH="/absolute/path/to/video.mp4" \
npx playwright test \
  tests/e2e/project-source-video-backend-upload-local-api.spec.ts \
  tests/e2e/project-create-edit-upload-local-api.spec.ts
```

These specs use the real local API and do not intercept routes. Together they assert active project/edit creation, private upload finalization, exact source readback, prompt-first planning, durable inline Brief persistence, canonical plan publication, separate approval, approved-snapshot availability, source-authority reload, and the absence of provider, live-Qwen, public-delivery, Supabase, GCS, beta, production, and product-ready signals.
