# WeEditPro Real-Media Private Edit Canary

Status date: 2026-07-30
Verdict: `private_executable` for the reviewed single-host loopback boundary; not hosted, external-beta, or production ready

## 2026-07-30 full-source signed-in canary status

The stronger full-source acceptance run passed on 2026-07-30. It used the
complete 66-second source, the signed-in frontend, durable resumable upload,
saved named-edit chat, the reviewed Kimi K3-primary / GPT-5.6 Terra-fallback
route with pinned Google Secret Manager versions, explicit approval, canonical
execution, playable private review, exact revision and reapproval, acceptance,
and final download. No network interception replaced an edit-lifecycle route.

Full source authority:

| Field | Value |
| --- | --- |
| Local source | `/Users/macuser/Downloads/video.mp4` |
| Byte length | `8,617,624` |
| SHA-256 | `05ee6e2312447441080266dc880abf350694904e3e3860417b5d6b25b9e9823c` |
| Duration | `66.198685s` |
| Video | H.264, `720x1280`, `2997/125` fps, BT.709 |
| Audio | AAC, stereo, `44,100 Hz` |

Observed browser-to-backend status:

| Requirement | Status | Current evidence |
| --- | --- | --- |
| Signed-in frontend session | Pass | Local Supabase-authenticated Owner workspace is visible in the real app. |
| Project and named edit creation | Pass | Project and named edit were created through frontend-safe backend routes and recovered after reload. |
| Complete real-video upload | Pass | The full source completed durable resumable upload, server reread, SHA-256 binding, and FFprobe inspection. |
| Source order, output frame, cleanup and source preparation | Pass | Source order, `9:16`, balanced cleanup, and verified source preparation survived reload. |
| Internal capability policy / Edit Level UI | Pass | New-edit, setup, Saved Preferences, and Current Edit Preferences expose no Edit Level picker. The compatibility value remains backend-only while internal testing uses the full policy-allowed capability set. |
| Meaningful planning UI | Pass | The unavailable Edit Reference panel is omitted while its persistence authority is blocked; six visible Current Edit Preferences remain real planning inputs. The optional Edit Brief now opens the actual `66s` timeline and closes cleanly when returning to Chat instead of hanging on a placeholder. |
| User chat persistence | Pass | The exact professional direction is stored against the named edit and restored after reload. |
| Verified private AI assistant reply | Pass | The persisted chat exchange carried a completed, token-accounted runtime receipt for either the Kimi K3 primary route or only its reviewed eligible-failure Terra fallback. The credential came from pinned Google Secret Manager version 2, a real model call occurred, and no raw key entered the browser. |
| Structured plan, MasterTiming and estimate | Pass | The backend re-read the finalized source, chat direction, preferences and Edit Brief, then published plan v1 with a confirmed frame, frame-based timing, 24 work items and a visible maximum-credit estimate. |
| Explicit approval and canonical execution | Pass | The browser explicitly approved the exact plan and estimate before requesting the package. The first package completed 24/24 jobs in 24 delivery attempts with zero expired-claim recovery. |
| Playable private review | Pass | The browser loaded and downloaded a `133,886,913`-byte MP4 through the exact private media route. Content length, artifact SHA, assembly ID, manifest SHA and private/no-store response policy were independently checked. |
| Exact revision and reapproval | Pass | The exact replacement caption produced plan v2 with a new plan hash, fresh estimate and fresh approval. The old approval was not reused; the second package independently completed 24/24 jobs. |
| Accepted verified final download | Pass | The revised review was accepted, downloaded through the authenticated accepted-final route, and matched the revised-review SHA-256 and byte length exactly. |

Exact full-source canary evidence:

