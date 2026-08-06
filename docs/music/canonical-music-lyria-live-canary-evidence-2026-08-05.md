# Canonical Music Lyria live private-canary evidence

Date: 2026-08-05

Status: `live_private_canary_verified`, `production_route_promotion_not_automatic`

## Outcome

The canonical server-side Lyria 3 adapter completed a real private Google Cloud request with
profile `music.provider.google_lyria_3_pro_preview.v2` and model `lyria-3-pro-preview`.
Authentication used the approved ReEditPro Google Cloud identity and project `reeditpro`; no
browser, frontend, customer-media, or raw-credential path was involved.

The successful deployed execution was:

- Cloud Run Job: `reeditpro-music-lyria-private-canary`
- execution: `reeditpro-music-lyria-private-canary-w5nvh`
- region: `us-central1`; provider interaction region: `global`
- source commit: `170bc13d09f421b4fb5e9819d6e515019c9ab174`
- source tree: `5b3065c09fb318bf8f1507e49925973846085433`
- Cloud Build: `0401e265-cb32-4310-b307-a69b31cbe3ca` (`SUCCESS`)
- immutable image digest:
  `sha256:794791f9e4f7bb64b66c415f0d9d4e7ed0d74841923a21a4d86b499cfe41a36e`
- completion: `2026-08-05T16:37:07.859168Z`
- deployed execution duration: 77.29 seconds
- task result: one succeeded task, zero retries

The private canary returned one real MP3 candidate and produced this measured evidence:

- provider request ID present: yes
- output checksum:
  `5cfa904ea2bea1cbf2d7266fb120542e446a7e0d0e1b276a0a9a65caec267c0f`
- byte size: 1,476,245
- decode: succeeded
- duration: 61.257083 seconds
- sample rate: 44,100 Hz
- channels: 2
- integrated loudness: -12.9 LUFS
- true peak: +0.1 dBTP
- clipped-sample count: 5,501
- silence ratio: 0.0017222486363831146
- measured tempo evidence: 53.571 BPM
- provider cost: USD 0.08
- canary evidence hash:
  `706c8fcdf6718675f621a31ad0c6f8bb7837676acae887c83ed1230b37697ac1`

The positive true peak and clipped samples mean the raw provider output is not automatically a
final mastered asset. This is expected to remain an untrusted candidate until canonical Music
selection, Sound technical processing/limiting, and measured Music/Sound QA pass. The canary proves
live provider reachability, response parsing, private ingestion, checksum verification, decoding,
analysis, cost evidence, and fail-closed activation—not automatic final-output quality.

## Privacy, IAM, and execution controls

- request storage was explicitly `store=false`;
- the request used synthetic instrumental instructions and no customer media;
- the output was ingested into the job's private ephemeral scope and was not made public;
- no provider URL became artifact authority;
- credentials came from the attached service account through Application Default Credentials;
- no access token, provider response body, credential, private path, or signed URL was logged;
- the job ran as `sa-audio-soundsync-worker@reeditpro.iam.gserviceaccount.com`;
- the service account has the bounded project roles needed for the current worker boundary,
  including `roles/aiplatform.user`; it has no owner/editor role;
- the job used one task, one-way execution, `maxRetries=0`, and an immutable image digest;
- the canary did not promote a fixture, route, or top-level Music capability to production
  qualification automatically.

The active operator identity was verified as `aiediting@reeditpro.com`. The previously selected
personal/Yuza identity was not used for the successful build or canary.

## Failure and retry integrity

Two earlier deployed attempts failed before any provider request because the container omitted
required readable application files. Those attempts incurred no provider cost. After packaging was
fixed, Lyria returned a definite HTTP 400 policy rejection with no output and no provider cost. A
diagnostic build safely recorded only the sanitized provider instruction and response hash:

`Request blocked for an unspecified policy reason. Please modify your input and retry.`

No blind retry occurred. The provider prompt compiler was corrected first to use natural-language
structure, explicit seconds/BPM, policy-safe originality language, and no machine-enum or
artist/copy language. Exactly one corrected request was then submitted; it is the successful
execution recorded above. No unknown provider outcome was retried.

## Qualification boundary

This evidence closes the external question of whether the real Lyria endpoint can be authenticated,
called, decoded, measured, and costed from a deployed ReEditPro server runtime. It does not by itself
make every generated track production-ready, approve public delivery, bypass Music/Sound QA, or
authorize final mux/render/export. Product execution continues to require the canonical Music
service, exact approved scope, credit reservation, durable provider-attempt and artifact stores,
Sound processing, and final QA. Actual Head-of-Orchestra integration remains pending by design.

## Official provider sources

- [Generate music with Lyria](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/music/generate-music)
- [Lyria 3 model card](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/lyria/lyria-3)
- [Interactions API](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/interactions-api)
- [Zero data retention](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/zero-data-retention)
- [Generative AI pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)
- [Music generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/music/music-gen-prompt-guide)
