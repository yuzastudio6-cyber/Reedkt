# SFX Provider Adapter Layer

## Purpose

RP-SFX-12 adds a mock-first provider adapter layer for SoundSync SFX Director. It prepares ReeditPro for future Mirelo SFX V1.5, MMAudio V, and internal-library generation paths without making real provider calls.

The adapter owns ReeditPro-controlled request and response contracts. It does not define or claim any undocumented Mirelo or MMAudio API endpoint, authentication header, transport schema, or response schema.

## Runtime Modes

The SFX provider integration mode is:

```text
mock | disabled | real
```

Default mode is `mock`.

- `mock`: uses deterministic local provider clients and `mock://generated-sfx/...` paths.
- `disabled`: returns a disabled result and does not generate a response.
- `real`: fails closed in this milestone. Browser/Vite runtime is blocked, secure backend credential references are required, and real clients return not-implemented results.

No mode in RP-SFX-12 imports provider SDKs, makes HTTP requests, creates audio bytes, uploads files, reads Supabase, or deploys cloud resources.

## Provider Roles

Mirelo SFX V1.5 is prepared as the future production SFX provider for premium transitions, title/chapter hits, Stroke Motion, Graphic Design reveals, Real Motion settles, CTA polish, and signature edits.

MMAudio V is prepared as the future lower-cost draft/basic/pro fallback and video-conditioned helper for timing experiments, ambience drafts, and motion-synced ideas.

The internal library provider checks for approved reusable SFX. When a mock approved match is supplied, it returns a library response and skips provider generation. When no match exists, it returns a no-match result.

`no_sfx` is a valid professional outcome and always blocks generation.

## Request Building

Provider requests include only ReeditPro-owned planning metadata:

- prompt and negative prompt
- duration to generate and duration needed
- output format
- target layer and use case
- timing anchor
- speech/music/ambience context
- mock scenario metadata

Requests never carry API keys, service-role keys, Secret Manager values, signed URLs, provider transport fields, or raw provider secrets.

## Response Parsing

The shared parser accepts normalized mock responses and unknown raw response-like objects. It extracts audio parts, text parts, MIME type, duration, storage path, and warnings.

Parser warnings are intentional. They protect future integration work from assuming that all providers return the same shape.

## Safety Gates

Provider calls are blocked when:

- provider mode is disabled
- real mode is unsafe or not implemented
- event, route, prompt, generation request, or credit reservation is missing
- edit plan is supplied but not approved
- credits are missing or not reserved
- SFX decision is `avoid` or `not_needed`
- route or prompt is `no_sfx`
- source-footage repair is attempted without explicit approval
- prompt warnings contain a critical/forced validation block
- requested generation duration is shorter than needed, except internal-library matching

These gates are defense-in-depth. RP-SFX-11 worker validation remains the primary execution gate.

## Worker Integration

The SFX worker now builds an adapter request, calls `generateSFXWithProvider` in mock mode, converts the normalized response back into the worker provider-response shape, and then continues through mock generated asset metadata, waveform hints, trim, hit alignment, mix, QA, usage, and library-growth decisions.

Internal-library matches still skip provider generation. No-match library scenarios fall back only when the route explicitly allows a fallback provider.

## RP-FIX-14 Project Editing Integration

The project SFX orchestrator now reaches this adapter through the existing mock SFX worker skeleton. Project-level provider routes can exercise Mirelo mock output, MMAudio mock output, internal-library matches, and no-SFX blocks from inside the editor workflow.

Real mode remains fail-closed. RP-FIX-14 does not add provider SDKs, HTTP calls, API keys, audio bytes, storage uploads, or Cloud Run execution.

## Secrets

`.env.example` contains placeholders only:

```text
SFX_PROVIDER_INTEGRATION_MODE=mock
MIRELO_SFX_MODEL_NAME=mirelo-sfx-v1.5
MMAUDIO_MODEL_NAME=mmaudio-v
MIRELO_API_KEY=
MMAUDIO_API_KEY=
GOOGLE_SECRET_MIRELO_API_KEY_NAME=
GOOGLE_SECRET_MMAUDIO_API_KEY_NAME=
```

Real values must not be committed. Future real integration should load provider credentials only from secure backend/worker runtime, preferably through Secret Manager reference names.

## Provider Docs Needed Later

Future real integration still needs official provider documentation for:

- authentication method
- request endpoint and schema
- response schema
- file delivery model
- polling/webhook behavior
- error codes and retry policy
- rate limits
- duration and output format limits
- licensing and reuse terms

Until those docs and production security controls exist, real clients remain placeholders.

## Mock-Only Boundaries

RP-SFX-12 does not call Mirelo, call MMAudio, connect to Supabase, read Secret Manager, create migrations, generate audio, process audio, render media, upload files, spend credits, integrate Stripe, or build mobile UI.

Next real-provider work should happen only after backend runtime, Secret Manager, storage, retries, credit spend/refund, provenance, QA, and terms review are approved.
