# Gemini Omni B-roll transport

Status: implemented behind private, owner-confirmed canary authority; not
production-qualified.

The provider source of truth is Google's current
[Gemini Omni Flash guide](https://ai.google.dev/gemini-api/docs/omni) and
[Files API reference](https://ai.google.dev/api/files). The configured model is
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
  in the ephemeral request.
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