| Artifact | Byte length | SHA-256 |
| --- | ---: | --- |
| Uploaded source | `8,617,624` | `05ee6e2312447441080266dc880abf350694904e3e3860417b5d6b25b9e9823c` |
| Initial private review | `133,886,913` | `61e7e707963ec8281d6e0f31e5ccb61b7ba940b897678d3e52488b86b711ed75` |
| Revised private review | `133,949,990` | `6f310f23fa1c7a39c03dc16f5659061f9aaaf343544183b50a3879b2c691c4bd` |
| Accepted final download | `133,949,990` | `6f310f23fa1c7a39c03dc16f5659061f9aaaf343544183b50a3879b2c691c4bd` |

The initial and revised outputs both differ from the source and from each
other. Replacement plan v2 had plan hash
`0a0d9307c527e59c5e88015efe2f93447fef3d367e21766f34735f8beeb78539`.
The accepted final filename was:

```text
weeditpro-private-final-private_review_a3df789d6f00ca946df52b96568edecebe03b4b697912af8.mp4
```

The exact command and terminal result were:

```bash
REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH=/Users/macuser/Downloads/video.mp4 \
node scripts/dev/internal-testing-local-upload-e2e.mjs \
  --private-review --supabase-auth --kimi
```

```text
1 passed (59.0m)
Supabase-authenticated local private-review E2E verifier passed: sign-in,
project creation, named-edit creation, backend-local source finalization, plan
creation, approval, canonical package/work execution, private media load,
exact caption revision, fresh plan and reapproval, second private render,
review acceptance, and verified final download succeeded.
```

The prior detached full-source artifact remains diagnosis-only evidence and was
not used to satisfy the browser journey:

| Field | Value |
| --- | --- |
| Artifact | `cq12-v6-approved-voice-stream-copy-final.mp4` |
| Byte length | `134,678,516` |
| SHA-256 | `c2f029992b72d9901704815a19107ad858e6dc6c19472a0e619f725d55319a18` |
| Duration | `66.200000s` |
| Video | H.264, `2160x3840`, 30 fps, 1,986 frames, BT.709 |
| Audio | AAC, stereo, `48,000 Hz` |

This older artifact proves the voice-preserving full-source finalization
boundary could produce a structurally valid output. The successful browser
canary above now independently proves plan approval, execution, review,
revision, reapproval, acceptance and final download.

This is the first observed browser-to-backend WeEditPro canary in this checkout
that uses genuine talking-head media and completes the bounded edit lifecycle
through an exact revision, fresh reapproval, second render, accepted private
review, and verified final download. The full-source journey passed with local
Supabase authentication; earlier bounded genuine-media coverage passed in both
runner-isolated `local_test` and local Supabase-authenticated modes. This is not
evidence for hosted production authentication, large-object cloud upload,
distributed workers, customer billing, or public delivery.

## Earlier bounded genuine-media canary

The designated original media was:

| Field | Value |
| --- | --- |
| Local source | `/Users/macuser/Documents/test video/internal testing.MP4` |
| Byte length | `399,704,876` |
| SHA-256 | `a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0` |
| Duration | `65.632233s` |
| Video | HEVC, `1728x3072`, `30000/1001` fps |
| Audio | AAC, stereo, `48,000 Hz` |

The loopback raw-upload route intentionally caps request bodies at 16 MiB, so
the full 381 MiB original correctly receives HTTP 413. Raising that limit would
weaken the architecture: large media belongs on the signed/resumable object
storage path. For this single-host canary, FFmpeg-derived genuine media from the
same original was used:

| Field | Value |
| --- | --- |
| Canary source | `/tmp/weeditpro-real-media-canary.mp4` |
| Byte length | `1,011,540` |
| SHA-256 | `de153521a1a592453efa8ad67f10eb8febcb506f740f1e4b9654ccad2b3fd67a` |
| Duration | `6.006000s` |
| Video | H.264, `540x960`, `30000/1001` fps |
| Audio | AAC, stereo, `48,000 Hz` |
| Content | Genuine person/talking-head excerpt; visually inspected before execution |

This excerpt is not a generated color-bar or `lavfi` fixture. It exists only to
exercise the bounded local upload transport with genuine source pixels and
audio while the large-object hosted path remains unconfigured.

### Executed commands

