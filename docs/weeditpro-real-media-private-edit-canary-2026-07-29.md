# WeEditPro Real-Media Private Edit Canary

Status date: 2026-07-29
Verdict: `private_executable` for the reviewed single-host loopback boundary; not hosted, external-beta, or production ready

This is the first observed browser-to-backend WeEditPro canary in this checkout
that uses genuine talking-head media and completes the bounded edit lifecycle
through an exact revision, fresh reapproval, second render, accepted private
review, and verified final download. The journey passed in both the
runner-isolated `local_test` mode and the local Supabase-authenticated mode. It
is not evidence for hosted production authentication, large-object cloud
upload, distributed workers, customer billing, or public delivery.

## Input provenance

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

## Executed commands

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

## Observed lifecycle

The final run proved all of the following in one browser journey:

1. signed-in browser session in both runner-isolated and local
   Supabase-authenticated modes;
2. project and named edit creation;
3. real MP4 upload intent, private byte storage, FFprobe inspection,
   finalization, SHA-256 authority, and source readback;
4. source-only Current Edit Preferences;
5. confirmed source order, output frame, cleanup policy, and Edit Brief marker;
6. server-derived canonical plan, confirmed frame, frame-based MasterTiming,
   visible credit estimate, and explicit approval;
7. immutable approved snapshot and separate execution-package request;
8. server-owned five-job work graph and confined private media execution;
9. playable/downloadable first private review;
10. exact caption replacement saved as the private-review decision;
11. server reread of the prior snapshot, source, locked preferences, immutable
    Edit Brief, and revision intent;
12. plan v2 with a fresh estimate and no reuse of plan-v1 approval;
13. explicit reapproval, second package, second canonical execution, and second
    private review;
14. explicit acceptance of the revised private review;
15. authenticated accepted-final download whose bytes match the accepted
    revised review exactly; and
16. reload recovery of the accepted private-review state.

The browser supplied neither plan, timing, estimate, work graph, tool list,
artifact path, nor final-download path. Those identities were derived or
reread by the backend.

## Byte evidence

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

Both replacement plans were version 2. The last `local_test` plan hash was
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

## Verification

Green after the fix:

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
- `npm run smoke:canonical-source-led-plan-route`;
- `npm run smoke:edit-planning-authority`;
- `npm run smoke:editor-full-stack-private-review` (maximum eight-source,
  16-second, 4K stress profile with plan-v2 revision and accepted-final SHA);
- `npm run smoke:proven-tool-identities`;
- `npm run smoke:prod-tool-registry`;
- `npm run typecheck:server`;
- `npx tsc -b --pretty false`;
- `npm run lint`;
- `npm run build`;
- `npm run check:frontend-boundary` (`1,040` files); and
- `npm run check:secrets` (`5,819` files, no secret values).

The canonical V3 local manifest independently verified 21 migrations and 196
pinned files with `remoteMutationAllowed=false` and
`productionAuthority=false`.

The canonical registry remains exactly 50 production tool identities. Living
Frame remains an optional editing skill/capability and adds no fake production
tool IDs. Motion Studio is outside this canary.

## Honest remaining gates

This pass does **not** satisfy the full public product goal because it uses:

- either `local_test` or the local Supabase-authenticated stack, not deployed
  Google/Supabase production authentication;
- private local filesystem storage, not signed/resumable live GCS;
- a 6-second bounded excerpt, not the 381 MiB original through hosted storage;
- a loopback single-host worker, not a deployed distributed worker;
- controlled/private estimate and reservation evidence, not official
  current-rate or invoice-backed customer settlement;
- no live provider or GPU operation where a future approved plan requires one;
- no production artifact-malware/QA/private-delivery security attestation;
- no public delivery URL, CDN, retention workflow, or customer
  billing/settlement; and
- no live Supabase baseline reconciliation, production RLS/advisor evidence, or
  hosted recovery drill.

Therefore the correct statement is:

> A complete, genuine-media, provider-free private edit is executable and
> revision-safe in both reviewed loopback authentication modes. A real customer
> still cannot be promised hosted upload-to-professional-download until
> production auth, signed large-media storage, distributed workers, official
> cost/settlement, provider-operation evidence where required, artifact
> security/QA, live database hardening, and delivery evidence pass.
