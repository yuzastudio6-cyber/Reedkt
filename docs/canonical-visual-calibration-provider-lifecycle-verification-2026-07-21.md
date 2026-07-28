# Canonical Visual Calibration Provider Lifecycle Verification — 2026-07-21

## Verdict

`CANONICAL_VISUAL_CALIBRATION_PRIVATE_LIFECYCLE_ACCEPTED_PROVIDER_PRODUCTION_BLOCKED`

The canonical provider spine now admits one forward-only visual-calibration
operation for Motion Studio without adding a tool, queue, lease, provider
registry, candidate store, cost system, or commercial authority. It reuses the
existing approved execution package, package queue, claim/lease, sibling
one-use provider dispatch, create-only private candidate persistence, provider
attempt cost evidence, worker-resource evidence, terminal reconciliation, and
compact source-verified consumer receipt.

The retained proof is private injected evidence. It performs zero Google
provider requests, reads zero Secret Manager payloads, creates zero provider
candidates, and performs zero cloud, Supabase, billing, timeline, render,
deployment, or public-delivery mutation. It cannot be promoted to verified
backend runtime or production readiness.

## Frozen Operation

- operation: `provider.google.generate_visual_calibration_candidate.v1`
- provider boundary:
  `google_gemini_omni_flash_visual_calibration_provider_boundary`
- route: `gemini_omni_flash`
- current provider alias: `gemini-omni-flash-preview`
- work item: `generate_visual_calibration_candidate`
- worker class: `provider_worker`
- output: `provider_visual_calibration_video_mp4`, `video/mp4`, maximum
  67,108,864 bytes
- duration boundary: 3–10 seconds
- frame boundary: 24 FPS and at most 921,600 pixels
- execution mode: primary only

The preview alias is deliberately recorded as not being an immutable provider
revision. No code in this increment can qualify it, read a credential, or
activate transport.

## Exact Visual Authority

Authorization binds one immutable approved package and reservation to:

- exact tenant, project, edit, approved snapshot, package, work graph, job,
  work item, and expected output;
- exact Motion Studio production;
- exact Storytelling style-authority and idea-first production-authority
  component-reference digests already present in the package;
- exact calibration plan, version, digest, scenario, and scenario digest;
- exact Reference Contract, version, and digest;
- exact first-frame and last-frame private asset identities and checksums; and
- exact continuity contract, version, and digest.

The provider route, executable, output, and fallback policy are server-derived.
The browser cannot select or consume provider authority. Automatic fallback is
false; a different route requires a separately approved package and operation.

## Request And Reconciliation Policy

One attempt permits at most:

- one generation submission;
- twelve status reads;
- one result read;
- one binary download; and
- fifteen total lifecycle HTTP requests.

It permits no provider-side private-input upload, cancellation, retry,
fallback, redirect, address fallback, proxy/PAC, or resubmission. Status,
result, and download are continuations of the same generation attempt. An
unknown outcome must be reconciled against that fenced attempt before any new
submission. A new submission requires a fresh approved package and attempt.

## Internal Cost Boundary

The source-only rate snapshot uses the official public Gemini API pricing
captured on 2026-07-21:

- input: USD 1.50 per million tokens;
- video output: USD 17.50 per million output tokens; and
- video accounting: 5,792 output tokens per second.

Sources:

- <https://ai.google.dev/gemini-api/docs/pricing>
- <https://ai.google.dev/gemini-api/docs/omni>
- <https://ai.google.dev/gemini-api/docs/models/gemini-omni-flash>

The snapshot is expiring, source-only, and `productionQualified=false`. It is
not an invoice or account entitlement. Exact integer-micro calculation is
hash-bound and schema-revalidated. The focused example of 1,000 input tokens
plus five output-video seconds resolves to 508,300 micros (USD 0.5083).

Provider cost and provisional worker-infrastructure cost are independent
components. Failed and unknown attempts retain internal-cost lineage; an
unknown attempt has no final provider cost until exact usage reconciliation.
The compact receipt selects separately observed worker CPU/memory evidence and
does not convert it into customer price, customer credits, ReEditPro service
fee, wallet mutation, billing, or charging authority.

## Source-Verified Consumer Receipt

`projectCanonicalVisualCalibrationConsumerReceipt` reopens canonical sources
and verifies:

- approved package component references and exact visual context;
- queue job, claim/lease, delivery attempt, and terminal completion;
- one-use provider dispatch and safe terminal/reconciliation lineage;
- exact route/model and typed lifecycle-request breakdown;
- create-only MP4 identity, MIME, size, checksum, output-set digest, and
  readback evidence;