```bash
REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH=/tmp/weeditpro-real-media-canary.mp4 \
npm run test:internal-testing:local-private-review-e2e

REEDITPRO_INTERNAL_TESTING_REAL_VIDEO_PATH=/tmp/weeditpro-real-media-canary.mp4 \
npm run test:internal-testing:supabase-auth-local-private-review-e2e
```

Final run results:

```text
local_test:          1 passed (2.5m)
local Supabase auth: 1 passed (2.7m)
```

Neither browser test used network interception for the edit lifecycle. Each
started the reviewed loopback private-workspace API and active React app, then
called the actual frontend-safe routes. The Supabase-authenticated run used the
canonical local Supabase stack and real signed-in workspace membership rather
than the `local_test` identity shortcut.

## Observed full-source lifecycle

The final run proved all of the following in one browser journey:

1. local Supabase-authenticated browser session with RLS workspace membership;
2. project and named edit creation;
3. real MP4 upload intent, private byte storage, FFprobe inspection,
   finalization, SHA-256 authority, and source readback;
4. source-only Current Edit Preferences;
5. confirmed source order, output frame, cleanup policy, and Edit Brief marker;
6. server-derived canonical plan, confirmed frame, frame-based MasterTiming,
   visible credit estimate, and explicit approval;
7. immutable approved snapshot and separate execution-package request;
8. server-owned 24-job work graph and confined private media execution, with
   24/24 single-attempt completions and zero expired-claim recovery;
9. playable/downloadable first private review;
10. exact caption replacement saved as the private-review decision;
11. server reread of the prior snapshot, source, locked preferences, immutable
    Edit Brief, and revision intent;
12. plan v2 with a fresh estimate and no reuse of plan-v1 approval;
13. explicit reapproval, a fresh second 24-job package, second canonical
    execution, and second private review;
14. explicit acceptance of the revised private review;
15. authenticated accepted-final download whose bytes match the accepted
    revised review exactly; and
16. reload recovery of the accepted private-review state.

The browser supplied neither plan, timing, estimate, work graph, tool list,
artifact path, nor final-download path. Those identities were derived or
reread by the backend.

## Earlier bounded byte evidence

| Artifact | Byte length | SHA-256 |
| --- | ---: | --- |
| Uploaded canary source | `1,011,540` | `de153521a1a592453efa8ad67f10eb8febcb506f740f1e4b9654ccad2b3fd67a` |
| Initial private review | `15,974,800` | `a4b6c4bc37cfb368c32a783c81155d5a36beaffa26d1335160c35952b877c9ff` |
| Revised private review | `16,086,969` | `81b3701953248c697c23317306ec8dbad82a3ad20128f8f867d233a85d5f83a0` |
| Accepted final download | `16,086,969` | `81b3701953248c697c23317306ec8dbad82a3ad20128f8f867d233a85d5f83a0` |

The initial and revised outputs both differ from the uploaded source. The
revised output differs from the initial output. The accepted-final bytes equal
the accepted revised-review bytes. The final browser filenames from the two
last successful runs were:

```text
local_test:
weeditpro-private-final-private_review_011b19f07c359a94821dd05ab36a6df61b4ce45a5809244d.mp4

local Supabase auth:
weeditpro-private-final-private_review_7ffc8b4c6feb321063f9100d03dcf9cf6dd026ac2488e703.mp4
```

Both earlier replacement plans were version 2. The last `local_test` plan hash was
`0eb93543801f34ab3efe7f3505a3472a76dbededd4cbfb310d612c3cf5e7cc7f`.
The last local Supabase-authenticated plan hash was
`e41a6eb692e6d044d8ec8407cdfb1f1d69fff32cfa9c06c86110514eebea958b`.
Run IDs differ by design.

## Defects found and fixed

### Exact-preference reread identity

The first exact-revision attempt correctly failed closed after persisting plan
v2. The revision coordinator compared `authorityReceiptHash` across two
legitimate preference rereads. That receipt includes `readAt`, so it must
change even when the underlying locked preference state is immutable.

