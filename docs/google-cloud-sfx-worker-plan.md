# Google Cloud SFX Worker Plan

## Purpose

This document describes the future Google Cloud deployment shape for SoundSync SFX generation workers. RP-SFX-11 does not deploy anything, create resources, call providers, store files, or connect to Supabase.

## Future Architecture

A future Cloud Run Job or Cloud Run service will receive a job ID or generation request ID. The worker will load context from Supabase using a secure service-role backend runtime, then enforce approval and credit gates before generation.

The future worker sequence is:

1. load job and generation request
2. load approved edit plan snapshot
3. verify credit estimate approval
4. verify credit reservation
5. load SFX event plan
6. load provider route
7. load prompt plan
8. check approved internal SFX library first
9. load provider key reference from Secret Manager
10. call Mirelo or MMAudio in a future real-integration milestone
11. store output in Cloud Storage
12. create generated asset and SFX records
13. run trim and hit alignment
14. create mix plan
15. run SFX QA
16. store usage and library-candidate metadata
17. update worker events and job status
18. handle failure, release, spend, or refund paths through the credit service

## Provider Boundaries

Mirelo SFX V1.5 is the future production SFX provider. MMAudio V is the future draft/basic/pro fallback and video-conditioned helper. ReeditPro Internal Library is the future first-choice source when an approved reusable sound exists.

Provider secrets must never be stored in frontend code, database rows, logs, prompts, or worker payloads. Workers should receive only Secret Manager reference names.

RP-SFX-12 adds a mock-first provider adapter contract that future Cloud Run workers can call after validation. Real provider mode remains fail-closed until official provider docs, secure Secret Manager access, storage, retry, credit spend/refund, and QA paths are implemented.

## Storage Boundary

Generated audio output should be written to Cloud Storage only by secure backend workers. Frontend code should receive safe metadata and preview URLs only after QA and access checks.

## Credit Boundary

Generation must not start until the edit plan is approved, the credit estimate is approved, and credits are reserved. Real spend/refund behavior belongs to a future credit-service milestone.

## Placeholder Environment Variables

Use placeholders only. Do not commit real values.

```text
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_REGION=
GOOGLE_CLOUD_STORAGE_BUCKET=
GOOGLE_SECRET_MIRELO_API_KEY_NAME=
GOOGLE_SECRET_MMAUDIO_API_KEY_NAME=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Mock-Only Status

RP-SFX-11 models the worker contract and event flow locally. It does not run `gcloud`, create Artifact Registry images, deploy Cloud Run, read Secret Manager, connect to Supabase, upload to Cloud Storage, or call SFX providers.

Future real-provider work after RP-SFX-12 should replace only the disabled real-client placeholders after security, terms, cost controls, retries, QA, and refund paths are reviewed.