- provider usage/rate-card evidence;
- observed worker-resource/infrastructure-rate evidence; and
- closed credential, request-body, caller-route, provider-URL, local-path,
  browser, commercial, selection, render, and production boundaries.

Missing worker evidence, changed package references, changed visual context,
changed attempt/lease/terminal lineage, malformed MP4 bytes, changed cost math,
or a stale rate/authorization fails closed. The resulting evidence class is
`private_injected_nonprovider_test` and its promotion class is
`non_promotable_private_injected`.

Motion Studio should consume the compact receipt and these backend exports,
not import or duplicate the underlying queue and stores:

- `createCanonicalProviderOperationRegistryV4`;
- `createCanonicalProviderWorkAuthorizationV4`;
- `executePrivateInjectedVisualCalibrationLifecycle`;
- `reconcilePrivateInjectedVisualCalibrationUnknown`; and
- `projectCanonicalVisualCalibrationConsumerReceipt`.

## Verification

Focused checks passed with exit code `0`:

- `npm run smoke:canonical-private-visual-calibration-provider-lifecycle`;
- `npm run smoke:canonical-private-provider-work-lifecycle`;
- `npm run smoke:canonical-private-multi-output-provider-work-lifecycle`;
- `npm run smoke:canonical-private-synchronized-foley-provider-lifecycle`;
- `npm run smoke:private-worker-resource-usage-cost-evidence`;
- `npm run smoke:canonical-private-media-streaming-output`;
- `npm run smoke:canonical-private-audio-streaming-output`;
- `npm run report:proven-tools`;
- `npm run smoke:canonical-multi-source-final-composition`;
- `npm run smoke:canonical-private-color-execution`;
- `npm run smoke:offline-remotion-streaming-output`;
- `PLAYWRIGHT_REUSE_SERVER=false npm run qa:canonical-journey-ui` (11/11);
- `npm run typecheck:server -- --pretty false`; and
- `npm run typecheck:api -- --pretty false`.

The shared resource-usage coverage now reports 50 tool operations and four
separate provider operations, for 54 exact metering contracts.

The V34 canonical aggregate started at `2026-07-21T21:47:07.375Z` and ran for
3,385,114 ms. It completed its first 33 of 45 stages, including the real
six-hour/255-job long-form proof, cross-chunk delivery, 4K H.264/AAC output,
actual Chromium MediaSource playback, planning/approval/package/queue gates,
and the 76-operation resource-cost registry. Stage 34 then hit the fixed
120-second structured-Python Docker timeout while the machine was under
parallel external test load. It recorded `runtime_unavailable` and exited
nonzero before running the final 11 stages.

That aggregate result is retained as a failed continuous run, not rewritten as
45/45. After the competing load cleared, both the exact Python runtime
(`npm run smoke:offline-python-structured-execution`, 24/24) and the exact
failed aggregate stage (`npm run smoke:canonical-private-tool-dispatch`, all 50
tool identities) passed unchanged. Every unrun suffix stage then passed
individually, including the real multi-source composition, 4K professional
color, streamed 4K Remotion, all four provider contracts, streaming storage,
and the 11-case browser journey. No timeout or production policy was loosened.
A fresh uninterrupted V34 45/45 run therefore remains desirable before a
same-SHA release, while the bounded visual-calibration lifecycle proof is
accepted on its focused, exact-stage, suffix, static, and browser evidence.

Verification also exposed two stale fixtures and corrected them without
changing production behavior: the professional-color smoke now carries its
already-issued exact preference planning revision/fingerprint, and the browser
journey now consumes the read-only canonical planning-authority envelope with
zero planning-time preference writes.

## Closed Gates

Still false or unresolved:

- immutable provider revision qualification for the preview alias;
- real account, model access, region, quota, funds, data-use, and retention
  qualification;
- live server-only Secret Manager binding and provider transport;
- exact production request builder, response parser, polling, cancellation,
  and binary-download implementation;
- qualified distributed queue, database, private GCS input/output, crash and
  multi-replica unknown-outcome recovery;
- deployed worker identity/resource observation and invoice reconciliation;
- objective visual-calibration QA, human review, and accepted selection;
- remote Supabase/Auth/RLS/Storage and same-release staging acceptance;
- customer pricing, credits, service fee, wallet, billing, render/export,
  deployment, public delivery, external beta, and production readiness.

No provider, Secret Manager, cloud, remote Supabase, billing, deployment,
public-delivery, push, SQL, migration, or package-lock action occurred.