The coordinator now compares a semantic authority-state digest that excludes
only the per-read receipt ID and observation timestamp. Focused regression
coverage proves:

- two rereads of unchanged locked preference state have the same semantic
  state digest; and
- a real preference-authority change produces a different state digest.

The client never received a successful revision receipt while this backend
check failed, so approval remained disabled. No browser fail-open was added.

### Durable Edit Brief synchronization and local idempotency

The first strengthened local Supabase-authenticated run correctly failed with
HTTP 409 `VERSION_CONFLICT`. The browser-local ready state was trying to create
the backend Edit Brief before the canonical Brief and confirmed marker state
had reached `saved` and `ready`. The UI now schedules the server synchronization
only after both canonical gates are true, and the browser canary explicitly
waits for the successful local Brief POST before continuing.

The exact local Brief POST is also now the only new route in the explicit
nonproduction Supabase internal-test idempotency allowlist. Regression coverage
proves an unlisted local write and the same Brief route in production remain
blocked with `IDEMPOTENCY_ATOMICITY_REQUIRED`. The successful
Supabase-authenticated real-media rerun produced no Brief conflict and no
idempotency warning.

### Current Kimi K3 request contract

The source-led chat adapter was reread against the
[current official Kimi K3 quickstart](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart)
before retrying the changed Secret Manager credential. The exact
endpoint remains `https://api.moonshot.ai/v1/chat/completions`, the model is
`kimi-k3`, `reasoning_effort` is `low`, and strict `json_schema` output is
supported. K3 performs context caching automatically, so the adapter no longer
sends an extra `prompt_cache_key`. Previous user/assistant exchanges are
provided as server-controlled context inside the current user message rather
than replayed as incomplete K3 assistant messages. The focused adapter smoke
proves the request shape, pinned secret version, fail-closed credential path,
single credential read, provider/model evidence, and response safety checks.

### Verified chat retry identity

The first browser implementation told the user to retry a failed AI response,
but a retry used a new client-message identity and appended a second exchange.
The original failed exchange would therefore remain in the planning authority
and block plan creation even after a later response succeeded.

The server now recognizes an explicit same-direction retry only when the latest
saved exchange is still waiting for a verified AI response. It reruns the
private assistant attempt, replaces that exchange in place, preserves the
original user-message identity and timestamp, records the new attempt digest,
and keeps the thread revision unchanged because the creative instruction did
not change. Ordinary idempotent request replay still makes no second model
call. Route-level regression evidence proves unavailable credential → verified
retry → plan → approval → private execution → exact revision → reapproval →
accepted final download. The full-source signed-in rerun then completed through
that same verified private-assistant boundary with pinned Secret Manager
version 2.

### Private-review capacity convergence

The canonical assembly service already bounded a private review at 256 MiB,
but the preparation parser, playback client and immutable history schema still
rejected anything above 32 MiB. The real 66-second review therefore existed and
was valid but could not be presented by the browser.

One shared
`REEDITPRO_CANONICAL_PRIVATE_REVIEW_MAX_BYTES` constant now binds all four
boundaries to the same 256 MiB ceiling. SHA-256, exact `Content-Length`,
assembly/manifest lineage and private/no-store response requirements remain
mandatory. Focused tests accept a valid artifact above 32 MiB and reject
ceiling-plus-one. The final full-source canary loaded reviews of 133,886,913 and
133,949,990 bytes.

### Replacement-plan response and presentation lineage

The first full-source revision reached a valid backend plan v2, but the
frontend strict parser still expected the older revision response field set.
The server had added exact chat-direction reread/count/revision/digest fields,
so the client correctly failed closed and the UI displayed a generic plan
verification blocker.

The client now exact-key verifies those four lineage fields and the shared plan
review controller recognizes a verified replacement-plan presenter as a
display source only. Approval remains separately gated by exact journey stage,
plan ID/version/hash and visible maximum credits. The focused browser test
proves the card is absent before the verified receipt, appears after it, and
still requires a fresh approval. The final full-source rerun then executed a
separate second 24-job package.

