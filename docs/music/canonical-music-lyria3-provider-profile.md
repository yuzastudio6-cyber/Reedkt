# Canonical Music Lyria 3 provider profile

Status: `fixture_qualified_live_activation_pending_external_evidence`

Verified on 2026-08-04 against current official Google Cloud documentation.

## Frozen profile

- Profile key: `music.provider.google_lyria_3_pro_preview.v2`
- Profile version: `2.0.0`
- Model: `lyria-3-pro-preview`
- Clip model: `lyria-3-clip-preview`
- API: `v1beta1` Interactions API
- Endpoint: `POST https://aiplatform.googleapis.com/v1beta1/projects/{project}/locations/global/interactions`
- Region: `global`
- Output: `audio/mpeg`, 44.1 kHz, 192 kbps
- Lyria 3 Pro maximum duration: 184 seconds
- Lyria 3 Clip maximum duration: 30 seconds
- Request storage: explicitly `false`
- Live output cardinality: one audio output per admitted interaction
- Current listed price: USD 0.08 per Pro song up to three minutes; USD 0.04 per 30-second clip

The canonical request uses only the documented `model`, `input`, `store`, and
`background` fields. Legacy Lyria 2 `predict`, `negative_prompt`, `seed`, and
`sample_count` request shapes are not treated as Lyria 3 authority.

The provider cost is converted through immutable rate card
`music.rate_card.v2.2026-08-04`; one ReEditPro credit is USD 0.10, the rate-card
hash is retained in result evidence, service fees are excluded, and estimating
or recording this internal cost does not mutate a wallet.

## Runtime boundary

`GoogleLyria3InteractionsTransport` accepts only the exact Google HTTPS host,
the versioned global Interactions path, the two frozen model IDs, and
`store=false`. It rejects redirects, alternate hosts, query parameters,
unexpected MIME types, oversized responses, malformed base64, and unexpected
output cardinality. Credentials come from an injected server-only access-token
loader and never enter Music requests, artifacts, receipts, logs, or browser
projections.

HTTP 5xx, timeout, abort, and ambiguous transport failures become
`unknown_outcome`; Music does not blindly resubmit. The provider-attempt store
requires reconciliation first and blocks when the provider supplies no safe
reconciliation path.

Each cue attempt also carries an immutable attempt fingerprint binding the
cue, exact route, provider profile, composition brief, compiled prompt,
candidate count, approved snapshot, reservation, and execution mode. Reusing
an idempotency key with different immutable inputs fails closed.

Provider audio is untrusted until it is written through the repository's
private create-only artifact boundary, checksum-verified, decoded, analyzed,
selected, processed through Sound v4 when needed, and evaluated by Music QA.

## Fixture evidence

The deterministic injected transport returns real WAV fixture bytes through
the same provider adapter and canonical Music execution graph. Acceptance
processes every returned candidate independently and proves that selection is
not provider-array order.

Fixture evidence does not prove a Google account, a live provider call,
commercial approval, zero-retention entitlement, deployed IAM, live pricing,
or production output quality.

## Controlled private canary

Run:

```text
npm run canary:music:lyria
```

The command is blocked unless all named account, privacy, retention,
commercial, rate, deployed-runtime, project, and explicit confirmation gates
are present. Its request is synthetic, instrumental, contains no customer
media, uses one candidate, uses `store=false`, and privately ingests the output.
It never promotes the route to production qualification automatically.

CI verifies only the fail-closed path:

```text
npm run smoke:music-lyria-canary-fail-closed
```

## Official sources

- [Generate music with Lyria](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/music/generate-music)
- [Lyria 3 model card](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/lyria/lyria-3)
- [Interactions API](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/interactions-api)
- [Zero data retention](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/zero-data-retention)
- [Generative AI pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)
