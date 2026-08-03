# Mirelo SFX 1.6 provider profile

Status: fixture-qualified, production blocked.

## Canonical identity

- Tool key: `mirelo_sfx`
- Tool version: `1.6`
- Provider profile: `mirelo.sfx.1.6.v1`
- Text profile: `sound.mirelo.text_sfx_1_6.v1`
- Video profile: `sound.mirelo.video_sfx_1_6.v1`
- Canonical routes: `sound.route.generate.text_sfx.v1`, `sound.route.generate.video_sfx.mirelo.v1`, and `sound.route.ambience.generate_or_extend.v1`
- Legacy alias `mirelo_sfx_v1_5`: deprecated compatibility data only; it cannot authorize canonical execution.

## Official API surface reviewed

The server adapter models these official SFX 1.6 surfaces:

- asset creation under `/v2/assets`;
- text-to-SFX sync and preflight under `/v2/text-to-sfx/v1.6/...`;
- video-to-SFX sync, async jobs, and preflight under `/v2/video-to-sfx/v1.6/...`.

The exact request and response contract remains pinned by fixture tests and must be revalidated against the live account before production. Official reference: https://www.mirelo.ai/api-docs.

The current provider documentation describes text-to-SFX, video-to-SFX, audio editing, audio extension, inpainting, sync/async operation, assets, and preflight. The SFX 1.6 model page describes video-conditioned SFX, extension, loopable ambience, and inpainting: https://www.mirelo.ai/models/1-6.

## Bounded request policy

The adapter accepts only server-owned structured requests with:

- approved snapshot and hash;
- credit reservation;
- private output scope;
- idempotency and attempt identity;
- exact route/tool/operation/profile binding;
- privacy, commercial, and retention approval flags;
- bounded duration and candidate count;
- bounded prompt or private visual proxy;
- preflight credit ceiling;
- timeout and unknown-outcome policy.

The UI, Head of Orchestra, peer skills, and workers never receive the API token. The token is requested only through an injected server credential provider at transport time. Authentication values are not returned or persisted.

## Provider-output policy

All provider output is untrusted until privately ingested and validated. Signed upload and result URLs must use HTTPS without embedded credentials and must match the versioned provider-network host allowlist. An unexpected host fails closed and is never fetched. The current fixture-qualified profile permits `mirelo.ai` and its subdomains; a live canary must verify the provider's actual signed-URL hosts before that allowlist can be approved for production. Result URLs are used ephemerally for ingestion and are not durable project artifacts. Downloads and private visual proxies have bounded byte limits, and the private visual bytes must match the approved artifact hash before any request is sent. Audio is decoded, validated, analyzed, synchronized, mixed, and QA-checked before a selected private artifact is committed.

If a response uses a video carrier, only the audio track may be extracted. Any provider-returned visual is discarded and can never replace the approved project visual.

## Attempts, retries, and reconciliation

Every submission is bound to an idempotency key and attempt record. A timeout or transport failure that may have submitted the request becomes `unknown`. Unknown outcomes must be reconciled; blind resubmission is prohibited. Automatic fallback is permitted only through the route manifest and never when it would increase approved cost without fresh approval.

## Pricing and rate evidence

Mirelo’s current public pricing page lists SFX 1.6 in provider credits per generated second: https://www.mirelo.ai/pricing.

`sound.rate_snapshot.mirelo_2026_08_03` records 10 provider credits per generated second separately from the tool manifest. It marks the USD conversion as unknown and omits `unitCostUsd` because no account-specific conversion has been verified. This prevents an unknown cost from being misread as free generation.

## Commercial, privacy, and safety boundary

The paid-plan commercial-use rules and output rights are governed by the current terms: https://www.mirelo.ai/terms. Inputs must comply with the provider AUP and the project must hold the required rights: https://www.mirelo.ai/acceptable-use-policy.

The current privacy policy states that certain content may be used to develop or improve the service, including AI-model training, with a contact-based opt-out: https://www.mirelo.ai/privacy. A project-appropriate uploaded-asset retention duration has not been verified. Production therefore requires explicit privacy, retention, commercial-account, and content-rights approval.

## Production blockers

- no live private canary evidence;
- no deployed worker and health evidence;
- no approved paid commercial-account evidence;
- no approved project privacy/retention evidence;
- no verified account-specific USD rate conversion;
- no live quota and reconciliation evidence;
- no production-level generated-output QA evidence.

Availability alone cannot clear these blockers. Production requires newly published production-qualified tool and route versions backed by evidence.

## Private canary

The canary command is intentionally fail-closed:

```text
npm run canary:sound-mirelo-private
```

It requires all explicit opt-in environment gates, approved fixture media, a private output root, account/commercial/privacy/retention evidence, rate evidence, and a configured secret. The normal smoke suite never runs the paid canary.