## Verification

Green after the fix:

- the exact 59-minute full-source command documented above, including both
  24-job packages and the verified 133.9 MiB final download;
- `npm run test:internal-testing:local-private-review-e2e` with the genuine
  canary source;
- `npm run test:internal-testing:supabase-auth-local-private-review-e2e` with
  the same genuine canary source;
- `database/canonical-v3-local/run-local-verification.sh`, including two-user /
  two-workspace RLS, CAS and idempotency checks, distributed media-ingest and
  pre-plan restart checks, four signed-in Chromium journeys, and a destructive
  59-table backup/reset/restore drill that now includes the durable
  upload-intent/target metadata authority;
- canonical V3 archive SHA-256
  `121da6a8a6ce56a3a7a3a54fb28ccb5cabd33b79a6903ee9c8d5effef30bb9a5`
  and restored-state SHA-256
  `5592d67c038249fadd3c7b0064060cffb773f50eecea1c20262016238459ad8d`;
- `npm run smoke:idempotency-boundary`;
- `npm run smoke:planning-exact-edit-preference-authority-port`;
- `npm run smoke:canonical-exact-review-lifecycle-client`;
- the source-led revision/final-download frontend client smoke;
- the focused canonical journey browser revision/reapproval test;
- `npm run smoke:canonical-source-led-plan-route`;
- `npm run smoke:edit-planning-authority`;
- `npm run smoke:editor-full-stack-private-review` (maximum eight-source,
  16-second, 4K stress profile with plan-v2 revision and accepted-final SHA);
- `npm run smoke:proven-tool-identities`;
- `npm run smoke:prod-tool-registry`;
- `npx tsc -b --pretty false`;
- `npm run lint`;
- `npm run build`;
- `npm run check:frontend-boundary` (`1,041` files); and
- `npm run check:secrets` (`7,002` files, no secret values).

`npm run typecheck:server -- --pretty false` is not reported green. Its exact
final rerun still found only the pre-existing optional graphics-runner module
baseline (`animejs`, ECharts, Satori, SVG.js, Three, Vega/Vega-Lite and Viz),
their existing dependent `unknown` typing errors, and the existing
`offline-media-binary-execution-smoke.ts` Buffer generic mismatch. None of
those diagnostics originates in this canary's changed files.

The canonical V3 local manifest independently verified 21 migrations and 196
pinned files with `remoteMutationAllowed=false` and
`productionAuthority=false`.

The currently observed canonical registry contains 50 production tool
identities, but that count is not a product cap. It may expand when a genuinely
distinct, released executable requires its own identity. Models, weights,
adapters, libraries, and in-process capabilities must not become fake tool
identities or separate charges. Motion Studio is outside this canary.

## Honest remaining gates

This pass does **not** satisfy the full public product goal because it uses:

- the local Supabase-authenticated stack, not deployed Google/Supabase
  production authentication;
- private local filesystem storage, not signed/resumable live GCS;
- an 8.6 MiB complete 66-second source through the authenticated local
  resumable protocol, not the 381 MiB original through hosted storage;
- a loopback single-host worker, not a deployed distributed worker;
- controlled/private estimate and reservation evidence, not official
  current-rate or invoice-backed customer settlement;
- a live reviewed AI planning-chat route, but no GPU generation operation
  because this approved source-led plan did not require generated media;
- no production artifact-malware/QA/private-delivery security attestation;
- no public delivery URL, CDN, retention workflow, or customer
  billing/settlement; and
- no live Supabase baseline reconciliation, production RLS/advisor evidence, or
  hosted recovery drill.

Therefore the correct statement is:

> A complete, genuine-media private source-led edit with verified AI planning
> chat is executable and revision-safe in the reviewed local
> Supabase-authenticated boundary. A real customer still cannot be promised
> hosted upload-to-professional-download until production auth, signed
> large-media storage, distributed workers, official cost/settlement,
> provider-operation evidence where required, artifact security/QA, live
> database hardening, and delivery evidence pass.
