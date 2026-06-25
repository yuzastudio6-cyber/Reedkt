# AI Video B-roll Generation Weight Download / Storage Policy

Status: `ai_video_broll_gen_0_weight_policy_no_execution`

No weights are downloaded in Gate 0. No repository is cloned into tracked source. No local cache is created. No GCS, Artifact Registry, Supabase, storage object, signed URL, public artifact, provider call, worker execution, or model inference action occurs.

## Approved Source Requirement

Future weight download may use only owner-approved official sources with a recorded model card, license snapshot, version, checksum, and provenance review. Third-party mirrors, torrents, community bundles, and unverified ComfyUI packs are blocked unless separately approved by `COMPLIANCE_SECURITY` and `PROVIDER_GATEWAY_MODELS`.

## Checksum Requirement

Every future model file must have a planned checksum before download and a verified checksum after download. Checksum metadata must be stored as private evidence, never as a public URL or signed URL source of truth.

## Snapshot Requirements

- Model card snapshot.
- License snapshot.
- Repository commit/tag.
- Weight version.
- Commercial-use and redistribution review.
- Attribution/notice requirements.
- Reviewer and approval timestamp in a future owner-approved record.

## Storage Location Proposal

- Local proof cache: future local-only ignored cache path, never committed.
- Worker mount proposal: future private model-weight mount under an owner-approved worker image or private volume.
- Cloud proposal: future GCS or Artifact Registry policy placeholder owned by Google Cloud, Provider Gateway, Worker Runtime, and Compliance owners.

## Cleanup Policy

Future proofs must include cleanup steps, cache isolation, checksum validation, no package-lock churn, no tracked model files, and no generated video artifacts unless a later artifact policy explicitly permits.

## Signed URL / Public Artifact Policy

Signed URLs are never source of truth. Public model artifacts are blocked. Public generated B-roll artifacts are blocked. Any future sharing requires `PUBLIC_ARTIFACT_DELIVERY_POLICY` and product beta owner approval.

## Future Owner Gates

- `AI-VIDEO-BROLL-GEN-1`: license/provenance approval.
- `AI-VIDEO-BROLL-GEN-2`: weight source/checksum plan.
- `AI-VIDEO-BROLL-GEN-5`: controlled model weight download proof.
