# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Envelope Contract

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_envelope_contract_defined_no_invocation`.

This document records the backend-only private invocation envelope for the Qwen2.5-VL 7B Cloud Run GPU worker. It is a contract and smoke surface only. It does not resolve a service URL, resolve an audience, create an auth header, fetch an identity token, invoke Cloud Run, run model inference, dispatch a worker, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Scope

The envelope builder accepts the existing approved-snapshot queue fixture only after:

- the local queue contract validates;
- the private invoke config candidate validates;
- invocation remains disabled;
- service URL and audience remain backend-resolved future values;
- auth material is absent from the envelope.

The envelope is accepted for future backend transport shaping only. It is not accepted for current runtime execution.

## Runtime Path

Future execution must keep this path:

```text
user/chat request
→ structured findings and edit intents
→ approved plan snapshot
→ credit reservation
→ queue lease
→ bounded Qwen runtime request
→ private Cloud Run invocation
```

Raw chat text must not become a direct worker input. Workers execute approved snapshot payloads, not raw prompts.

## Envelope Shape

The future request envelope is:

- method: `POST`
- path: `/`
- content type: `application/json`
- max body bytes: `65536`
- body source: approved-snapshot local queue payload
- required identifiers: approved plan snapshot ID, job ID, idempotency key
- schema version: `qwen2_5_vl_cloud_run_gpu_runtime_request_v1`

The envelope explicitly excludes:

- service URL
- audience value
- authorization header
- identity token
- provider credentials
- service-role material
- public media URLs
- signed URL source-of-truth references

## Accepted Metadata

The valid queue fixture and valid private invoke config candidate are accepted for future transport metadata only:

- `validQueueFixtureAcceptedForEnvelope=true`
- `validConfigCandidateAcceptedForEnvelope=true`
- `envelopeAcceptedForFutureTransport=true`
- `invocationAllowedNow=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `identityTokenFetched=false`
- `inferenceRun=false`

## Refused Inputs

The envelope builder refuses:

- invalid approved-snapshot queue payloads;
- missing approved snapshot references;
- missing credit reservation references;
- missing queue lease references;
- signed URL source-of-truth payloads;
- raw prompt payload fields;
- enabled runtime gates;
- model policy mismatches;
- private invoke config candidates that enable invocation now;
- config candidates that store concrete service URL values.

## Current Blocker

The private invocation preflight reached local `gcloud` project/account checks, then blocked on interactive reauthentication before service describe, IAM policy read, identity-token fetch, or private invocation could occur. That remains an external user-side auth refresh step.

## No-Action Confirmation

This contract:

- does not read environment values;
- does not store a service URL;
- does not create an auth header;
- does not fetch an identity token;
- does not send a Cloud Run request;
- does not import or load the model;
- does not initialize vLLM;
- does not run inference;
- does not dispatch workers;
- does not mutate Supabase;
- does not execute SQL;
- does not create generated assets;
- does not create public artifacts;
- does not create signed URLs;
- does not mutate credits.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_46-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation`
