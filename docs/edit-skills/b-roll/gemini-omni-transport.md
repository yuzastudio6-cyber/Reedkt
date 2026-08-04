# Gemini Omni B-roll transport

Status: implemented behind private, owner-confirmed canary authority; not
production-qualified.

The provider source of truth is Google's current
[Gemini Omni Flash guide](https://ai.google.dev/gemini-api/docs/omni),
[Interactions API reference](https://ai.google.dev/api/interactions-api),
[model card](https://ai.google.dev/gemini-api/docs/models/gemini-omni-flash),
and [Files API reference](https://ai.google.dev/api/files). This contract was
reconciled against the official documentation on 2026-08-03. The configured model is
the preview alias `gemini-omni-flash-preview`; no immutable provider revision
has been accepted.

## Fixed route

- Operation: `provider.google.generate_b_roll_candidate.v1`
- Boundary: `google_gemini_omni_flash_b_roll_provider_boundary`
- Route: `gemini_omni_flash`
- Interactions endpoint:
  `https://generativelanguage.googleapis.com/v1beta/interactions`
- File metadata endpoint:
  `https://generativelanguage.googleapis.com/v1beta/files/{id}`
- Resumable upload endpoint:
  `https://generativelanguage.googleapis.com/upload/v1beta/files`
- Authentication: server-only `x-goog-api-key` from one pinned numeric Secret
  Manager version referenced by `GOOGLE_SECRET_GEMINI_API_KEY_NAME`.

Callers cannot supply the model, endpoint, credential, raw body, upload path,
download URL, polling ceiling, retry count, provider fallback, or executable.
The transport rejects redirects, has no hidden retry or provider fallback, and
permits one generation submission per fresh approved attempt.

## Supported request modes

- `text_to_video` with a server-owned text prompt.
- `image_to_video` with one exact checksum-bound approved image encoded only
  in the ephemeral request as `<FIRST_FRAME>`; an optional end frame is not
  active because interpolation is not dependable in the current guide.
- `reference_to_video` with one to six unique, checksum-bound, user-approved
  images. Every image must independently pass provenance, rights, privacy, and
  proof-safety gates. Six is the conservative ReeditPro ceiling demonstrated
  by the official guide, even though the API schema itself does not publish a
  higher dependable product limit.
- `edit_uploaded_video` with one exact checksum-bound approved MP4, the
  official resumable Files API, bounded `PROCESSING` reads, and an allowlisted
  file URI. Regional eligibility is decided before the transport.
- One approved refinement uses `previous_interaction_id`; the M8 refinement
  authority binds the prior immutable candidate and QA report, while rejecting
  a second refinement, route/concept/range substitution, automatic retry, and
  alternate-provider fallback.

The request asks for video output at the confirmed 16:9 or 9:16 crop-safe
frame, includes the official task value, stores the interaction for the one
potential approved refinement, and puts all avoid instructions in the regular
prompt because independent negative prompts and sampling controls are not
supported. B-roll prompts explicitly request one unbroken continuous scene,
no cuts, and no dialogue/music/SFX.

## Capability reconciliation

| Intended mode | B-roll classification | Enforced boundary |
| --- | --- | --- |
| Text to video | Supported internally | One 3–10 second, 720p, 24 fps candidate; 16:9 or 9:16 |
| First-frame image to video | Supported internally | Exactly one approved image and `<FIRST_FRAME>` |
| Reference images to video | Supported internally | Exactly 1–6 approved images and `<IMAGE_REF_0>` through `<IMAGE_REF_5>` |
| Uploaded-video editing | Supported internally, region-gated | One approved MP4, at most 10 seconds, via Files API |
| Conversational editing | Supported internally as refinement | Exactly one `previous_interaction_id` refinement after eligible QA rejection |
| Video reference | Unsupported, fail-closed | The guide says short video references may be admitted but are not processed correctly |
| Uploaded audio reference | Unsupported, fail-closed | The guide says uploaded audio references are unsupported |
| Multiple-video reasoning | Unsupported, fail-closed | No dependable provider behavior |
| Extension or interpolation | Unsupported, fail-closed | No active route or request field |
| Voice editing | Unsupported, fail-closed | No active route or request field |
| YouTube source | Unsupported, fail-closed | No active route or request field |

`store: true` is server-owned because the single conversational refinement
depends on prior interaction state. A missing, expired, or store-disabled prior
interaction cannot be replaced with caller state. Recognizable-person and
minor-image limits remain provider- and region-dependent; B-roll never treats
provider admission as rights, privacy, identity, or production qualification.

## Persistence and accounting

The raw API key, auth header, provider URL, temporary download URL, raw request
body, and raw response are never stored. Private operational state retains only
the interaction ID needed for bounded reconciliation plus hashes and sanitized
evidence. Provider media is accepted only as bounded MP4, written create-only
under the private root, and checksum-read back. No public artifact, automatic
selection, or timeline mutation is authorized.

Request counters distinguish upload negotiation, upload bytes, file status,
generation submission, interaction status, result metadata, and binary
download. The canary rate authority is an owner-confirmed ceiling, not a
production-qualified provider rate. Provider cost is tracked separately from
the currently unobserved transport infrastructure cost, and service fees are
excluded.

## Canary gates

`npm run canary:gemini-omni-b-roll` performs zero provider requests unless all
of these are exact:

- `REEDITPRO_CONFIRM_GEMINI_OMNI_BROLL_EXECUTE=true`
- `REEDITPRO_GEMINI_OMNI_BROLL_SAFE_FIXTURE_ID=b-roll-safe-illustrative-workflow-v1`
- `GOOGLE_SECRET_GEMINI_API_KEY_NAME` is the approved secret with a pinned
  numeric version
- `REEDITPRO_GEMINI_OMNI_BROLL_MAX_COST_MICROS` is a positive exact ceiling
- `REEDITPRO_GEMINI_OMNI_BROLL_RATE_MICROS_PER_SECOND` is a positive exact
  owner-confirmed rate
- `REEDITPRO_GEMINI_OMNI_BROLL_PRIVATE_ROOT` is an absolute private path

The built-in three-second fixture contains no people, faces, brands, text,
metrics, customer proof, private data, or recognizable property. The result is
private, never selected, never placed on a customer timeline, and never treated
as production evidence.
