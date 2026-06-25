# AI Video B-roll Generation Checksum / Private Cache Policy

Status: `ai_video_broll_gen_2_checksum_private_cache_policy_no_execution`

This Gate 2 policy defines how a later approved model-weight download proof must handle checksums and private cache paths. It does not create cache directories, download weights, compute checksums, upload storage objects, create signed URLs, or expose public artifacts.

## Checksum Requirements

- Use `sha256` for every future model file.
- Record checksum per file, not only per model family.
- Record byte size and source URL with the checksum.
- Record the exact model card and license URL used for the file.
- Reject any weight file that cannot be tied to an approved source URL.
- Reject any checksum collected from a public forum, unverified mirror, or unsigned third-party bundle unless separately approved.

## Private Cache Requirements

- Cache path must be private and gitignored.
- Cache path must not be under `public/`, `dist/`, `dist-server/`, `src/`, `server/`, `docs/`, or tracked source.
- Cache path must not be a signed URL, public URL, or public bucket path.
- Cloud storage, GCS, Artifact Registry, and model registry paths remain future owner handoffs and are not created in Gate 2.
- Any future cache proof must include cleanup or retention evidence.

## Source Priority

1. Official Hugging Face model repository owned by the model publisher.
2. Official ModelScope model repository owned by the model publisher.
3. Official GitHub release only if the model publisher uses GitHub releases for weights.
4. Any other source is blocked until compliance and provider/runtime owners approve it.

## Blocked Values

Future manifest and cache records must not include:

- Service-role keys.
- API keys.
- Provider credentials.
- Database passwords.
- Signed URL tokens.
- Public object URLs as source of truth.
- Raw prompts as worker payloads.
- Generated media files in tracked source.

## Gate 2 No-Execution Result

No model weights are downloaded. No checksum is computed. No private cache is created. No GCP, Supabase, SQL, Docker, worker, provider, media, render, billing, beta, or production action occurs.
